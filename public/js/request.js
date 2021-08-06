var app = new Vue({
    el: '#request',
    data: {
        reportId: window.location.pathname.substring(9).toUpperCase(),
        images: []
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

document.querySelector("#formFiles").addEventListener('sl-submit', event => {
    // const formData = event.detail.formData;
    // console.log("sl-submit", Array.from(formData.values()));
    const reportId = app.reportId;
    const fileList = Array.from(document.querySelector("#filesInput").files);

    const storageRef = firebase.storage().ref();
    fileList.forEach(f => {
        const receiptRef = storageRef.child(`${reportId}/${f.name}`);
        receiptRef.put(f).then(e => console.log("Uploaded", f.name));
    });
});