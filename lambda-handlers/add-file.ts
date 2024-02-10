import { AppSyncResolverHandler } from "aws-lambda";
import { S3Client, HeadObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import * as utils from "/opt/utils";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { AddFileParams } from "/opt/types";



type ValidateFile = {
    key: string;
    userid: string;
    name: string;
    autoid:string
}

export const handler: AppSyncResolverHandler<AddFileParams,string>= async (event, context) => {
    return new Promise<string>(async (resolve, reject) => {

        const s3 = new S3Client();
        const ddbDocClient = await utils.getDDBDocClient();

        const s3Params = {
            Bucket: "documentsusers",
            CopySource: encodeURI(`documentsusers/staging/${event.arguments.inputValidateFile.key}`),
            Key: event.arguments.inputValidateFile.key
        };
        utils.logInfo(s3Params, 's3Params');
        
        const response = await s3.send(new CopyObjectCommand(s3Params));
        utils.logInfo(s3Params, 's3Params');



        const transactItems = [{
            Update: {
                TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Key: { autoid: event.arguments.inputValidateFile.autoid },
                UpdateExpression: "set dokumenty = list_append(if_not_exists(dokumenty, :empty_list), :dokumenty)",
                ExpressionAttributeValues: {
                    ":dokumenty": [event.arguments.inputValidateFile.key],
                    ":empty_list": []
                }
            }},{
            Put: {
                TableName: `dokumenty-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Item: {
                    docid: event.arguments.inputValidateFile.key,
                    name: event.arguments.inputValidateFile.name,
                }
            }}

        ];

        try {
            await ddbDocClient.send(new TransactWriteCommand({
                TransactItems: transactItems
            }));
            resolve("File exists");
        } catch (error) {
            console.log(error)
            reject("File does not exist");
        }

    }
    )
}



