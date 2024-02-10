import { AppSyncResolverHandler } from "aws-lambda";
import * as utils from '/opt/utils';
import { DeleteSamochodyParams } from '/opt/types';
import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';



export const handler: AppSyncResolverHandler<DeleteSamochodyParams, string> = async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            utils.logInfo(event, 'Event');

            const ddbDocClient = await utils.getDDBDocClient();

            const getSamochodyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `autoid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.deleteSamochodyInput.autoid
                    }
                })

            );
            if (getSamochodyOutput.Items && getSamochodyOutput.Items.length > 0) {

                
                if (getSamochodyOutput.Items[0].buyerid && getSamochodyOutput.Items[0].buyerid !== "None") {
                    utils.logInfo("Kupujacy", getSamochodyOutput.Items[0].buyerid);
                    const getKupujacyOutput = await ddbDocClient.send(
                        new QueryCommand({
                            TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                            KeyConditionExpression: `buyerid = :id`,
                            ExpressionAttributeValues: {
                                ':id': getSamochodyOutput.Items[0].buyerid
                            },
                        })
                        );

                    if (getKupujacyOutput.Items && getKupujacyOutput.Items.length > 0) {
                        const kupujacyItems = getKupujacyOutput.Items[0];
                        if (kupujacyItems.auta && kupujacyItems.auta.length > 0) {
                            const index = kupujacyItems.auta.indexOf(event.arguments.deleteSamochodyInput.autoid);
                            console.log("Index", index);
                            if (index > -1) {
                                kupujacyItems.auta.splice(index, 1);
                            }
                        }

                        const PutKupujacyItem = [
                            {
                                Put: {
                                    TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                    Item: kupujacyItems
                                }
                            }
                        ]
                        const deleteItem = [
                            {
                                Delete: {
                                    TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                    Key: {
                                        autoid: event.arguments.deleteSamochodyInput.autoid
                                    }
                                }
                            }
                        ]

                        await ddbDocClient.send(
                            new TransactWriteCommand({
                                TransactItems: [...PutKupujacyItem, ...deleteItem]
                            })
                        );
                    }
                
                }else {
                    utils.logInfo("Samochod", getSamochodyOutput.Items[0].autoid);
                    await ddbDocClient.send(
                        new DeleteCommand({
                            TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                            Key: {
                                autoid: event.arguments.deleteSamochodyInput.autoid
                            }
                        })
                        );
                    }
                return resolve("Samochód usunięty");
            } else {
                return reject('Samochód nie znaleziony');
            }
        }
        catch (error: any) {
            utils.logError(error);
            reject("error");
        }
    }
    )
}
