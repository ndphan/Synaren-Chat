const dynamodbLayer = require("/opt/dynamodb-layer.js");
const lambdaLayer = require("/opt/lambda-layer.js");
const randomWord = require("/opt/random-words.js");

function mapChatData(data) {
  return {
    sessionId: data.SessionId.S,
    isActive: data.IsActive.N,
    messages: data.Messages.S
  };
}

function buildResponse(code, message) {
  return {
    statusCode: code,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: message
  };
}

function logUser(event, session) {
  const correlationId = event.queryStringParameters["correlationId"];
  const username = event.queryStringParameters["username"];
  if (correlationId && username) {
    lambdaLayer.invokeAddActiveUserEvent({
      sessionId: session.sessionId,
      correlationId: correlationId,
      username: username
    });
  }
}

exports.handler = async event => {
  if (!event.queryStringParameters) {
    return buildResponse(
      400,
      JSON.stringify({ message: "no query parameter specified" })
    );
  }
  try {
    let session;
    if (event.queryStringParameters["new-session"]) {
      session = await dynamodbLayer
        .createSession(
          randomWord({
            min: 3,
            max: 4,
            join: "",
            formatter: word => word.charAt(0).toUpperCase() + word.slice(1)
          })
        )
        .then(mapChatData);
    } else if (event.queryStringParameters["session"]) {
      const sessionId = event.queryStringParameters["session"];
      session = await dynamodbLayer.getChatSession(sessionId).then(mapChatData);
    }
    logUser(event, session);
    return buildResponse(200, JSON.stringify(session));
  } catch (e) {
    return buildResponse(
      500,
      JSON.stringify({ message: "internal server error" })
    );
  }
};
