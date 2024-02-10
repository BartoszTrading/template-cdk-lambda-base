import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { CDKContext } from '/opt/types';

import { DynamoDefinition } from "/opt/types"

export const getDynamoDefinitions = (context: CDKContext): DynamoDefinition[] => {
    const dynamoDefinitions: DynamoDefinition[] = [
        {
        name: `kupujacy-${context.appName}-${context.environment}`,
        partitionKeyName: 'buyerid',
        secondaryIndexes: [
            {
            indexName: 'orgid-index',
            partitionKeyName: 'orgid',
            },
        ],
        },
        {
        name:  `users2-${context.appName}-${context.environment}`,
        partitionKeyName: 'email',
        secondaryIndexes: [
            {
            indexName: 'itemType-index',
            partitionKeyName: 'itemType',
            },
        ],
        },
        {
            name: `samochod-${context.appName}-${context.environment}`,
            partitionKeyName: 'autoid',
            secondaryIndexes: [
                {
                indexName: 'orgid-index',
                partitionKeyName: 'orgid',
                },
                {
                indexName: 'buyerid-index',
                partitionKeyName: 'buyerid',
                },
            ],
        },
        {
            name: `orgs-${context.appName}-${context.environment}`,
            partitionKeyName: 'userid',
            secondaryIndexes: [
                {
                indexName: 'orgid-index',
                partitionKeyName: 'orgid',
                },
            ],

        },
        {
            name: `dokumenty-${context.appName}-${context.environment}`,
            partitionKeyName: 'docid',

        },
        
    ];
    return dynamoDefinitions;
    }

    
export const getTableProps = (dynamoDefinition: DynamoDefinition, context: CDKContext): dynamodb.TablePropsV2 => {    const { name, partitionKeyName, secondaryIndexes } = dynamoDefinition;

    const tableProps: dynamodb.TablePropsV2 = {
        tableName: name,
        partitionKey: {
            name: partitionKeyName,
            type: dynamodb.AttributeType.STRING,
        },
        globalSecondaryIndexes: [],
        
        };
        

    if (secondaryIndexes && secondaryIndexes.length > 0) {
        secondaryIndexes.forEach((index) => {
            tableProps.globalSecondaryIndexes?.push( {
                indexName: index.indexName,
                partitionKey: {
                    name: index.partitionKeyName,
                    type: dynamodb.AttributeType.STRING,
                },
            });
        });
    }

    return tableProps;
}
