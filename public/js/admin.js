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

Vue.use(Vuefire.firestorePlugin, { wait: true })

const db = firebase.firestore();

var app = new Vue({
    el: '#admin',
    data: {
        reportsAwaiting: [],
        reportsApproved: [],
        reportsRejected: [],
        reportsError: [],
        actionOnReport: []
    },
    firestore: {
        reportsAwaiting: db.collection("requests").where("status", "==", "AWAITING"),
        reportsApproved: db.collection("requests").where("status", "==", "APPROVED"),
        reportsRejected: db.collection("requests").where("status", "==", "REJECTED"),
        reportsError: db.collection("requests").where("status", "==", "ERROR"),
    },
    methods: {
        approval: function(reportId, approval) {
            console.log(`${approval ? 'Approve' : 'Reject'} ${reportId}`);
            this.actionOnReport.push(reportId);
            this.callbackCall(reportId, approval);
        },
        callbackCall: async function(reportId, approval) {
            const report = this.reportsAwaiting.find(report => report.id == reportId);
            
            // TODO: avoid hard-coding the function URL
            const callbackFunctionUrl = "https://europe-west1-easy-ai-serverless.cloudfunctions.net/approval-callback";
            try {
                const callbackResp = await fetch(callbackFunctionUrl, {
                    method: "POST",
                    headers: { "Content-Type" : "application/json" },
                    body: JSON.stringify({ 
                        url: report.callback,
                        approved: approval 
                    })
                });
                const outcome = await callbackResp.json();
                console.log("Callback outcome", outcome);
            } catch (e) {
                // TODO: notify web UI in case of error
                console.error(e);
            }
        }
    }
})