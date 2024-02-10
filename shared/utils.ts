// Logger Functions
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { LogInput } from "/opt/types";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { GetQueueUrlCommand } from "@aws-sdk/client-sqs";

export const logInfo = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.info(`${title}: ${message}`) : console.info(message);
  } else {
    title ? console.info(`${title}:`, JSON.stringify(message, null, 2)) : console.info(JSON.stringify(message, null, 2));
  }
};
export const logError = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.error(`${title}: ${message}`) : console.error(message);
  } else {
    title ? console.error(`${title}:`, JSON.stringify(message, null, 2)) : console.error(JSON.stringify(message, null, 2));
  }
};
export const logWarn = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.warn(`${title}: ${message}`) : console.warn(message);
  } else {
    title ? console.warn(`${title}:`, JSON.stringify(message, null, 2)) : console.warn(JSON.stringify(message, null, 2));
  }
};
export const logDebug = (message: string | any, title: string | undefined = undefined): void => {
  if (process.env.LOG_LEVEL === 'debug') {
    if (typeof message === 'string') {
      title ? console.debug(`${title}: ${message}`) : console.debug(message);
    } else {
      title ? console.debug(`${title}:`, JSON.stringify(message, null, 2)) : console.debug(JSON.stringify(message, null, 2));
    }
  }
};

export const getDDBDocClient = (): Promise<DynamoDBDocumentClient> => {
  return new Promise((resolve, reject) => {
    const ddbClient = new DynamoDBClient({ region: "eu-central-1" });
    const marshallOptions = {
      convertEmptyValues: true,
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    };
    const unmarshallOptions = {
      wrapNumbers: true,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);
    resolve(ddbDocClient);
  }
  )
}


export const logChange = async(inputlog: LogInput) => {
  const client = new SQSClient();

  const queueUrl = await getUrl();

  const command = new SendMessageCommand({
    QueueUrl: queueUrl.QueueUrl,
    MessageBody: JSON.stringify(inputlog)
  });

  const response = await client.send(command);

  return response;

}

export const getUrl = async() => {
  const client = new SQSClient();

  const queueName = "mail-cdk-lambda-base-develop.fifo"
  const queueUrl =   new GetQueueUrlCommand({ QueueName: queueName });
  const response = await client.send(queueUrl);

  return response;


}
