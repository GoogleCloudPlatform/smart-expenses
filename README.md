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

# Workflow

```
main:
    params: [input]
    steps:
    - start:
        call: sys.log
        args:
            text: ${input}
    - invoke_document_ai:
        call: http.post
        args:
            url: https://eu-documentai.googleapis.com/v1/projects/770605692057/locations/eu/processors/c799b15b13e7c838:batchProcess
            auth:
                type: OAuth2
            body:
                inputDocuments:
#                    gcsPrefix:
#                        gcsUriPrefix: "gs://smart-expenses/test"
                    gcsDocuments:
                        documents:
                            - gcsUri: "gs://smart-expenses/test/Starbucks.tiff"
                              mimeType: "image/tiff"
                documentOutputConfig:
                    gcsOutputConfig: 
                        gcsUri: "gs://smart-expenses/test-output"
                skipHumanReview: true
        result: document_ai_response
    - get_operation_name:
        assign:
            - operation_name: ${document_ai_response.body.name}
    - log_operation_name:
        call: sys.log
        args:
            text: ${"Operation name = " + operation_name}
    - call_lro_watcher:
        call: http.get
        args:
            url: ${"https://eu-documentai.googleapis.com/v1/" + operation_name}
            auth:
                type: OAuth2
        result: lro_update
    - log_new_lro_update:
        call: sys.log
        args:
            text: ${lro_update.body}        
    - check_lro_status:
        switch:
            - condition: ${"done" in lro_update.body and lro_update.body.done == True}
              next: check_error_or_response
        next: wait_a_bit
    - wait_a_bit:
        call: sys.sleep
        args:
            seconds: 10
        next: call_lro_watcher
    - check_error_or_response:
        switch:
            - condition: ${"error" in lro_update.body}
              next: log_error
        next: final_step
    - log_error:
        return: ${lro_update.body.error}
    - final_step:
        return: ${lro_update.body.metadata}
```