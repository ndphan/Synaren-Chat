const dynamodbLayer = require("/opt/dynamodb-layer.js");

function mapUsersSessionData(data) {
  const currentDate3Mins = Date.now() - 3 * 60 * 1000;
  return {
    sessionId: data.SessionId.S,
    users: data.SessionUsers
      ? JSON.parse(data.SessionUsers.S).filter(user => user.lastActiveDate - currentDate3Mins > 0)
      : [],
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
        if (error.message === dynamodbLayer.NO_USER_SESSION_FOUND_CODE) {
          return { status: 200, message: "no user session was found" };
        } else {
          throw error;
        }
      });
    return buildResponse(session.status || 200, JSON.stringify(session));
  } catch (e) {
    return buildResponse(
      500,
      JSON.stringify({ message: "internal server error" })
    );
  }
};
