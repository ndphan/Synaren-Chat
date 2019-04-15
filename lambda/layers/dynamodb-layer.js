const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB({
  apiVersion: "2012-10-08",
  region: "ap-southeast-2"
});
const chatSessionUsersTableName = "chat-session-users";
const chatSessionTableName = "chat-session";
const NO_CHAT_SESSION_FOUND_CODE = "no session found";
const NO_USER_SESSION_FOUND_CODE = "no user session found";
const TEST_SESSION = "037ef6e0-Test-037ef6e0";

module.exports.NO_CHAT_SESSION_FOUND_CODE = NO_CHAT_SESSION_FOUND_CODE;
module.exports.NO_USER_SESSION_FOUND_CODE = NO_USER_SESSION_FOUND_CODE;

module.exports.updateUsersSession = async function(sessionUsers) {
  const params = {
    TableName: chatSessionUsersTableName,
    Key: {
      SessionId: { S: sessionUsers.sessionId }
    },
    UpdateExpression:
      "set SessionUsers = :users, LastModifiedDate = :lastModifiedDate",
    ExpressionAttributeValues: {
      ":users": { S: JSON.stringify(sessionUsers.users) },
      ":lastModifiedDate": { S: Date.now().toString() }
    },
    ReturnValues: "ALL_NEW"
  };
  return ddb
    .updateItem(params)
    .promise()
    .then(data => data.Attributes);
};

module.exports.createUsersSession = async function(sessionId) {
  const params = {
    TableName: chatSessionUsersTableName,
    Item: {
      IsActive: { N: "1" },
      SessionId: { S: sessionId },
      SessionUsers: { S: "[]" },
      LastModifiedDate: { S: Date.now().toString() },
      CreatedDate: { S: Date.now().toString() }
    }
  };
  return ddb
    .putItem(params)
    .promise()
    .then(_ => module.exports.getUsersSession(sessionId));
};

module.exports.getUsersSession = async function(sessionId) {
  if (!sessionId) {
    return Promise.reject(NO_CHAT_SESSION_FOUND_CODE);
  }
  const params = {
    TableName: chatSessionUsersTableName,
    Key: {
      SessionId: { S: sessionId }
    },
    ProjectionExpression: "SessionId, SessionUsers, LastModifiedDate"
  };
  return ddb
    .getItem(params)
    .promise()
    .then(data => {
      if (data.Item) {
        return data.Item;
      } else {
        throw { message: NO_USER_SESSION_FOUND_CODE };
      }
    });
};

module.exports.isExistChatSession = async function(sessionId) {
  if (!sessionId) {
    return Promise.reject(NO_CHAT_SESSION_FOUND_CODE);
  }
  const params = {
    TableName: chatSessionTableName,
    Key: {
      SessionId: { S: sessionId }
    },
    ProjectionExpression: "SessionId"
  };
  return ddb
    .getItem(params)
    .promise()
    .then(data => {
      if (data.Item) {
        return data.Item;
      } else {
        throw { message: NO_CHAT_SESSION_FOUND_CODE };
      }
    });
};

module.exports.findExpiredUsersSession = async function() {
  const params = {
    TableName: chatSessionUsersTableName,
    IndexName: "IsActive-LastModifiedDate-index",
    ProjectionExpression: "SessionId, LastModifiedDate",
    KeyConditionExpression:
      "IsActive = :isActive AND LastModifiedDate < :ExpiryDate",
    FilterExpression: "SessionId <> :TestSession",
    ExpressionAttributeValues: {
      ":isActive": { N: "1" },
      ":ExpiryDate": { S: String(Date.now() - 2 * 60 * 60 * 1000) },
      ":TestSession": { S: TEST_SESSION }
    }
  };
  return ddb.query(params).promise();
};

module.exports.findExpiredActiveChatSession = async function() {
  const params = {
    TableName: chatSessionTableName,
    IndexName: "IsActive-LastModifiedDate-index",
    ProjectionExpression: "SessionId, LastModifiedDate",
    KeyConditionExpression:
      "IsActive = :isActive AND LastModifiedDate < :ExpiryDate",
    FilterExpression: "SessionId <> :TestSession",
    ExpressionAttributeValues: {
      ":isActive": { N: "1" },
      ":ExpiryDate": { S: String(Date.now() - 2 * 60 * 60 * 1000) },
      ":TestSession": { S: TEST_SESSION }
    }
  };
  return ddb.query(params).promise();
};

module.exports.deleteChatSession = async function(sessionId) {
  const params = {
    TableName: chatSessionTableName,
    Key: {
      SessionId: { S: sessionId }
    }
  };
  return ddb.deleteItem(params).promise();
};

module.exports.deleteBatchChatSession = async function(sessionIds) {
  if (!sessionIds || !sessionIds.length) {
    return Promise.reject(NO_CHAT_SESSION_FOUND_CODE);
  }
  const deleteRequest = sessionIds.map(sessionId => ({
    DeleteRequest: {
      Key: {
        SessionId: {
          S: sessionId
        }
      }
    }
  }));
  const params = {
    RequestItems: {
      [chatSessionTableName]: deleteRequest
    }
  };
  return ddb.batchWriteItem(params).promise();
};

module.exports.deleteBatchUsersSession = async function(sessionIds) {
  if (!sessionIds || !sessionIds.length) {
    return Promise.reject(NO_USER_SESSION_FOUND_CODE);
  }
  const deleteRequest = sessionIds.map(sessionId => ({
    DeleteRequest: {
      Key: {
        SessionId: {
          S: sessionId
        }
      }
    }
  }));
  const params = {
    RequestItems: {
      [chatSessionUsersTableName]: deleteRequest
    }
  };
  return ddb.batchWriteItem(params).promise();
};

module.exports.createSession = async function(newSessionId) {
  const params = {
    TableName: chatSessionTableName,
    Item: {
      SessionId: { S: newSessionId },
      IsActive: { N: "1" },
      Messages: { S: JSON.stringify({ messages: [] }) },
      LastModifiedDate: { S: Date.now().toString() },
      CreatedDate: { S: Date.now().toString() }
    }
  };
  return ddb
    .putItem(params)
    .promise()
    .then(_ => module.exports.getChatSession(newSessionId));
};

module.exports.getChatSession = async function(sessionId) {
  const params = {
    TableName: chatSessionTableName,
    Key: {
      SessionId: { S: sessionId }
    },
    ProjectionExpression: "SessionId, IsActive, Messages"
  };
  return ddb
    .getItem(params)
    .promise()
    .then(data => {
      if (data.Item) {
        return data.Item;
      } else {
        throw { message: NO_CHAT_SESSION_FOUND_CODE };
      }
    });
};
