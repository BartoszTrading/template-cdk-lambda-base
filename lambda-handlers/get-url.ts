import {S3Client} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';
import { AppSyncResolverHandler } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
type UrlParams = {
    userid: string;
}


export const handler: AppSyncResolverHandler<UrlParams,any>= async (event, context) => {
    return new Promise<any>(async (resolve, reject) => {

        const client = new S3Client();
        const uuidkey = uuidv4();
        const bucket = "documentsusers";
        const key = "staging/"+uuidkey;

        const command = new PutObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 })
        const data  = {url: url, key:uuidkey};    

        resolve(data);


        })};


