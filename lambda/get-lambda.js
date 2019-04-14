const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-2'});
const uuidv1 = require('uuid/v1');
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
            session = await createNewSession();
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
