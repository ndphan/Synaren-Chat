const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-2'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function mapDataToResponse(data){
    return {
        sessionId: data.SessionId.S,
        isActive: data.IsActive.N,
        messages: data.Messages.S
    }
}

function appendMessage(data, session){
    const currentMessages = JSON.parse(session.messages);
    currentMessages.messages.push({
        username: data.username,
        message: data.message
    });
    return JSON.stringify(currentMessages);
}

async function fetchSession(sessionId){
    const params = {
      TableName: 'chat-session',
      Key: {
        'SessionId' : {S: sessionId}
      },
      ProjectionExpression: "SessionId, IsActive, Messages"
    };
    return new Promise(function (resolve, reject) {
        ddb.getItem(params, function(err, data) {
          if (err) {
            reject(err);
          } else if(data.Item){
            resolve(mapDataToResponse(data.Item));
          } else {
            reject(JSON.stringify({ message: "no session found"}))
          }
        });
    })
}

async function updateSession(updatedSession){
    const params = {
        TableName: 'chat-session',
        Key: {
            'SessionId' : {S: updatedSession.sessionId}
        },
        UpdateExpression: "set Messages = :initialMessages, LastModifiedDate = :lastModifiedDate",
        ExpressionAttributeValues: {
            ":initialMessages": {S: updatedSession.messages},
            ":lastModifiedDate": {S: Date.now().toString()}
        },
        ReturnValues: "ALL_NEW"
    };
    return new Promise(function (resolve, reject) {
        ddb.updateItem(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(mapDataToResponse(data.Attributes));
          }
        });
    })      
}

exports.handler = async (event) => {
    if (!event.body) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify({ message: "must have a request body"})
        }
    }
    try {
        const body = JSON.parse(event.body);
        const sessionId = body.sessionId;
        const session = await fetchSession(sessionId);
        session.messages = appendMessage(body, session);
        const sessionWithPost = await updateSession(session);
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify(sessionWithPost),
        };
    } catch(e) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify({ message: "internal server error"}),
        };
    }
};
