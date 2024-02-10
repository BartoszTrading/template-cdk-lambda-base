import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBDocumentClient, TransactWriteCommand,PutCommandInput, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import * as utils from '/opt/utils';
import { AddKupujacyParams, Kupujacy } from '../shared/types';
import { TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export const handler: AppSyncResolverHandler<AddKupujacyParams, Kupujacy> = async (event, context) => {
    return new Promise<Kupujacy>(async (resolve, reject) => {

    try {
        utils.logInfo(event, 'Event');
        const ddbDocClient = await utils.getDDBDocClient();


        const getOrg = await ddbDocClient.send( new QueryCommand({
            TableName: `orgs-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `userid = :id`,
            ExpressionAttributeValues: {
                ':id': event.arguments.addKupujacyInput.orgid
            }
        }));
        if (getOrg.Items && getOrg.Items.length === 0 && typeof getOrg.Items[0].orgid === "undefined") {
            return reject('Organizacja nie istnieje');
        }
        const orgid = (getOrg.Items ?? [])[0]?.orgid as string;


        const kupujacy: Kupujacy = {
            orgid: orgid,
            buyerid: uuidv4().toString() || "None",
            imie: event.arguments.addKupujacyInput.imie || "None",
            nazwisko: event.arguments.addKupujacyInput.nazwisko || "None",
            telefon: event.arguments.addKupujacyInput.telefon || "None",
            email: event.arguments.addKupujacyInput.email || "None",
            auta: event.arguments.addKupujacyInput.auta || [],
        };

        
        type transactItemsT = {
            Put?: PutCommandInput;
            Update?: UpdateCommandInput;
        }[];
        

        const transactItems = [{
            Put: {
                TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Item: kupujacy
            }
        }];

        const updateItems = kupujacy.auta.map(autoId => ({
            Update: {
                TableName: `samochod-${process.env.TABLE_CONSTRUCTOR_NAME}`,
                Key: { autoid: autoId },
                UpdateExpression: "set buyerid = :buyerid",
                ExpressionAttributeValues: {
                    ":buyerid": kupujacy.buyerid
                },
            }
        }));

        await ddbDocClient.send(new TransactWriteCommand({
            TransactItems: [...transactItems, ...updateItems]
        }));

        resolve(kupujacy);
    } catch (error) {
        console.error("An error occurred during transaction:", error);
        throw error; // Rethrow the error for AWS Lambda to handle it appropriately.
    }
});};
