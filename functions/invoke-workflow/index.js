// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const cors = require('cors')({origin: true});
const {ExecutionsClient} = require('@google-cloud/workflows');
const client = new ExecutionsClient();

exports.invokeWorkflow = async (req, res) => {
  cors(req, res, async () => {
    res.set('Access-Control-Allow-Origin', '*');

    const body = req.body;
    console.log("Incoming input: ", body);

    const PROJECT_ID = process.env.PROJECT_ID;
    const WORKFLOW_REGION = process.env.WORKFLOW_REGION;
    const WORKFLOW_NAME = process.env.WORKFLOW_NAME;
    console.log(`Project ID: ${PROJECT_ID} / Region: ${WORKFLOW_REGION} / Workflow: ${WORKFLOW_NAME}`);

    const argument = JSON.stringify(body);
    console.log("Stringified arg:", argument);

    try {
      const execResponse = await client.createExecution({
        parent: client.workflowPath(PROJECT_ID, WORKFLOW_REGION, WORKFLOW_NAME),
        execution: {
          argument: argument
        }
      });
      console.log(`Batch processing receipts workflow execution request: ${JSON.stringify(execResponse)}`);

      const execName = execResponse[0].name;
      console.log(`Batch processing receipts workflow execution: ${execName}`);
      res.status(200).json({executionId: execName});
    } catch (e) {
      console.error(e);
      res.status(500).json({error: e.message});
    }
  });
};