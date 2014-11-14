/*****************************************************************
 * L5 SNS 信令交互线程
 * @author lonphy
 * @version 1.0
 ****************************************************************/
var ws;

function serverHandle(e) {
    var data = JSON.parse(e.data);
    postMessage(data);
};

onmessage = function (e) {
    var msg = e.data;
    switch (msg.cmd) {
        case 'init' :
            socketInit(msg.data);
            break;
        case 'media_call':
        case 'candidate' :
            wsSend(msg);
    }
};

function socketInit(username) {
    ws = new WebSocket("ws://localhost:3491");
    ws.onopen = function (e) {
        wsSend({cmd: "login", username: username});
    };

    ws.onclose = function (e) {
    };

    ws.onmessage = serverHandle;
}

function wsSend(obj) {
    ws.send(JSON.stringify(obj));
}