aws cloudformation package \
  --template-file template.yaml \
  --output-template-file package.yaml \
  --s3-bucket synaren-cli && \
aws cloudformation deploy \
  --template-file package.yaml \
  --stack-name SynarenChat \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      DynamodbTableBaseName=chat-session \
      FunctionBaseName=SynarenChat