var app = new Vue({
    el: '#request',
    data: {
        reportId: window.location.pathname.substring(9).toUpperCase(),
        inp: 1234
    }
})