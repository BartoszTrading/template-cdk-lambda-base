import { CreateQueueCommandInput } from "@aws-sdk/client-sqs";
import { CDKContext } from "/opt/types";
import { SqsDefinition } from "/opt/types";
import { QueueProps } from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";

export const getSqsDefinitions = (context: CDKContext): SqsDefinition[] => {
  const sqsDefinitions: SqsDefinition[] = [
    {
        queueName: `mailNotifiacationQueue-${context.appName}-${context.environment}.fifo`,
        contentBasedDeduplication: true,
        fifo: true,
        visibilityTimeout: Duration.seconds(10000)
    }

  ];


  return sqsDefinitions;
}

export const getQueueProps = (
    sqsDefinition: SqsDefinition,
    context: CDKContext
) => {
    const queueProps: QueueProps = {
        queueName: sqsDefinition.queueName,
        contentBasedDeduplication: sqsDefinition.contentBasedDeduplication,
        fifo: sqsDefinition.fifo,
        visibilityTimeout: sqsDefinition.visibilityTimeout
    }

    

    return queueProps;

}
