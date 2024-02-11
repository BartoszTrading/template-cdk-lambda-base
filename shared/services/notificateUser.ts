import { Notification, SQSMessage } from "../interfaceses/mailInterface";
import { SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';


const sqs = new SQS({ region: 'us-west-2' }); // Replace 'us-west-2' with your desired region

export async function NotifacateUser(data: Notification) {
    const message_new = `Auto ${data.vin} zostało dodane do Bazy. Od teraz możesz nabierząco otrzymywać informacje o statusie`;
    const message_edit = `Auto ${data.vin} zostało zakutalizowane`;

    const message: SQSMessage = {
        subject: data.type === 'NEW' ? 'Nowe auto dodane' : 'Auto zaktualizowane',
        message: data.type === 'NEW' ? message_new : message_edit,
        buyerid: data.buyerid,
        id: uuidv4()
    };

    const params = {
        MessageBody: JSON.stringify(message), // Change to message_edit if needed
        MessageGroupId: uuidv4(),
        QueueUrl: 'https://sqs.eu-central-1.amazonaws.com/876111468870/mailNotifiacationQueue-cdk-lambda-base-develop.fifo' // Replace with your SQS queue URL
    };

    try {
        await sqs.sendMessage(params).promise();
        console.log('Message sent to SQS');
    } catch (error) {
        console.error('Error sending message to SQS:', error);
    }
}