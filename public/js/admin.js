Vue.use(Vuefire.firestorePlugin, { wait: true })

const db = firebase.firestore();

var app = new Vue({
    el: '#admin',
    data: {
        reportsAwaiting: [],
        reportsApproved: [],
        reportsRejected: [],
        reportsError: [],
    },
    firestore: {
        reportsAwaiting: db.collection("requests").where("status", "==", "AWAITING"),
        reportsApproved: db.collection("requests").where("status", "==", "APPROVED"),
        reportsRejected: db.collection("requests").where("status", "==", "REJECTED"),
        reportsError: db.collection("requests").where("status", "==", "ERROR"),
    },
    methods: {
        approve: function(reportId) {
            console.log(`Approve ${reportId}`);
            this.callbackCall(reportId, true);
        },
        reject: function(reportId) {
            console.log(`Reject ${reportId}`)
            this.callbackCall(reportId, false);
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