import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const COMMANDS_TABLE = process.env.COMMANDS_TABLE;
const VMS_TABLE = process.env.VMS_TABLE;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

/**
 * Validate command data
 */
function validateCommand(command) {
  const required = ['name', 'cmd', 'type'];
  const missing = required.filter(field => !command[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate command type
  const validTypes = ['stream', 'terminal', 'ssh'];
  if (!validTypes.includes(command.type)) {
    throw new Error(`Invalid command type. Must be one of: ${validTypes.join(', ')}`);
  }
}

/**
 * Check if VM exists
 */
async function vmExists(vmId) {
  try {
    const { Item } = await client.send(new GetItemCommand({
      TableName: VMS_TABLE,
      Key: marshall({ id: vmId }),
    }));
    return !!Item;
  } catch (error) {
    return false;
  }
}

export const api = async (event) => {
  const { body, pathParameters } = event;
  const { method: httpMethod, path } = event.requestContext.http;

  try {
    // GET /api/vms/{vmId}/commands - List commands for a VM
    if (httpMethod === 'GET' && path.match(/^\/api\/vms\/[^\/]+\/commands$/)) {
      const { vmId } = pathParameters;
      
      const { Items } = await client.send(new QueryCommand({
        TableName: COMMANDS_TABLE,
        IndexName: 'VmIdIndex',
        KeyConditionExpression: 'vmId = :vmId',
        ExpressionAttributeValues: marshall({
          ':vmId': vmId
        })
      }));
      
      const commands = Items ? Items.map(item => unmarshall(item)) : [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(commands),
      };
    }

    // GET /api/commands/{id} - Get specific command
    if (httpMethod === 'GET' && path.startsWith('/api/commands/')) {
      const { id } = pathParameters;
      
      const { Item } = await client.send(new GetItemCommand({
        TableName: COMMANDS_TABLE,
        Key: marshall({ id }),
      }));
      
      if (!Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Command not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(unmarshall(Item)),
      };
    }

    // POST /api/vms/{vmId}/commands - Create new command for VM
    if (httpMethod === 'POST' && path.match(/^\/api\/vms\/[^\/]+\/commands$/)) {
      const { vmId } = pathParameters;
      const command = JSON.parse(body);
      
      // Validate input
      validateCommand(command);
      
      // Check if VM exists
      if (!(await vmExists(vmId))) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'VM not found' }),
        };
      }
      
      // Check if command with same name already exists for this VM
      const { Items } = await client.send(new QueryCommand({
        TableName: COMMANDS_TABLE,
        IndexName: 'VmIdNameIndex',
        KeyConditionExpression: 'vmId = :vmId AND #name = :name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: marshall({
          ':vmId': vmId,
          ':name': command.name
        })
      }));
      
      if (Items && Items.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ 
            error: `Command with name '${command.name}' already exists for this VM` 
          }),
        };
      }
      
      // Add metadata
      command.id = randomUUID();
      command.vmId = vmId;
      command.createdAt = new Date().toISOString();
      command.updatedAt = command.createdAt;
      
      await client.send(new PutItemCommand({
        TableName: COMMANDS_TABLE,
        Item: marshall(command),
      }));
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(command),
      };
    }

    // PUT /api/commands/{id} - Update command
    if (httpMethod === 'PUT' && path.startsWith('/api/commands/')) {
      const { id } = pathParameters;
      const commandUpdates = JSON.parse(body);
      
      // Remove immutable fields from updates
      delete commandUpdates.id;
      delete commandUpdates.vmId;
      delete commandUpdates.createdAt;
      
      // Add updatedAt
      commandUpdates.updatedAt = new Date().toISOString();
      
      // Validate if required fields are being updated
      if (commandUpdates.name || commandUpdates.cmd || commandUpdates.type) {
        validateCommand({ 
          name: commandUpdates.name || 'temp', 
          cmd: commandUpdates.cmd || 'temp', 
          type: commandUpdates.type || 'stream' 
        });
      }
      
      const updateExpression = 'SET ' + Object.keys(commandUpdates).map(key => `#${key} = :${key}`).join(', ');
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      for (const key in commandUpdates) {
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = commandUpdates[key];
      }

      const { Attributes } = await client.send(new UpdateItemCommand({
        TableName: COMMANDS_TABLE,
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
          body: JSON.stringify({ error: 'Command not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(unmarshall(Attributes)),
      };
    }

    // DELETE /api/commands/{id} - Delete command
    if (httpMethod === 'DELETE' && path.startsWith('/api/commands/')) {
      const { id } = pathParameters;
      
      await client.send(new DeleteItemCommand({
        TableName: COMMANDS_TABLE,
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
