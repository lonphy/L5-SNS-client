/*****************************************************************
 * L5 SNS 信令交互线程
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function () {
    var Signling = null,
        listener = {};

    function SignlingHandler(evt) {
        var srcData = JSON.parse(evt.data),
            type = srcData.type,
            data = srcData.data;
        AsynExec(function () {
            listener[type] && listener[type](data);
        });
    }

    window.Signling = {
        init: function (url) {
            Signling = new WebSocket(url);
            Signling.onmessage = SignlingHandler;
            Signling.onerror = function (e) {
                console.log(e);
            }
        },
        emit: function (obj) {
            Signling.send(JSON.stringify(obj));
        },
        on: function (type, handler) {
            listener[type] = handler;
        }
    };
}());