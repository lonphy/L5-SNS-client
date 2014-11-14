/*****************************************************************
 * L5 SNS 通话界面事件
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function (data) {

    var status = 'free',	// 该客户端通话状态
        user = null,
        handler = $('video-window'),
        box = handler.parentNode,
        title = $$('h4', handler),
        view = $$('video', handler);

    $$('button[data-cmd=close]', handler).addEventListener('click', function () {
        doVideoCall('syscall', 'video_call', 'close');
        close();
    }, false);

    $$('button[data-cmd=accept]', handler).addEventListener('click', function () {
        doVideoCall('resyscall', 'video_call', 'accept');
        videoEvent();
        SYSNotice.stop('ring');
        handler.className = 'call';
    }, false);

    $$('button[data-cmd=reject]', handler).addEventListener('click', function () {
        handler.style.display = 'none';
        status = 'free';
        SYSNotice.stop('ring');
        doVideoCall('resyscall', 'video_call', 'reject');
    }, false);


    function videoEvent() {
        NET.on('media:addvideo', function (s) {
            trace('recv a video stream');
            view.src = s;
        });
    }

    function doVideoCall(cmd, type, result) {
        Signling.emit({
            cmd: cmd,
            data: {
                from: (AppData.getMe())['id'],
                to: user.id,
                type: type,
                result: result
            }
        });
    }


    function close() {
        NET.close();
        view.src = "";
        handler.style.display = 'none';
        console.log('haltiing....');
        status = 'free';
    }

    function showCall(user, type) {
        handler.className = 'call';
        title.innerText = '呼叫 ' + user.name;
        doVideoCall('syscall', 'video_call', 'ask');
    }

    function showAsk(user, type) {
        handler.className = 'ask';
        title.innerText = user.name + " 来电";
        SYSNotice.play('ring');
    }

    window.MsgWin = {
        // 显示UI
        open: function (id, type, action) {
            if (status === 'busy') return;
            status = 'busy';	// 设置占用
            user = AppData.getUser(id);
            action === 'ask' ? showAsk(user, type) : showCall(user, type);
            handler.style.display = 'flex';
        },

        // 连接
        connect: function (id) {
            if (status === 'busy' && id === user.id) {
                NET.run(user);
                videoEvent();
            }
        },

        // 关闭
        close: function (id, msg) {
            if (status === 'busy' && id === user.id) {
                close();
            }
        },

        // 是否在忙碌中。。。
        isBusy: function () {
            return status === 'busy'
        }
    };
}(AppData));