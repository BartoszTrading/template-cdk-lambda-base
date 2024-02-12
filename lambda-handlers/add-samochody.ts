
import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { Samochod, AddSamochodyParams } from '/opt/interfaceses/samochodInterface';
import { v4 as uuidv4 } from 'uuid';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Kupujacy } from '/opt/types';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { get } from 'http';
import { createWriteStream } from 'fs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Archiver } from 'archiver';

import axios from 'axios';
import JSZip from 'jszip';
import { NotifacateUser } from '/opt/services/notificateUser';
import { Notification } from '/opt/interfaceses/mailInterface';



export const handler: AppSyncResolverHandler <AddSamochodyParams,Samochod>= async (event, context) => {
    return new Promise<Samochod>(async (resolve, reject) => {
        try {
            utils.logInfo(event, 'Event');
            const ddbDocClient = await utils.getDDBDocClient();

            const getOrg = await ddbDocClient.send( new QueryCommand({
                TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                KeyConditionExpression: `userid = :id`,
                ExpressionAttributeValues: {
                    ':id': event.arguments.addSamochodyInput.userid
                }
            }));
            if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
                return reject('Organizacja nie istnieje');
            }
            const orgid = (getOrg.Items ?? [])[0]?.orgid as string;


            const samochod: Samochod = {
                userid: event.arguments.addSamochodyInput.userid ,
                autoid: uuidv4(),
                orgid: orgid,
                timestamp: Math.round(Date.now() / 1000),
                buyerid: event.arguments.addSamochodyInput.buyerid || "None",
                VIN: event.arguments.addSamochodyInput.VIN || "None",
                m_status: event.arguments.addSamochodyInput.m_status || "None",
                num_kontenera: event.arguments.addSamochodyInput.num_kontenera || "None",
                m_data: event.arguments.addSamochodyInput.m_data || "None",
                rocznik: event.arguments.addSamochodyInput.rocznik  || "None",
                dokumenty: [],
                marka_i_model: event.arguments.addSamochodyInput.marka_i_model || "None",
                title_status: event.arguments.addSamochodyInput.title_status || "None",
                data_zakupu: event.arguments.addSamochodyInput.data_zakupu || "None",
                notatka: event.arguments.addSamochodyInput.notatka || "None",
                zdjecia_glowne: event.arguments.addSamochodyInput.zdjecia_glowne || [],
                zdjecia_laweta: event.arguments.addSamochodyInput.zdjecia_laweta || [],
            };
            const transactItems = [];
            const getKupujacyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `buyerid = :id`,
                    ExpressionAttributeValues: {
                        ':id': samochod.buyerid
                    }
                })

            );
            async function fetchImage(url: string): Promise<Buffer> {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                return response.data;
            }
            
            // Main function to fetch images, zip them, and upload to S3
            async function fetchZipAndUpload() {
                const zip = new JSZip();
                const client = new S3Client();
            
                // Fetch images and add them to the zip
                for (const url of [...samochod.zdjecia_glowne, ...samochod.zdjecia_laweta]) {
                    const imageName = `${url.split('/').pop()}.jpg`; // Extract image name from URL
                    const imageBlob = await fetchImage(url);
                    zip.file(imageName as string, imageBlob, { binary: true });
                }
            
                // Generate the zip file
                const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });
            
                // Specify your bucket and zip file name
                const bucketName = '7os';
                const zipFileName = `${samochod.autoid}.zip`;
            
                // Upload the zip file to S3
                const uploadParams = {
                    Bucket: bucketName,
                    Key: zipFileName,
                    Body: zipBlob,
                };
            
                try {
                    const command = new PutObjectCommand(uploadParams);
                    const uploadResult = await client.send(command)
                    console.log('Upload successful:');
                    console.log(uploadResult);
                } catch (error) {
                    console.error('Upload failed:', error);
                    utils.logError(error);
                }
            }
            
            // Execute the main function
            await fetchZipAndUpload();

            
            if (getKupujacyOutput.Items && getKupujacyOutput.Items.length > 0){
                const kupujacyItems: Kupujacy = getKupujacyOutput.Items[0] as Kupujacy;
                if (kupujacyItems.auta) {
                    kupujacyItems.auta.push(samochod.autoid);
                } else {
                    kupujacyItems.auta = [samochod.autoid];
                }
                transactItems.push({
                    Put: {
                        TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Item: kupujacyItems
                    }
                });
            }
            transactItems.push({
                Put: {
                    TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    Item: samochod
                }
            });
            await ddbDocClient.send(new TransactWriteCommand({
                TransactItems: transactItems
            }))
            if (event.arguments.addSamochodyInput.notificate){

                const dataNotificate: Notification = {
                    buyerid: samochod.buyerid as string,
                    vin: samochod.VIN as string,
                    type: "NEW"
                }
                await NotifacateUser(dataNotificate);
            }
            
            resolve(samochod);
        }
        catch (error: any) {
            utils.logError(error);
            reject();
        }
    }
    );
}
