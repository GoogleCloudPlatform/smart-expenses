Vue.use(Vuefire.firestorePlugin, { wait: true })
const db = firebase.firestore();

var app = new Vue({
    el: '#admin',
    data: {
        reports: []
    },
    firestore: {
        reports: db.collection("requests").where("status", "==", "AWAITING")
    }
})