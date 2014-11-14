/*****************************************************************
 * L5 SNS 客户端入口
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function () {
    var loginMask = $('mod-login'),
        onlines = $('onlines');


    AppData.on({
        /************************************
         * 渲染用户列表变更
         ************************************/
        "user:change": function (users) {
            var str = [], id;
            for (id in users) {
                str.push("<li data-id='" + id + "'><span>" + users[id].name +
                    "</span><a data-cmd='video'></a><a data-cmd='audio'></a></li>");
            }
            onlines.innerHTML = str.join('');
        },

        /*************************************
         * 数据模型初始化
         *************************************/
        "inited": function (me) {
            loginMask.hidden = true;
            $$('header').innerHTML = '用户：<span>' + me.name + '</span>, 状态：<span>在线</span>';
        },

        /*************************************
         * 用户呼叫事件
         *************************************/
        // 呼叫询问
        "user:call:ask": function (id) {
            MsgWin.open(id, 'video', 'ask');
        },
        // 呼叫关闭
        "user:call:close": function (id) {
            MsgWin.close(id, '连接已关闭');
        },
        // 呼叫通过
        "user:call:accept": function (id) {
            MsgWin.connect(id, '对方已接受，准备建立连接');
        },
        // 呼叫拒绝
        "user:call:reject": function (id) {
            MsgWin.close(id, '对方拒接');
        },
        // 呼叫忙
        "user:call:busy": function (id) {
            MsgWin.close(id, '对方正在通话中');
        }
    });


    /**********************
     * 用户列表点击事件
     **********************/
    onlines.addEventListener('click', function (e) {
        var tar = e.target;
        if (tar.nodeName === 'A') {
            AsynExec(function () {
                if (tar.matchesSelector('a[data-cmd=video]')) { // 视频处理
                    MsgWin.open(tar.parentNode.dataset['id'], 'video', 'call');
                } else {
                    console.log('audio');
                }
            });
        }
    }, false);


////////////////////// 登陆 /////////////////////////////
    document.forms[0].addEventListener("submit", function (e) {
        e.preventDefault();
        var username = this['username'],
            password = this['password'];
        $$('button', this).disabled = username.disabled = password.disabled = true;
        // document.body.requestFullscreen();
        SYSNotice.mobilefix();
        Signling.emit({
            cmd: 'login',
            username: username.value,
            password: password.value
        });
        e.stopPropagation();
    }, false);

}());