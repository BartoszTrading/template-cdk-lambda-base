import { AppSyncResolverHandler, Handler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { User, AddUserParams } from '../shared/types';

export const handler: AppSyncResolverHandler <AddUserParams,User>= async (event, context) => {
    return new Promise<User>(async (resolve, reject) => {
        try {
        // Print Event
            utils.logInfo(event, 'Event');
            
            const user: User = {
                itemType: 'User',
                firstName: event.arguments.addUserInput.firstName,
                lastName: event.arguments.addUserInput.lastName,
                email: event.arguments.addUserInput.email,
                gender: event.arguments.addUserInput.gender,
                jobTitle: event.arguments.addUserInput.jobTitle,
                country: event.arguments.addUserInput.country,
            };
            const ddbDocClient = await utils.getDDBDocClient();

            await ddbDocClient.send(new PutCommand({ TableName: process.env.TABLE_NAME, Item: user }));

            resolve(user);
        } catch (error: any) {
            utils.logError(error);
            reject();
        }
        });
    };
