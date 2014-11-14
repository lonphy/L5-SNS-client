/*****************************************************************
 * L5 SNS W3C HACK
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function (global, nav) {
    global.RTCPeerConnection = global.RTCPeerConnection || global.webkitRTCPeerConnection || global.mozRTCPeerConnection;

    // ID 选择器
    global.$ = function (id) {
        return document.getElementById(id)
    };
    // CSS 选择器
    global.$$ = function (selector, context) {
        return (context || document).querySelector(selector);
    }

    global.trace = function (text) {
        console.log((performance.now() / 1000).toFixed(3) + ": ", text)
    };
    nav.GetUserMedia = nav.GetUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia;
    Worker.prototype.send = Worker.prototype.postMessage;

    global.AsynExec = function (fn, time) {
        setTimeout(fn, time || 0);
    };
    global.logErr = function (e) {
        console.log(e);
    };

    Date.nowTime = function () {
        var time = new Date(),
            h = time.getHours(),
            i = time.getMinutes(),
            s = time.getSeconds();
        h = (h < 10 ? '0' : '') + h;
        i = (i < 10 ? '0' : '') + i;
        s = (s < 10 ? '0' : '') + s;
        return h + ':' + i + ':' + s;
    };

    Element.prototype.requestFullscreen = Element.prototype.requestFullscreen || Element.prototype.webkitRequestFullscreen || Element.prototype.mozRequestFullscreen;
    Element.prototype.matchesSelector = Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector;
}(window, navigator));