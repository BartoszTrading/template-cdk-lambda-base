import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';

import { UpdateUserParams, User } from '/opt/types';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export const handler: AppSyncResolverHandler<UpdateUserParams, User | string> = async (event, context) => {
  return new Promise<User | string>(async (resolve, reject) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      //  Get DDB DocClient
      const ddbDocClient = await utils.getDDBDocClient();

      // Check if user is present in DDB
      const getUserOutput = await ddbDocClient.send(
        new QueryCommand({
          TableName: process.env.DDB_TABLE,
          KeyConditionExpression: `email = :email`,
          ExpressionAttributeValues: {
            ':email': event.arguments.updateUserInput.email,
          },
        })
      );

      // Delete Item
      if (getUserOutput.Items && getUserOutput.Items.length > 0) {
        const updatedUser = { ...getUserOutput.Items[0] } as User;

        // Update user attributes
        if (event.arguments.updateUserInput.firstName) updatedUser.firstName = event.arguments.updateUserInput.firstName;
        if (event.arguments.updateUserInput.lastName) updatedUser.lastName = event.arguments.updateUserInput.lastName;
        if (event.arguments.updateUserInput.email) updatedUser.email = event.arguments.updateUserInput.email;
        if (event.arguments.updateUserInput.gender) updatedUser.gender = event.arguments.updateUserInput.gender;
        if (event.arguments.updateUserInput.jobTitle) updatedUser.jobTitle = event.arguments.updateUserInput.jobTitle;
        if (event.arguments.updateUserInput.country) updatedUser.country = event.arguments.updateUserInput.country;

        // Write updated user to dynamo db
        await ddbDocClient.send(new PutCommand({ TableName: process.env.DDB_TABLE, Item: updatedUser }));
        return resolve(updatedUser);
      } else {
        return resolve(`User with email ${event.arguments.updateUserInput.email} not found`);
      }
    } catch (error: any) {
      utils.logError(error);
      reject();
    }
  });
};