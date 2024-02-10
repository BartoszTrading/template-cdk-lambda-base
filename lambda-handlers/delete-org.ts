import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { DeleteOrgParams } from '/opt/types';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { get } from 'http';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';



export const handler: AppSyncResolverHandler<DeleteOrgParams,string>= async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {

        const ddbDocClient = await utils.getDDBDocClient();

        const getOrg = await ddbDocClient.send(new QueryCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `userid = :id`,
            ExpressionAttributeValues: {
                ':id': event.arguments.deleteOrgInput.userid
            }
        }));

        if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
            return reject('Organizacja nie istnieje');
        } else {
            const update = await ddbDocClient.send(new UpdateCommand({
                TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Key: {
                    'userid': event.arguments.deleteOrgInput.userid
                },
                UpdateExpression: 'SET orgid = :orgid, prevorgid = :prevorgid',
                ExpressionAttributeValues: {
                    ':orgid': getOrg.Items && getOrg.Items[0].prevorgid ? getOrg.Items[0].prevorgid : "DELETED_"+uuidv4(),
                    ':prevorgid': getOrg.Items && getOrg.Items[0].orgid ? getOrg.Items[0].orgid : "DELETED_"+uuidv4()
                }
            }))
        }
        resolve("sukces")
    }
)}