
import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Samochod, GetSamochodyParams } from '../shared/types';


type Result = {
    data: Samochod[];
    nextToken: string;
    }


export const handler: AppSyncResolverHandler<GetSamochodyParams,Result>= async (event, context) => {
    return new Promise<Result>(async (resolve, reject) => {
        try {

            utils.logInfo(event, 'Event');

            const ddbDocClient = await utils.getDDBDocClient();

            
            const queryCommandInput: QueryCommandInput = {
              TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
              ExclusiveStartKey : event.arguments.getSamochodyInput.nextToken ? JSON.parse(Buffer.from(event.arguments.getSamochodyInput.nextToken, 'base64').toString('ascii')) : undefined,
              ExpressionAttributeValues: {}
            }

            if (event.arguments.getSamochodyInput.autoid) {
              queryCommandInput.KeyConditionExpression = `autoid = :autoid`;
              queryCommandInput.ExpressionAttributeValues = {
                ...queryCommandInput.ExpressionAttributeValues,
                ':autoid': event.arguments.getSamochodyInput.autoid
            }}

            else if (event.arguments.getSamochodyInput.orgid) {
                const getOrg = await ddbDocClient.send( new QueryCommand({
                    TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `userid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.getSamochodyInput.orgid
                    }
                }));
                if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
                    return reject('Organizacja nie istnieje');
                }
                const orgid = (getOrg.Items ?? [])[0]?.orgid as string;


                queryCommandInput.IndexName = 'orgid-index';
                queryCommandInput.KeyConditionExpression = `orgid = :userid`;
                queryCommandInput.ExpressionAttributeValues = {
                    ...queryCommandInput.ExpressionAttributeValues,
                    ':userid': orgid
                }
            }
            
            else if (event.arguments.getSamochodyInput.buyerid) {
                queryCommandInput.IndexName = 'buyerid-index';
                queryCommandInput.KeyConditionExpression = `buyerid = :buyerid`;
                queryCommandInput.ExpressionAttributeValues = {
                  ...queryCommandInput.ExpressionAttributeValues,
                  ':buyerid': event.arguments.getSamochodyInput.buyerid
              }
            }else {
                return reject('Nie podano parametru');
            }
            const queryCommandOutput = await ddbDocClient.send(new QueryCommand(queryCommandInput));
            utils.logInfo(queryCommandOutput.Items, 'QueryCommandInput');
            if( queryCommandOutput.Items && queryCommandOutput.Items.length !== 0){
                queryCommandOutput.Items.forEach((item) => {
                    if (item.timestamp) {
                        item.timestamp = parseInt(item.timestamp,10);
                    }})
                    
                }
                utils.logInfo(queryCommandOutput.Items, 'QueryCommandInput');
            const result: Result = {
              data: queryCommandOutput.Items ? (queryCommandOutput.Items as Samochod[]) : [],
              nextToken: queryCommandOutput.LastEvaluatedKey ? Buffer.from(JSON.stringify(queryCommandOutput.LastEvaluatedKey)).toString('base64') : '',

            }

            resolve(result)

        }
        catch (error: any) {
            utils.logError(error);
            reject("error");
        }
    }
    )
}
