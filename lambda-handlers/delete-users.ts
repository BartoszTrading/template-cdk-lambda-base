import { AppSyncResolverHandler, Handler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand,DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { User, DeleteUserParams } from '../shared/types';

export const handler: AppSyncResolverHandler<DeleteUserParams,string>= async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
        // Print Event
            utils.logInfo(event, 'Event');
            
            
            const ddbDocClient = await utils.getDDBDocClient();

            const getUserOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: process.env.TABLE_NAME,
                    KeyConditionExpression: `email = :email`,
                    ExpressionAttributeValues: {
                        ':email': { S: event.arguments.deleteUserInput.email }
                    },
                    ProjectionExpression: 'email',
                })
            );

            if (getUserOutput.Items && getUserOutput.Items.length > 0) {
                await ddbDocClient.send(
                    new DeleteCommand({
                        TableName: process.env.TABLE_NAME,
                        Key: {
                            email: event.arguments.deleteUserInput.email
                        }
                    })
                );
                return  resolve("User deleted");
            }else{
                return reject('User not found');
            }


        } catch (error: any) {
            utils.logError(error);
            reject("error");
        }
        });
    };
