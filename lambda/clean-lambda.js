const AWS = require('aws-sdk');

AWS.config.update({region: 'ap-southeast-2'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function createInitialMessages(){
    return {'messages': []};
}

function mapDataToResponse(data){
    return {
        sessionId: data.SessionId.S,
        isActive: data.IsActive.N,
        messages: data.Messages.S
    }
}

async function findExpiredActiveSession(){
    const params = {
      TableName: 'chat-session',
      IndexName: 'IsActive-LastModifiedDate-index',
      ProjectionExpression: "SessionId, LastModifiedDate",
      KeyConditionExpression: "IsActive = :isActive AND LastModifiedDate < :ExpiryDate",
      ExpressionAttributeValues: {
        ":isActive": {N: '1'},
        ":ExpiryDate": {S: String(Date.now() - 2 * 60 * 60 * 1000)}
      }
    }
    return new Promise(function (resolve, reject) {
        ddb.query(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
    })
}

async function recycleExpiredSession(sessionId){
    const params = {
        TableName: 'chat-session',
        Key:{
            'SessionId' : {S: sessionId}
        },
        UpdateExpression: "set IsActive = :isActive, Messages = :initialMessages",
        ExpressionAttributeValues: {
            ":isActive": {N: '0'},
            ":initialMessages": {S: JSON.stringify(createInitialMessages())}
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

async function deleteExpiredSession(sessionId){
    const params = {
        TableName: 'chat-session',
        Key:{
            'SessionId' : {S: sessionId}
        }
    };
    return new Promise(function (resolve, reject) {
        ddb.deleteItem(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
    })
}

exports.handler = async (event) => {
    const expiredActiveSessions = await findExpiredActiveSession();
    const deletedSessions = await Promise.all(expiredActiveSessions.Items
      .map(session => deleteExpiredSession(session.SessionId.S)));
    return deletedSessions;
};
