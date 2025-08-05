import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const VMS_TABLE = process.env.VMS_TABLE;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

/**
 * Validate VM data
 */
function validateVM(vm) {
  const required = ['name', 'host', 'user', 'environment'];
  const missing = required.filter(field => !vm[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate environment
  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(vm.environment)) {
    throw new Error(`Invalid environment. Must be one of: ${validEnvironments.join(', ')}`);
  }
}

export const api = async (event) => {
  const { body, pathParameters } = event;
  const { method: httpMethod, path } = event.requestContext.http;

  try {
    // GET /api/vms - List all VMs
    if (httpMethod === 'GET' && path === '/api/vms') {
      const { Items } = await client.send(new ScanCommand({ 
        TableName: VMS_TABLE 
      }));
      const vms = Items.map(item => unmarshall(item));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(vms),
      };
    }

    // GET /api/vms/{id} - Get specific VM
    if (httpMethod === 'GET' && path.startsWith('/api/vms/')) {
      const { id } = pathParameters;
      
      const { Item } = await client.send(new GetItemCommand({
        TableName: VMS_TABLE,
        Key: marshall({ id }),
      }));
      
      if (!Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'VM not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(unmarshall(Item)),
      };
    }

    // POST /api/vms - Create new VM
    if (httpMethod === 'POST' && path === '/api/vms') {
      const vm = JSON.parse(body);
      
      // Validate input
      validateVM(vm);
      
      // Check if VM with same name and environment already exists
      const { Items } = await client.send(new QueryCommand({
        TableName: VMS_TABLE,
        IndexName: 'NameEnvironmentIndex',
        KeyConditionExpression: '#name = :name AND environment = :environment',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: marshall({
          ':name': vm.name,
          ':environment': vm.environment
        })
      }));
      
      if (Items && Items.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ 
            error: `VM with name '${vm.name}' already exists in environment '${vm.environment}'` 
          }),
        };
      }
      
      // Add metadata
      vm.id = randomUUID();
      vm.createdAt = new Date().toISOString();
      vm.updatedAt = vm.createdAt;
      
      await client.send(new PutItemCommand({
        TableName: VMS_TABLE,
        Item: marshall(vm),
      }));
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(vm),
      };
    }

    // PUT /api/vms/{id} - Update VM
    if (httpMethod === 'PUT' && path.startsWith('/api/vms/')) {
      const { id } = pathParameters;
      const vmUpdates = JSON.parse(body);
      
      // Remove id and createdAt from updates
      delete vmUpdates.id;
      delete vmUpdates.createdAt;
      
      // Add updatedAt
      vmUpdates.updatedAt = new Date().toISOString();
      
      // Validate if name/environment are being updated
      if (vmUpdates.name || vmUpdates.environment) {
        validateVM({ ...vmUpdates, name: vmUpdates.name || 'temp', environment: vmUpdates.environment || 'development' });
      }
      
      const updateExpression = 'SET ' + Object.keys(vmUpdates).map(key => `#${key} = :${key}`).join(', ');
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      for (const key in vmUpdates) {
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = vmUpdates[key];
      }

      const { Attributes } = await client.send(new UpdateItemCommand({
        TableName: VMS_TABLE,
        Key: marshall({ id }),
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW',
      }));
      
      if (!Attributes) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'VM not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(unmarshall(Attributes)),
      };
    }

    // DELETE /api/vms/{id} - Delete VM
    if (httpMethod === 'DELETE' && path.startsWith('/api/vms/')) {
      const { id } = pathParameters;
      
      await client.send(new DeleteItemCommand({
        TableName: VMS_TABLE,
        Key: marshall({ id }),
      }));
      
      return {
        statusCode: 204,
        headers,
        body: '',
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' }),
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal Server Error' 
      }),
    };
  }
};
