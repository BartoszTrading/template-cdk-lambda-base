import { AppSyncResolverHandler, Handler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { User, DeleteUserParams, GetUsersParams } from '../shared/types';

type Result = {
  data: User[];
  nextToken: string;
}

export const handler: AppSyncResolverHandler<GetUsersParams,Result>= async (event, context) => {
    return new Promise<Result>(async (resolve, reject) => {
        try {
        // Print Event
            utils.logInfo(event, 'Event');
            
            
            const ddbDocClient = await utils.getDDBDocClient();

            const queryCommandInput: QueryCommandInput = {
              TableName: process.env.TABLE_NAME,
              ExclusiveStartKey : event.arguments.getUsersInput.nextToken ? JSON.parse(Buffer.from(event.arguments.getUsersInput.nextToken, 'base64').toString('ascii')) : undefined,
              ExpressionAttributeValues: {}
            }

            if (event.arguments.getUsersInput.email) {
              queryCommandInput.KeyConditionExpression = `email = :email`;
              queryCommandInput.ExpressionAttributeValues = {
                ...queryCommandInput.ExpressionAttributeValues,
                ':email': event.arguments.getUsersInput.email
            }
          }else{
            queryCommandInput.IndexName = 'itemType-index';
            queryCommandInput.KeyConditionExpression = `itemType = :itemType`;
            queryCommandInput.ExpressionAttributeValues = {
              ...queryCommandInput.ExpressionAttributeValues,
              ':itemType': 'User'
          }
        }

        const queryCommandOutput = await ddbDocClient.send(new QueryCommand(queryCommandInput));
        const result: Result = {
          data: queryCommandOutput.Items ? (queryCommandOutput.Items as User[]) : [],
          nextToken: queryCommandOutput.LastEvaluatedKey ? Buffer.from(JSON.stringify(queryCommandOutput.LastEvaluatedKey)).toString('base64') : '',

        }
      
        resolve(result)
      
      } catch (error: any) {
            utils.logError(error);
            reject("error");
        }
        });
    };
