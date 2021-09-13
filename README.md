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
export GOOGLE_CLOUD_PROJECT=easy-ai-serverless

export FUNCTION_REGION=europe-west1
export WORKFLOW_REGION=europe-west4
export WORKFLOW_NAME=batch-process-receipts
```

Function invoking the workflow from the web frontend:
```
gcloud functions deploy invoke-workflow \
  --region=${FUNCTION_REGION} \
  --source=./services/invoke-workflow \
  --runtime nodejs14 \
  --entry-point=invokeWorkflow \
  --set-env-vars PROJECT_ID=${GOOGLE_CLOUD_PROJECT},WORKFLOW_REGION=${WORKFLOW_REGION},WORKFLOW_NAME=${WORKFLOW_NAME} \
  --trigger-http \
  --allow-unauthenticated
```

Function calling the workflow callback from the web frontend:
```
gcloud functions deploy approval-callback \
  --region=${FUNCTION_REGION} \
  --source=./services/approval-callback \
  --runtime nodejs14 \
  --entry-point=approvalCallbackCall \
  --trigger-http \
  --allow-unauthenticated
```

*Note:* The service account used by the function calling the callback URL should have the `Workflows Editor` (or `Workflows Admin`) and `Service Account Token Creator` permissions.

## Firestore setup

To allow the web pages to access the data (in read-only mode) in Firestore, the security rules for Firestore should be updated with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
