import { Dokument, GetDokumentyParams } from "/opt/types";
import { AppSyncResolverHandler } from "aws-lambda";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as utils from "/opt/utils";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {S3Client} from '@aws-sdk/client-s3';

type Result = {
    data: [Dokument];
}

export const handler: AppSyncResolverHandler<GetDokumentyParams,Result>= async (event, context) => {
    return new Promise<Result>(async (resolve, reject) => {
        const ddbDocClient = await utils.getDDBDocClient();
        const client = new S3Client();
        const bucket = "documentsusers";
        const documents= [];
        utils.logInfo(event, 'Event');
        for (const docId of event.arguments.getDokumentyInput.ids) {
            const getDokumentyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `dokumenty-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `docid = :id`,
                    ExpressionAttributeValues: {
                        ':id': docId
                    }
                })
            );
            let key = "staging/" + docId;
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const url = await getSignedUrl(client, command, { expiresIn: 3600 });
            const item = getDokumentyOutput.Items?.[0];
            if (item) {
                item.url = url;
                documents.push(item as Dokument);
            }
        }
        utils.logInfo(documents, 'Documents');
        const returnData: Result = {    
            data: documents as [Dokument]
        }
        utils.logInfo(returnData, 'ReturnData');
        resolve(returnData);
    });
}
