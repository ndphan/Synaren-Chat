const dynamodbLayer = require("/opt/dynamodb-layer.js");

const NO_SESSION_FOUND_ERROR_MSG = { message: "no session was found" };

function mapUsersSessionData(data) {
  return {
    sessionId: data.SessionId.S,
    users: data.SessionUsers ? JSON.parse(data.SessionUsers.S) : [],
    lastModifiedDate: data.LastModifiedDate.S
  };
}

function mapChatSessionData(data) {
  return {
    sessionId: data.SessionId.S
  };
}

function updateUser(sessionUsers, correlationId, username) {
  const user = {
    username: username,
    correlationId: correlationId,
    lastActiveDate: Date.now().toString()
  };
  const existingUsers = {};
  sessionUsers.users.forEach(
    user => (existingUsers[user.correlationId] = user)
  );
  existingUsers[correlationId] = user;
  sessionUsers.users = Object.values(existingUsers);
  return sessionUsers;
}

function buildResponse(code, message) {
  return {
    statusCode: code,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: message
  };
}

exports.handler = async event => {
  if (!event.body) {
    return buildResponse(
      400,
      JSON.stringify({ message: "must have a request body" })
    );
  }
  try {
    const body = JSON.parse(event.body);
    const sessionId = body.sessionId;
    const correlationId = body.correlationId;
    const username = body.username;
    if (!sessionId || !correlationId || !username) {
      return buildResponse(
        400,
        JSON.stringify({
          message: "missing either sessionId, correlationId or username"
        })
      );
    }
    const session = await dynamodbLayer
      .isExistChatSession(sessionId)
      .then(mapChatSessionData)
      .catch(error => {
        if (error.message === dynamodbLayer.NO_CHAT_SESSION_FOUND_CODE) {
          return null;
        } else {
          throw new Error("internal server error");
        }
      });
    if (session) {
      const sessionUsers = await dynamodbLayer
        .getUsersSession(sessionId)
        .catch(error => {
          if (error.message === dynamodbLayer.NO_USER_SESSION_FOUND_CODE) {
            return dynamodbLayer.createUsersSession(sessionId);
          } else {
            throw error;
          }
        })
        .then(mapUsersSessionData);
      if (!sessionUsers.sessionId) {
        return buildResponse(
          404,
          JSON.stringify(NO_SESSION_FOUND_ERROR_MSG)
        );
      }
      const updatedSessionUsers = updateUser(
        sessionUsers,
        correlationId,
        username
      );
      const persistedSessionUsers = await dynamodbLayer
        .updateUsersSession(updatedSessionUsers)
        .then(mapUsersSessionData);
      return buildResponse(200, JSON.stringify(persistedSessionUsers));
    } else {
      return buildResponse(
        404,
        JSON.stringify(NO_SESSION_FOUND_ERROR_MSG)
      );
    }
  } catch (e) {
    return buildResponse(
      500,
      JSON.stringify({ message: "internal server error" })
    );
  }
};
