const allStates = {
    NOT_SUBMITTED: ['primary', 'info-circle', 'Report not submitted', 'The report has not been submitted yet.'],
    SUBMITTED: ['primary', 'check2-circle', 'Report submitted', 'Your report has been submitted, and will be processed soon, then your manager will review your submission.'],
    PROCESSING: ['primary', 'info-circle', 'Report is being processed', 'Your report has been submitted, and is currently being processed.'],
    AWAITING: ['primary', 'info-circle', 'Report is awaiting validation', 'Your manager has received your report, will review it, and then validate or reject it.'],
    APPROVED: ['success', 'check2-circle', 'Report validated', 'Your manager has validated your report.'],
    REJECTED: ['danger', 'exclamation-octagon', 'Report rejected', 'Your manager has rejected your report.'],
    ERROR: ['danger', 'exclamation-octagon', 'Error occured', 'An error occurred while processing your report. Please contact your IT department.']
}

const reportId = window.location.pathname.substring(9);

var app = new Vue({
    el: '#request',
    data: { 
        reportId: reportId,
        images: [],
        status: "NOT_SUBMITTED",
        alert: allStates["NOT_SUBMITTED"][0],
        icon: allStates["NOT_SUBMITTED"][1],
        title: allStates["NOT_SUBMITTED"][2],
        description: allStates["NOT_SUBMITTED"][3]
    },
    watch: {
        status: function(newVal, oldVal) {
            this.alert = allStates[this.status][0];
            this.icon = allStates[this.status][1];
            this.title = allStates[this.status][2];
            this.description = allStates[this.status][3];
        }
    },
    methods: {
        onFileChange: function(e) {
            var files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;

            this.images = [];
            var vm = this;
            Array.from(files).forEach(f => {
                var reader = new FileReader();
                reader.onload = (e) => {
                    vm.images.push({
                        src: e.target.result,
                        title: f.name
                    });
                };
                reader.readAsDataURL(f);
            });
        },
        clickFileChooser: function(e) {
            document.querySelector("#filesInput").click(e);
        }
    }
})

const db = firebase.firestore();
db.collection("requests").doc(reportId).onSnapshot((doc) => {
    if (doc.data()) {
        app.status = doc.data().status;
        console.log("New status from Firestore: ", app.status);
    }
});

document.querySelector("#formFiles").addEventListener('sl-submit', async (event) => {
    const reportId = app.reportId;
    const fileList = Array.from(document.querySelector("#filesInput").files);

    app.status = "SUBMITTED";

    // store in GCS via Firestore Storage
    const storageRef = firebase.storage().ref();
    for await (const f of fileList) {
        const receiptRef = storageRef.child(`${reportId}/${f.name}`);
        await receiptRef.put(f);
        await receiptRef.getDownloadURL();
        console.log("Uploaded", f.name);
    }
    // TODO: ensure all files are uploaded before actually starting the call to the function workflow invoker

    // call function to start workflow execution

    // TODO: avoid hard-coded function URL
    const fnUrl = "https://europe-west1-easy-ai-serverless.cloudfunctions.net/invoke-workflow";
    try {
        const fnWorkflowResp = await fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({ reportId })
        });
        const outcome = await fnWorkflowResp.json();
        console.log("Workflow execution", outcome);
    } catch (e) {
        // TODO: notify web UI in case of error
        console.error(e);
    }
});