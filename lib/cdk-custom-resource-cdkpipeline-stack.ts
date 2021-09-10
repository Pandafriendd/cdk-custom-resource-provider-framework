import * as cdk from '@aws-cdk/core';

import * as lambda from '@aws-cdk/aws-lambda';
import * as customresources from '@aws-cdk/custom-resources';

export class CdkCustomResourceCdkpipelineStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /*
        https://baihuqian.github.io/2020-12-17-lambda-based-cdk-custom-resource-with-input-and-output/ 
        https://github.com/shankben/firebase-migrator/blob/76ebb0bbf12678f41ddfb37b87fa7e9501d666d1/lib/constructs/sync-machine-execution.ts 
        https://github.com/shankben/firebase-migrator/blob/76ebb0bbf1/assets/lambda/sync/execution/index.ts#L10-L12
        */

        const lambdaCode = `
import boto3
import botocore
import json

ddb_client = boto3.client('dynamodb')

def handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))

    props = event['ResourceProperties']
  
    output = {
        'Data': {
            'MyAtt': 'test1'
        }
    }
    print("Output: " + json.dumps(output))
    return output

    `;

        const customFunction = new lambda.Function(this, `DdbStreamFn`, {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromInline(lambdaCode),
            handler: 'index.handler',
        });

        const provider = new customresources.Provider(this, "Provider", {
            onEventHandler: customFunction,
        });

        const customResource = new cdk.CustomResource(this, "CustomResource", {
            serviceToken: provider.serviceToken,
            resourceType: "Custom::Test",
        });

        const output = new cdk.CfnOutput(this, "OutputTest", {
            value: customResource.getAttString("MyAtt"),
        });

    }
}
