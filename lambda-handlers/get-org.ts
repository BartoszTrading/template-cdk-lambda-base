import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Org, GetOrgsParams } from '../shared/types';

type Result = {
    data: Org[];
    }


export const handler: AppSyncResolverHandler<GetOrgsParams,Result>= async (event, context) => {
    return new Promise<Result>(async (resolve, reject) => {

        const ddbDocClient = await utils.getDDBDocClient();
        utils.logInfo(event, 'Event');
        const getOrg = await ddbDocClient.send(new QueryCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `userid = :id`,
            ExpressionAttributeValues: {
                ':id': event.arguments.getOrgsInput.userid
            }
        }));
        if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
            return reject('Organizacja nie istnieje');
        }
        const orgid = (getOrg.Items ?? [])[0]?.orgid as string;


        const getResults = await ddbDocClient.send(new QueryCommand({
            IndexName: 'orgid-index',
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `orgid = :id`,
            ExpressionAttributeValues: {
                ':id': orgid
            }
        }));
        utils.logInfo(getResults, 'GetResults');

        resolve({data: getResults.Items as Org[]});
    
}
)}