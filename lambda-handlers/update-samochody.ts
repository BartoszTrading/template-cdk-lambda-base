
import { AppSyncResolverHandler } from 'aws-lambda';
import * as utils from '/opt/utils';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Samochod, UpdateSamochodyParams } from '/opt/interfaceses/samochodInterface';
import { marshall } from '@aws-sdk/util-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import JSZip from 'jszip';
import { NotifacateUser } from '/opt/services/notificateUser';
import { Notification } from '/opt/interfaceses/mailInterface';

type Result = {
    status: string;
}

export const handler: AppSyncResolverHandler<UpdateSamochodyParams,Samochod>= async (event, context) => {
    return new Promise<Samochod>(async (resolve, reject) => {
        try {
            utils.logInfo(event, 'Event');

            const ddbDocClient = await utils.getDDBDocClient();

            const getSamochodyOutput = await ddbDocClient.send(
                new QueryCommand({
                    TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                    KeyConditionExpression: `autoid = :id`,
                    ExpressionAttributeValues: {
                        ':id': event.arguments.updateSamochodyInput.autoid
                    }
                })

            );

            if (getSamochodyOutput.Items && getSamochodyOutput.Items.length >0){
                const updatedSamochod = { ...getSamochodyOutput.Items[0] } as Samochod;
                const transactItems = [];
                if (event.arguments.updateSamochodyInput.buyerid && (event.arguments.updateSamochodyInput.buyerid != updatedSamochod.buyerid)){

                
                    if (updatedSamochod.buyerid){

                        const getKupujacyOutput = await ddbDocClient.send(
                            new QueryCommand({
                                TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                KeyConditionExpression: `buyerid = :id`,
                                ExpressionAttributeValues: {
                                    ':id': updatedSamochod.buyerid
                                }
                            })
                        );
                        //jesli jest taki kupujact to usuwamy autoid z jego listy aut
                        if (getKupujacyOutput.Items && getKupujacyOutput.Items.length >0){
                            //zmienna aby ulatwic prace z typami
                            const kupujacyItems = getKupujacyOutput.Items[0];
                            //sprawdzamy czy kupujacy ma jakies auta
                            if (kupujacyItems.auta && kupujacyItems.auta.length >0){
                                //sprawdzamy czy autoid jest w liscie aut
                                const index = kupujacyItems.auta.indexOf(updatedSamochod.autoid);
                                if (index > -1) {
                                    kupujacyItems.auta.splice(index, 1);

                                }
                                utils.logInfo(kupujacyItems,"kupujacyItems" );
                                transactItems.push({
                                    Put: {
                                        TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                        Item: kupujacyItems
                                    }
                                });
                            }
                        }
                    }
                    //nowy kupujacy ktorego id zostalo przekazane w requescie
                    const newKupujacyOutput = await ddbDocClient.send(
                        new QueryCommand({
                            TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                            KeyConditionExpression: `buyerid = :id`,
                            ExpressionAttributeValues: {
                                ':id': event.arguments.updateSamochodyInput.buyerid
                            }
                        })
                    );
                    //jesli jest taki kupujact to dodajemy autoid do jego listy aut
                    if (newKupujacyOutput.Items && newKupujacyOutput.Items.length >0){
                        //zmienna aby ulatwic prace z typami
                        const kupujacyItems = newKupujacyOutput.Items[0];
                        //sprawdzamy czy kupujacy ma jakies auta
                        if (kupujacyItems.auta){
                            kupujacyItems.auta.push(updatedSamochod.autoid);
                        }else{
                            kupujacyItems.auta = [updatedSamochod.autoid];
                        }
                        transactItems.push({
                            Put: {
                                TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                                Item: kupujacyItems
                            }
                        });
                    }
                }

                if (event.arguments.updateSamochodyInput.buyerid) updatedSamochod.buyerid = event.arguments.updateSamochodyInput.buyerid;
                if (event.arguments.updateSamochodyInput.VIN) updatedSamochod.VIN = event.arguments.updateSamochodyInput.VIN;
                if (event.arguments.updateSamochodyInput.m_status) updatedSamochod.m_status = event.arguments.updateSamochodyInput.m_status;
                if (event.arguments.updateSamochodyInput.num_kontenera) updatedSamochod.num_kontenera = event.arguments.updateSamochodyInput.num_kontenera;
                if (event.arguments.updateSamochodyInput.m_data) updatedSamochod.m_data = event.arguments.updateSamochodyInput.m_data;
                if (event.arguments.updateSamochodyInput.rocznik) updatedSamochod.rocznik = event.arguments.updateSamochodyInput.rocznik;
                if (event.arguments.updateSamochodyInput.marka_i_model) updatedSamochod.marka_i_model = event.arguments.updateSamochodyInput.marka_i_model;
                if (event.arguments.updateSamochodyInput.title_status) updatedSamochod.title_status = event.arguments.updateSamochodyInput.title_status;
                if (event.arguments.updateSamochodyInput.statusPanel) updatedSamochod.statusPanel = event.arguments.updateSamochodyInput.statusPanel;
                if (event.arguments.updateSamochodyInput.data_zakupu) updatedSamochod.data_zakupu = event.arguments.updateSamochodyInput.data_zakupu;
                if (event.arguments.updateSamochodyInput.notatka) updatedSamochod.notatka = event.arguments.updateSamochodyInput.notatka;
                if (event.arguments.updateSamochodyInput.archiwum) updatedSamochod.archiwum = event.arguments.updateSamochodyInput.archiwum;
                if (event.arguments.updateSamochodyInput.zdjecia_glowne) updatedSamochod.zdjecia_glowne = event.arguments.updateSamochodyInput.zdjecia_glowne;
                if (event.arguments.updateSamochodyInput.zdjecia_laweta) updatedSamochod.zdjecia_laweta = event.arguments.updateSamochodyInput.zdjecia_laweta;
                if (event.arguments.updateSamochodyInput.dokumenty) updatedSamochod.dokumenty = event.arguments.updateSamochodyInput.dokumenty;
                async function fetchImage(url: string): Promise<Buffer> {
                    const response = await axios.get(url, { responseType: 'arraybuffer' });
                    return response.data;
                }
                
                // Main function to fetch images, zip them, and upload to S3
                async function fetchZipAndUpload() {
                    const zip = new JSZip();
                    const client = new S3Client();
                
                    // Fetch images and add them to the zip
                    for (const url of updatedSamochod.zdjecia_glowne) {
                        const imageName = `${url.split('/').pop()}.jpg`; // Extract image name from URL
                        const imageBlob = await fetchImage(url);
                        zip.file(imageName as string, imageBlob, { binary: true });
                    }
                
                    // Generate the zip file
                    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });
                
                    // Specify your bucket and zip file name
                    const bucketName = '7os';
                    const zipFileName = `${updatedSamochod.autoid}.zip`;
                
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
                // await ddbDocClient.send(new PutCommand({ TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`, Item: updatedSamochod }));
                transactItems.push({
                    Put: {
                        TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                        Item: updatedSamochod
                    }
                });

                await ddbDocClient.send(new TransactWriteCommand({
                    TransactItems: transactItems
                    }));
                    
                
                utils.logInfo(updatedSamochod,"updated" );
                let temp: any = updatedSamochod
                updatedSamochod.timestamp = parseInt(temp.timestamp,10)
                utils.logInfo(updatedSamochod,"updated" );
                if (event.arguments.updateSamochodyInput.notificate){

                    const dataNotificate: Notification = {
                        buyerid: updatedSamochod.buyerid as string,
                        vin: updatedSamochod.VIN as string,
                        type: "UPDATE"
                    }
                    await NotifacateUser(dataNotificate);
                }
                return resolve(updatedSamochod);
            }else{
                return reject('Samochód nie znaleziony');
            }

            } catch (error: any) {
                utils.logError(error);
                reject("error");
            }
        }
    )
}

