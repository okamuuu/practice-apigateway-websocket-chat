const moment = require('moment')
const aws = require('aws-sdk')

const docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-northeast-1',
});

const localDocClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-northeast-1',
  endpoint: "http://localhost:8000"
});

// XXX: process.env.IS_OFFLINE が undefined だったので自前で実装
function isOffline (domainName) {
  return domainName === "localhost"
}

function getDocClient(isOffline) {
  return isOffline ? localDocClient : docClient
}

function getWsClient(event) {
  return new aws.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: isOffline(event.requestContext.domainName) 
      ? 'http://localhost:3001' 
      : `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });
}

const { CONNECTIONS_TABLE } = process.env

// demo だから DynamoDB には保存しない
const messages = [{
  connectionId: "dummyConnectionId",
  type: "text",
  value: "dummy text",
  createdAt: moment().toISOString(),
}]

module.exports.connect = async (event, context) => {
  console.log('connect')
 
  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  await docClient.put({
    TableName: CONNECTIONS_TABLE,
    Item: { 
      connectionId: event.requestContext.connectionId,
    }
  }).promise()

  const wsClient = getWsClient(event)
  const result = await wsClient.postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: JSON.stringify({messages})
    })
    .promise();

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

module.exports.ping = async (event, context) => {
  console.log('ping')
  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  const data = await docClient.scan({
    TableName: CONNECTIONS_TABLE
  }).promise();

  const wsClient = getWsClient(event)
  const result = await wsClient
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
  console.log('sendMessage', event.body)

  // XXX: デモ画面なのでメモリに保存する
  const message = {
    connectionId: event.requestContext.connectionId,
    type: "text",
    value: JSON.parse(event.body).payload,
    createdAt: moment().toISOString(),
  }

  messages.push(message)

  const docClient = getDocClient(isOffline(event.requestContext.domainName))
  const { Items } = await docClient.scan({
    TableName: CONNECTIONS_TABLE
  }).promise();

  // TODO: 411 は connection を clean する
  function handleError (e) { console.error(e.message) }

  const wsClient = getWsClient(event)
  const tasks = []
  
  Items.forEach(item => {
    wsClient.postToConnection({
      ConnectionId: item.connectionId,
      Data: JSON.stringify({newMessage: message})
    }).promise().catch(handleError)
  })
  await Promise.all(tasks)

  return {
    statusCode: 200,
    body: 'Sent.'
  }
};

