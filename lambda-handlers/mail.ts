
import nodemailer from 'nodemailer';

import * as utils from '../shared/utils';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';


import {APIGatewayProxyResultV2, SQSEvent} from 'aws-lambda';
import verifyEmail from '/opt/templates/verifyEmailTemplate';
import Mail from 'nodemailer/lib/mailer';
import MailService from '/opt/services/mailService';
import { CreateConnectionData } from '/opt/interfaceses/mailInterface';

export async function handler(event: SQSEvent): Promise<APIGatewayProxyResultV2> {
  const messages = event.Records.map(record => {
    const body = JSON.parse(record.body) as {Subject: string; Message: string};

    return {subject: body.Subject, message: body.Message};
  });


  await sendMail();

  console.log('messages 👉', JSON.stringify(messages, null, 2));

  return {
    body: JSON.stringify({messages}),
    statusCode: 200,
  };
}

async function sendMail() {
    // buyerid - id kupujacego do znalezienia maila
    //Typ Nowy/Edytowany 

    const buyerid = "c4de1bb0-5dfb-4301-9830-763d00929427"
    const type = "NEW"

    const email = await getEmail(buyerid);

    const emailTemplate = verifyEmail("NOWT")

    const mailService = MailService.getInstance();

    const data: CreateConnectionData = {
      host: process.env.SMTP_HOST as string,
      port: process.env.SMTP_PORT as string,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME as string,
        pass: process.env.SMTP_PASSWORD as string
      }
    
    }

    await mailService.createConnection(data);

    await mailService.sendMail(
      "ddd",{
        to: email,
        from: process.env.SMTP_SENDER as string,
        subject: "Weryfikacja",
        html: emailTemplate.html
      }
    )
}

async function getEmail(buyerid: string) {
    const ddbDocClient = await utils.getDDBDocClient();

    const getKupujacyOutput = await ddbDocClient.send(
        new QueryCommand({
            TableName: `kupujacy-${process.env.TABLE_CONSTRUCTOR_NAME}`,
            KeyConditionExpression: `buyerid = :id`,
            ExpressionAttributeValues: {
                ':id': buyerid
            },
        })
    );

    if (getKupujacyOutput.Items && getKupujacyOutput.Items.length > 0) {
        return getKupujacyOutput.Items[0].email;
    }
    return null;

}