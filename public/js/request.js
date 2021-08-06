var app = new Vue({
    el: '#request',
    data: {
        reportId: window.location.pathname.substring(9).toUpperCase(),
        images: [],
        submissionSent: false
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

document.querySelector("#formFiles").addEventListener('sl-submit', async (event) => {
    const reportId = app.reportId;
    const fileList = Array.from(document.querySelector("#filesInput").files);

    app.submissionSent = true;

    // store in GCS via Firestore Storage
    const storageRef = firebase.storage().ref();
    fileList.forEach(f => {
        const receiptRef = storageRef.child(`${reportId}/${f.name}`);
        receiptRef.put(f).then(e => console.log("Uploaded", f.name));
    });
    // TODO: ensure all files are uploaded before actually starting the call to the function workflow invoker

    // call function to start workflow execution
    const fileNames = fileList.map(f => f.name);
    // const body = { reportId, fileNames };
    const body = {
        inputDocuments: {
            gcsPrefix: {
                gcsUriPrefix: `gs://smart-expenses-incoming-receipts/${reportId}`
            }
        },
        documentOutputConfig: {
            gcsOutputConfig: {
                gcsUri: `gs://smart-expenses-parsed-receipts/${reportId}`
            }
        },
        skipHumanReview: true
    }

    // TODO: avoid hard-coded function URL
    const fnUrl = "https://europe-west1-easy-ai-serverless.cloudfunctions.net/invoke-workflow";
    try {
        const fnWorkflowResp = await fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify(body)
        });
        const outcome = await fnWorkflowResp.json();
        console.log("Function workflow outcome", outcome);
    } catch (e) {
        // TODO: notify web UI in case of error
        console.error(e);
    }
});