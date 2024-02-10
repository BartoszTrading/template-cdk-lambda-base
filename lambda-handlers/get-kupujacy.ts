import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Kupujacy, GetKupujacyParams } from '../shared/types';


type Result = {
    data: Kupujacy[];
    nextToken: string;
    }

export const handler: AppSyncResolverHandler<GetKupujacyParams,Result>= async (event, context) => {
    return new Promise<Result>(async (resolve, reject) => {
        try {
            utils.logInfo(event, 'Event');

            const ddbDocClient = await utils.getDDBDocClient();

            const queryCommandInput: QueryCommandInput = {
              TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
              ExclusiveStartKey : event.arguments.getKupujacyInput.nextToken ? JSON.parse(Buffer.from(event.arguments.getKupujacyInput.nextToken, 'base64').toString('ascii')) : undefined,
              ExpressionAttributeValues: {}
            }

            if (event.arguments.getKupujacyInput.buyerid) {
                queryCommandInput.KeyConditionExpression = `buyerid = :buyerid`;
                queryCommandInput.ExpressionAttributeValues = {
                    ...queryCommandInput.ExpressionAttributeValues,
                    ':buyerid': event.arguments.getKupujacyInput.buyerid
                }}

            else if (event.arguments.getKupujacyInput.orgid) {
                const getOrg = await ddbDocClient.send( new QueryCommand({
                    TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `userid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.getKupujacyInput.orgid
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
            else {
                return reject('Nie podano parametru');
            }

            const queryCommandOutput = await ddbDocClient.send(new QueryCommand(queryCommandInput));
            const result: Result = {
              data: queryCommandOutput.Items ? (queryCommandOutput.Items as Kupujacy[]) : [],
              nextToken: queryCommandOutput.LastEvaluatedKey ? Buffer.from(JSON.stringify(queryCommandOutput.LastEvaluatedKey)).toString('base64') : '',

            }
            resolve(result)



        }catch (error: any) {
            utils.logError(error);
            reject("error");
        }

    }
    )
}

