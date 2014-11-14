/*****************************************************************
 * L5 SNS 数据窗口
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function (global) {
    var box = $('data_window');


    function insertMsg(data) {
        var str = "<dl><dt>" + data.fromname + " - " + data.time + '</dt>' +
            '<dd>' + data.msg + '</dd></dl>';
        box.innerHTML = box.innerHTML + str;
    }


    global.MsgBox = {
        add: insertMsg,
        addSys: function (data) {

        }
    };
}(window));