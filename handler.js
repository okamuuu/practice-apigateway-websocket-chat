const aws = require('aws-sdk')

const docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-northeast-1',
});

const localDocClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-northeast-1',
  endpoint: "http://localhost:8000"
});

function getDocClient(isOffline) {
  console.log("getDocClient:",  isOffline)
  return isOffline ? localDocClient : docClient
}

const { CONNECTIONS_TABLE } = process.env

module.exports.connect = async (event, context) => {
  console.log('connect')
 
  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  const result = await docClient.put({
    TableName: CONNECTIONS_TABLE,
    Item: { 
      connectionId: event.requestContext.connectionId,
    }
  }).promise()

  console.log(result)

  return {
    statusCode: 200,
    body: 'Connected.'
  } 
};

module.exports.disconnect = async (event, context) => {
  console.log('disconnect')

  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  await docClient.delete({
    TableName: CONNECTIONS_TABLE,
    Key: { 
      connectionId: event.requestContext.connectionId,
    }
  }).promise()

  return {
    statusCode: 200,
    body: 'Disconnected.'
  }
};

function isOffline (domainName) {
  return domainName === "localhost"
}

module.exports.ping = async (event, context) => {
  console.log('ping')
  // default function that just echos back the data to the client
  const client = new aws.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: isOffline(event.requestContext.domainName) 
      ? 'http://localhost:3001' 
      : `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });

  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  const data = await docClient.scan({
    TableName: CONNECTIONS_TABLE
  }).promise();
  console.log('=== docs ===')
  console.log(data)

  const result = await client
    .postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: `pong`
    })
    .promise();

  return {
    statusCode: 200,
    body: 'Sent.'
  }
};

module.exports.sendMessage = async (event, context) => {
  console.log('default')
  // default function that just echos back the data to the client
  const client = new aws.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: isOffline(event.requestContext.domainName) 
      ? 'http://localhost:3001' 
      : `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });

  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  const { Items } = await docClient.scan({
    TableName: CONNECTIONS_TABLE
  }).promise();

  const tasks = []
  Items.map(item => client.postToConnection({
    ConnectionId: item.connectionId,
    Data: `default route received: ${event.body}`
  }).promise())
  await Promise.all(tasks)

  return {
    statusCode: 200,
    body: 'Sent.'
  }
};

