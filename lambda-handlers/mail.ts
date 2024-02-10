
import nodemailer from 'nodemailer';

import * as utils from '../shared/utils';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';


import {APIGatewayProxyResultV2, SQSEvent} from 'aws-lambda';

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

    const userdata = {
        email: 'bartoszmarek@botujai.pl',
        password: 'Elipsa123', 
        port: 587,
        
    }

    const transporter = nodemailer.createTransport({
        host: "mail.privateemail.com", // Use your email service
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: userdata.email, // Your email address
          pass: userdata.password, // Your password
        },
      }); 
    transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
          utils.logError(error);
        } else {
          console.log("Server is ready to take our messages");
          utils.logInfo("Server is ready to take our messages");
        }
      });
    

    const email = await getEmail(buyerid);
    utils.logInfo(email, 'Email');
    if (email) {
        const mailOptions = {
            from: userdata.email, // Your email address
            to: email, // Email address where the email will be sent
            subject: 'Nowy kupujący', // Subject of the email
            html: JSON.stringify(`<h1>Witaj, nowy kupujący został dodany do bazy</h1><p>Typ: ${type}</p>`), // Content of the email
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              utils.logError(error);
              throw new Error('Error while sending email');
            } else {
                console.log('Email sent: ' + info.response);
            }
          });


        }else{
            throw new Error('Email not found');
        }

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