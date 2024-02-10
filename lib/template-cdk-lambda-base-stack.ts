// CDK
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { AmplifyGraphqlApi, AmplifyGraphqlDefinition } from '@aws-amplify/graphql-api-construct';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import cdk from 'aws-cdk-lib';
import * as cwLogs from 'aws-cdk-lib/aws-logs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { getLambdaDefinitions, getFunctionProps } from './config/lambda-config';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
// Types
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

import * as sqs from 'aws-cdk-lib/aws-sqs';
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';

import { getTableProps } from './config/dynamo-config';
import { CDKContext } from '../shared/types';
import { getDynamoDefinitions } from './config/dynamo-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { getSqsDefinitions } from './config/sqs-config';
import {getQueueProps} from './config/sqs-config';
export class CDKLambdaBaseStack extends Stack {
  public readonly lambdaFunctions: {
    [key: string]: NodejsFunction;
  } = {};
  constructor(scope: Construct, id: string, props: StackProps, context: CDKContext) {
    super(scope, id, props);







    const graphqlApi = new appsync.GraphqlApi(this, 'graphqlApi', {
      name: `${context.appName}-${context.environment}`,
      definition: appsync.Definition.fromFile('lib/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    // Lambda Role
    const lambdaRole = new iam.Role(this, 'lambdaRole', {
      roleName: `${context.appName}-lambda-role-${context.environment}`,
      description: `Lambda role for ${context.appName}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')],
    });
    // ddbTable.grantReadWriteData(lambdaRole);
    // Attach inline policies to Lambda role
    // ...

    // Grant S3 access to lambdaRole
    new iam.Policy(this, 'lambdaS3Access', {
      policyName: 'lambdaS3Access',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket',
            's3:DeleteObject',
          ],
        }),
      ],
    }).attachToRole(lambdaRole);

    // ...
    lambdaRole.attachInlinePolicy(
      new iam.Policy(this, 'lambdaExecutionAccess', {
        policyName: 'lambdaExecutionAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:PutLogEvents',
            ],
          }),
        ],
      })
    );




    // Lambda Layer
    const lambdaLayer = new lambda.LayerVersion(this, 'lambdaLayer', {
      code: lambda.Code.fromAsset('shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      description: `Lambda Layer for ${context.appName}`,
    });

    //Get Dynamo definitions
    const dynamoDefinitions = getDynamoDefinitions(context);

    // Loop through the definitions and create dynamo tables
    for (const dynamoDefinition of dynamoDefinitions) {
      // Get table props based on dynamo definition
      let tableProps = getTableProps(dynamoDefinition, context);

      // Dynamo Table
      const ddbTable = new ddb.TableV2(this, `${dynamoDefinition.name}-table`, tableProps);
      ddbTable.grantReadWriteData(lambdaRole);
      // Create corresponding Log Group with one month retention
      new cwLogs.LogGroup(this, `table-${dynamoDefinition.name}-log-group`, {
        logGroupName: `/aws/lambda/${context.appName}-${dynamoDefinition.name}-${context.environment}`,
        retention: cwLogs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }

    // Get Lambda definitions
    const lambdaDefinitions = getLambdaDefinitions(context);

    // Loop through the definitions and create lambda functions
    for (const lambdaDefinition of lambdaDefinitions) {
      // Get function props based on lambda definition
      let functionProps = getFunctionProps(lambdaDefinition, lambdaRole, lambdaLayer, context);

      // Lambda Function
      const lambdaFunction = new NodejsFunction(this, `${lambdaDefinition.name}-function`, functionProps);
      this.lambdaFunctions[lambdaDefinition.name] = lambdaFunction;
      // Lambda Data Sources & Resolvers
      if (lambdaDefinition.name === 'get-users') {
        const lambdaDS = graphqlApi.addLambdaDataSource('getUsersDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Query', fieldName: 'getUsers' });
      }
      if (lambdaDefinition.name === 'add-user') {
        const lambdaDS = graphqlApi.addLambdaDataSource('addUserDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'addUser' });
      }
      if (lambdaDefinition.name === 'update-user') {
        const lambdaDS = graphqlApi.addLambdaDataSource('updateUserDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'updateUser' });
      }
      if (lambdaDefinition.name === 'delete-user') {
        const lambdaDS = graphqlApi.addLambdaDataSource('deleteUserDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'deleteUser' });
      }
      if (lambdaDefinition.name === 'get-samochody') {
        const lambdaDS = graphqlApi.addLambdaDataSource('getSamochodyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Query', fieldName: 'getSamochody' });
      }
      if (lambdaDefinition.name === 'add-samochody') {
        const lambdaDS = graphqlApi.addLambdaDataSource('addSamochodyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'addSamochody' });
      }
      if (lambdaDefinition.name === 'update-samochody') {
        const lambdaDS = graphqlApi.addLambdaDataSource('updateSamochodyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'updateSamochody' });
      }
      if (lambdaDefinition.name === 'delete-samochody') {
        const lambdaDS = graphqlApi.addLambdaDataSource('deleteSamochodyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'deleteSamochody' });
      }
      if (lambdaDefinition.name === 'get-kupujacy') {
        const lambdaDS = graphqlApi.addLambdaDataSource('getKupujacyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Query', fieldName: 'getKupujacy' });
      }
      if (lambdaDefinition.name === 'add-kupujacy') {
        const lambdaDS = graphqlApi.addLambdaDataSource('addKupujacyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'addKupujacy' });
      }
      if (lambdaDefinition.name === 'update-kupujacy') {
        const lambdaDS = graphqlApi.addLambdaDataSource('updateKupujacyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'updateKupujacy' });
      }
      if (lambdaDefinition.name === 'delete-kupujacy') {
        const lambdaDS = graphqlApi.addLambdaDataSource('deleteKupujacyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'deleteKupujacy' });
      }
      if (lambdaDefinition.name === 'get-url') {
        const lambdaDS = graphqlApi.addLambdaDataSource('getUrlDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'getUploadURL' });
      }
      if (lambdaDefinition.name === 'add-file') {
        const lambdaDS = graphqlApi.addLambdaDataSource('addFileDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'addFile' });
      }
      if (lambdaDefinition.name === 'get-dokumenty') {
        const lambdaDS = graphqlApi.addLambdaDataSource('getDokumentyDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Query', fieldName: 'getDokumenty' });
      }
      if (lambdaDefinition.name === "add-org"){
        const lambdaDS = graphqlApi.addLambdaDataSource('addOrgDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'addOrg' });
      }
      if (lambdaDefinition.name === "get-org"){
        const lambdaDS = graphqlApi.addLambdaDataSource('getOrgDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Query', fieldName: 'getOrg' });
      }
      if (lambdaDefinition.name === "update-org"){
        const lambdaDS = graphqlApi.addLambdaDataSource('updateOrgDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'updateOrg' });
      }
      if (lambdaDefinition.name === "delete-org"){
        const lambdaDS = graphqlApi.addLambdaDataSource('deleteOrgDS', lambdaFunction);
        lambdaDS.createResolver(lambdaDefinition.name, { typeName: 'Mutation', fieldName: 'deleteOrg' });
      }

            // Create corresponding Log Group with one month retention
      new cwLogs.LogGroup(this, `fn-${lambdaDefinition.name}-log-group`, {
        logGroupName: `/aws/lambda/${context.appName}-${lambdaDefinition.name}-${context.environment}`,
        retention: cwLogs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }

    const sqsDefinition = getSqsDefinitions(context);

    //we gonna create sns topic to test lambda

    for (const sqsDef of sqsDefinition) {

      const queueProps = getQueueProps(sqsDef, context);
      const queue = new sqs.Queue(this, `${sqsDef.queueName}-queue`, queueProps);
      console.log(this.lambdaFunctions)
      this.lambdaFunctions.mail.addEventSource(new SqsEventSource(queue));

    }



  }
}
