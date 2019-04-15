const dynamodbLayer = require("/opt/dynamodb-layer.js");

function mapUsersSessionData(data) {
  return {
    sessionId: data.SessionId.S,
    users: data.SessionUsers ? JSON.parse(data.SessionUsers.S) : [],
    lastModifiedDate: data.LastModifiedDate.S
  };
}

function buildResponse(code, message) {
  return {
    statusCode: code,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: message
  };
}

exports.handler = async event => {
  if (!event.queryStringParameters || !event.queryStringParameters["session"]) {
    return buildResponse(
      400,
      JSON.stringify({ message: "no session query parameter specified" })
    );
  }
  try {
    const sessionId = event.queryStringParameters["session"];
    const session = await dynamodbLayer
      .getUsersSession(sessionId)
      .then(mapUsersSessionData)
      .catch(error => {
        if (error === dynamodbLayer.NO_USER_SESSION_FOUND_CODE) {
          return { message: "no user session was found" };
        } else {
          throw error;
        }
      });
    return buildResponse(200, JSON.stringify(session));
  } catch (e) {
    return buildResponse(
      400,
      JSON.stringify({ message: "internal server error" })
    );
  }
};
