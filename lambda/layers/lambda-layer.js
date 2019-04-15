const AWS = require("aws-sdk");
var lambda = new AWS.Lambda({
  region: "ap-southeast-2"
});
module.exports.invokeAddActiveUserEvent = function(body) {
  lambda.invoke({
    FunctionName: "cloud-chat-active-users-post",
    InvocationType: "Event",
    Payload: JSON.stringify({
      body: JSON.stringify(body)
    })
  }).promise();
};
