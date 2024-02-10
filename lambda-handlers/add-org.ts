import { AddOrgParams } from "/opt/types";
import { AppSyncResolverHandler } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as utils from "/opt/utils";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export const handler: AppSyncResolverHandler<AddOrgParams,String>= async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {
        const ddbDocClient = await utils.getDDBDocClient();

        const getOrg = await ddbDocClient.send(new QueryCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `userid = :id`,
            ExpressionAttributeValues: {
                ':id': event.arguments.addOrgInput.userid
            }
        }));
        if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
            return reject('Organizacja nie istnieje');
        }
        const orgid = (getOrg.Items ?? [])[0]?.orgid as string;



        const getEmail = await ddbDocClient.send(new ScanCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': event.arguments.addOrgInput.email
            }
        }));

        if (getEmail.Items && getEmail.Items.length > 0) {
            // Update the record with orgid
            const updateResult = await ddbDocClient.send(new UpdateCommand({
                TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Key: {
                    'userid': getEmail.Items[0].userid
                },
                UpdateExpression: 'SET orgid = :orgid, prevorgid = :prevorgid',
                ExpressionAttributeValues: {
                    ':orgid': orgid,
                    ':prevorgid': getEmail.Items[0].orgid
                }
            }));
            resolve("sukces")
            // Handle the update result
            // ...
        }else {
            await ddbDocClient.send(new PutCommand({
                TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Item: {
                    'userid': "WAITING_"+uuidv4(),
                    'email': event.arguments.addOrgInput.email,
                    'orgid': orgid
                }
            }));
        }

        // ...
    });
}