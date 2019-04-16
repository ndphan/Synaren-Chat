const dynamodbLayer = require("/opt/dynamodb-layer.js");

exports.handler = async _ => {
  const expiredActiveChat = await dynamodbLayer.findExpiredActiveChatSession();
  const deleteBatchChatSession = dynamodbLayer.deleteBatchChatSession(
    expiredActiveChat.Items.map(session => session.SessionId.S)
  );
  const expiredUser = await dynamodbLayer.findExpiredUsersSession();
  const deleteBatchUserSession = dynamodbLayer.deleteBatchUsersSession(
    expiredUser.Items.map(session => session.SessionId.S)
  );
  await Promise.all([
    // make sure if they are reject then resolve them
    deleteBatchChatSession
      .catch(err => console.error(err))
      .then(e => Promise.resolve(e)),
    deleteBatchUserSession
      .catch(err => console.error(err))
      .then(e => Promise.resolve(e))
  ]).catch(err => console.error(err));
  return {
    chat: expiredActiveChat,
    userSession: expiredUser
  };
};
