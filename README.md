# paradox-security-service
A proxy passing events from arduino attached to Paradox Home Security system to dynamodb

This simple node service listens for incoming UDP packets from arduino attached to Paradox Home Security system

Data is then passed to AWS DynamoDB which then can be access via Android application.
