const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-2'});
const uuidv1 = require('uuid/v1');
const lambda = new AWS.Lambda();
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

async function findInactiveSession(){
    const params = {
      TableName: 'chat-session',
      IndexName: 'IsActive-LastModifiedDate-index',
      Limit: 1,
      ProjectionExpression: "SessionId",
      KeyConditionExpression: "IsActive = :v1",
      ExpressionAttributeValues: {
        ":v1": {N: '0'}
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

async function createNewSession(){
    const newSessionId = uuidv1();
    const params = {
      TableName: 'chat-session',
      Item: {
        'SessionId' : {S: newSessionId},
        'IsActive' : {N: '1'},
        'Messages' : {S: JSON.stringify(createInitialMessages())},
        'LastModifiedDate': {S: Date.now().toString()},
        'CreatedDate': {S: Date.now().toString()}
      },
    };
    return new Promise(function (resolve, reject) {
        ddb.putItem(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve({
                sessionId: newSessionId,
                isActive: 1,
                messages: JSON.stringify(createInitialMessages())
            });
          }
        });
    })
}

async function recycleOldSession(sessionId){
    const params = {
        TableName: 'chat-session',
        Key:{
            'SessionId' : {S: sessionId}
        },
        UpdateExpression: "set IsActive = :isActive, Messages = :initialMessages, LastModifiedDate = :lastModifiedDate",
        ExpressionAttributeValues: {
            ":isActive": {N: '1'},
            ":initialMessages": {S: JSON.stringify(createInitialMessages())},
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

function triggerCleanup(){
  lambda.invoke({
    FunctionName: 'cloud-chat-clean',
    InvocationType: 'Event'
  }, function(error, data) {});
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

exports.handler = async (event) => {
    if(!event.queryStringParameters) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify({ message: "no query parameter specified"})
        }
    }
    try {
        let session;
        if(event.queryStringParameters['new-session']){
            // const inactiveSession = await findInactiveSession(); 
            // if(inactiveSession.Count === 0) {
                // triggerCleanup(); // try to clean up to free up more sessions
                session = await createNewSession();
            // } else {
                // session = await recycleOldSession(inactiveSession.Items[0].SessionId.S);
            // }
        } else if(event.queryStringParameters['session']){
            const sessionId = event.queryStringParameters['session'];
            session = await fetchSession(sessionId);
        }
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify(session),
        };
    } catch(e) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin":'*' },
            body: JSON.stringify({ message: "internal server error"}),
        };
    }
};
