new Vue({
    el: '#homepageButtons',
    data: {
        reportUrl: `/request/${new Hashids().encode(new Date().getTime() - 1627897194822)}`,
    }
})