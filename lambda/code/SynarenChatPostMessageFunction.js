const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-2' });
const ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
const tableName = 'chat-session';

function mapDataToResponse(data) {
  return {
    sessionId: data.SessionId.S,
    isActive: data.IsActive.N,
    messages: data.Messages.S
  }
}

function appendMessage(data, session) {
  const currentMessages = JSON.parse(session.messages);
  currentMessages.messages.push({
    username: data.username,
    message: data.message,
    createdDate: new Date().toISOString()
  });
  return JSON.stringify(currentMessages);
}

function buildUpdateTableParameter(updatedSession) {
  return {
    TableName: tableName,
    Key: {
      'SessionId': { S: updatedSession.sessionId }
    },
    UpdateExpression: "set Messages = :initialMessages, LastModifiedDate = :lastModifiedDate",
    ExpressionAttributeValues: {
      ":initialMessages": { S: updatedSession.messages },
      ":lastModifiedDate": { S: Date.now().toString() }
    },
    ReturnValues: "ALL_NEW"
  };
}

async function fetchSession(sessionId) {
  if(!sessionId){
    return Promise.reject("no session found");
  }
  const params = {
    TableName: tableName,
    Key: {
      'SessionId': { S: sessionId }
    },
    ProjectionExpression: "SessionId, IsActive, Messages"
  };
  return new Promise(function (resolve, reject) {
    ddb.getItem(params, function (err, data) {
      if (err) {
        reject(err);
      } else if (data.Item) {
        resolve(mapDataToResponse(data.Item));
      } else {
        reject(JSON.stringify({ message: "no session found" }))
      }
    });
  })
}

async function updateSession(updatedSession) {
  const params = buildUpdateTableParameter(updatedSession);
  return new Promise(function (resolve, reject) {
    ddb.updateItem(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(mapDataToResponse(data.Attributes));
      }
    });
  })
}

function buildResponse(message, code = 200) {
  return {
    statusCode: code,
    headers: { "Access-Control-Allow-Origin": '*' },
    body: message,
  }
}

exports.handler = async (event) => {
  if (!event.body) {
    return buildResponse(JSON.stringify({ message: "must have a request body" }), 400);
  }
  try {
    const body = JSON.parse(event.body);
    const sessionId = body.sessionId;
    const session = await fetchSession(sessionId);
    if (session) {
      session.messages = appendMessage(body, session);
      const sessionWithPost = await updateSession(session);
      return buildResponse(JSON.stringify(sessionWithPost), 200);
    } else {
      return buildResponse(JSON.stringify({ message: "no session was found" }), 404);
    }
  } catch (e) {
    return buildResponse(JSON.stringify({ message: "internal server error" }), 500);
  }
};
