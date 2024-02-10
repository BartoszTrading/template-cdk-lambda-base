import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { UpdateOrgParams } from '/opt/types';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';


export const handler: AppSyncResolverHandler<UpdateOrgParams,String>= async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {

        const ddbDocClient = await utils.getDDBDocClient();

        const updateResult = await ddbDocClient.send(new UpdateCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            Key: {
                'userid': event.arguments.updateOrgInput.userid
            },
            UpdateExpression: 'SET #name = :orgid', // Use #name as a placeholder for the reserved keyword
            ExpressionAttributeValues: {
                ':orgid': event.arguments.updateOrgInput.name
            },
            ExpressionAttributeNames: {
                '#name': 'name' // Map #name to the actual property name
            }
        }));
        resolve("sukces");
    });
}
