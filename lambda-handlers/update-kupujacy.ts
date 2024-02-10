import { UpdateKupujacyParams } from "/opt/types";
import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { Kupujacy } from "/opt/types";
import { TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';



export const handler: AppSyncResolverHandler<UpdateKupujacyParams ,Kupujacy>= async (event, context) => {
    return new Promise<Kupujacy>(async (resolve, reject) => {
        try {

            //1.Usuwamy wszystkich buyerid z aut, potem dodajemy

            utils.logInfo(event, 'Event');
            
            

            const ddbDocClient = await utils.getDDBDocClient();
            
            const getKupujacyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `buyerid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.updateKupujacyInput.buyerid
                    }
                })
                );
                
            utils.logInfo("1", 'Event');
            const transactItems: TransactWriteItem[] = [];
            
            if (getKupujacyOutput.Items && getKupujacyOutput.Items.length >0){
                const updatedKupujacy = { ...getKupujacyOutput.Items[0] } as Kupujacy;
                
                

                const deleteIds = updatedKupujacy.auta.filter(autoId => !event.arguments.updateKupujacyInput.auta.includes(autoId));

                const deleteBuyers = deleteIds.map(autoId => ({
                    Update: {
                        TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Key: { autoid: autoId },
                        UpdateExpression: `remove buyerid`,
                    }
                }));
                const addIds = event.arguments.updateKupujacyInput.auta.filter(autoId => !updatedKupujacy.auta.includes(autoId));

                const TransUpdate = addIds.map(autoId => ({
                    Update: {
                        TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Key: { autoid: autoId },
                        UpdateExpression: `set buyerid = :buyerid`,
                        ExpressionAttributeValues: {
                            ':buyerid': updatedKupujacy.buyerid
                        },
                    }
                }));
                utils.logInfo("2", 'Event');
                if (event.arguments.updateKupujacyInput.imie) updatedKupujacy.imie = event.arguments.updateKupujacyInput.imie;
                if (event.arguments.updateKupujacyInput.nazwisko) updatedKupujacy.nazwisko = event.arguments.updateKupujacyInput.nazwisko;
                if (event.arguments.updateKupujacyInput.email) updatedKupujacy.email = event.arguments.updateKupujacyInput.email;
                if (event.arguments.updateKupujacyInput.telefon) updatedKupujacy.telefon = event.arguments.updateKupujacyInput.telefon;

                if (event.arguments.updateKupujacyInput.auta) updatedKupujacy.auta = event.arguments.updateKupujacyInput.auta;



                utils.logInfo("3", 'Event');

                const transactionAdd = [{
                    Put: {
                        TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Item: updatedKupujacy
                    }
                }];

                utils.logInfo("4", 'Event');
                await ddbDocClient.send(new TransactWriteCommand({
                    TransactItems: [...deleteBuyers, ...TransUpdate, ...transactionAdd]
                }));
                return resolve(updatedKupujacy);
            }
                } catch (error: any) {
                    utils.logError(error);
                    reject("error");
                }
                }
                )
                }

            