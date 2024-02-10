import { get } from "https";
import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { DeleteKupujacyParams, Kupujacy } from '/opt/types';
import { DeleteCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { TransactWriteItem } from '@aws-sdk/client-dynamodb';


export const handler: AppSyncResolverHandler<DeleteKupujacyParams, string> = async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {
        try{
            utils.logInfo(event, 'Event');

            const ddbDocClient = await utils.getDDBDocClient();

            const getKupujacyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `buyerid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.deleteKupujacyInput.buyerid
                    }
                })

            );
            

            if (getKupujacyOutput.Items && getKupujacyOutput.Items.length > 0){
                const kupujacyItems: Kupujacy = getKupujacyOutput.Items[0] as Kupujacy;

                if( kupujacyItems.auta && kupujacyItems.auta.length > 0){
                    const updateItem = kupujacyItems.auta.map(autoId => ({
                            Update: {
                                TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                Key: { autoid: autoId },
                                UpdateExpression: `remove buyerid`,
                            }
                    }));
                const deleteItem = [{
                    Delete: {
                        TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Key: {
                            buyerid: event.arguments.deleteKupujacyInput.buyerid 
                        }
                    }
                }];

                await ddbDocClient.send(new TransactWriteCommand({
                    TransactItems: [...updateItem, ...deleteItem]
                }));
                return resolve("Kupujący usunięty");
            }
        } else {
            return reject('Kupujący nie znaleziony');
        }
    }catch (error: any) {
        utils.logError(error);
        reject("error");
    }
}
)
}

