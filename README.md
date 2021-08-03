# Smart Expenses demo

## Web assets with Firebase

Checkout the project:
```
git clone https://github.com/glaforge/smart-expenses.git
```

Login with Firebase (use `--no-localhost` flag in Cloud Shell):
```
firebase login --no-localhost
```

Deploy static assets to Firebase hosting
```
firebase deploy --only hosting
```

Run local server:
```
firebase serve
```

## Functions deployment

Environment variables
```
export FUNCTION_REGION=europe-west1
export WORKFLOW_REGION=europe-west4
export WORKFLOW_NAME=batch-process-receipts
```

Function invoking the workflow from the web frontend:
```
gcloud functions deploy invoke-workflow \
  --region=${REGION} \
  --source=./functions/invoke-workflow \
  --runtime nodejs14 \
  --entry-point=invokeWorkflow \
  --set-env-vars PROJECT_ID=${GOOGLE_CLOUD_PROJECT},REGION=${WORKFLOW_REGION},WORKFLOW_NAME=${WORKFLOW_NAME} \
  --trigger-http \
  --allow-unauthenticated
```