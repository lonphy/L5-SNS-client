/*****************************************************************
 * L5 SNS 信令处理
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function (global) {
    var Signling = null,
        listener = {};

    function SignlingHandler(evt) {
        var srcData = JSON.parse(evt.data),
            type = srcData.type,
            data = srcData.data;
        AsynExec(function () {
            listener[type] && listener[type].call(null, data);
        });
    }

    global.Signling = {
        /**
         * 信令初始化
         * @param url
         */
        init: function (url) {
            Signling = new WebSocket(url);
            Signling.onmessage = SignlingHandler;
            Signling.onerror = function (e) {
                console.log(e);
            }
        },
        /**
         * 发送信令
         * @param obj
         */
        emit: function (obj) {
            Signling.send(JSON.stringify(obj));
        },

        /**
         * 信令监听
         * @param type
         * @param handler
         */
        on: function (type, handler) {
            var org = typeof type, key;
            if (org === 'string') {
                listener[type] = handler;
            } else if (org === 'object') {
                for (key in type) {
                    if (type.hasOwnProperty(key))
                        listener[key] = type[key];
                }
            }
        }
    };
}(window));

/**************************************************************************
 * 应用数据模型
 *************************************************************************/
(function (global, Signling) {
    var users = {}, // 在线用户列表
        me = null,			// 自己
        listeners = {};

    Signling.init('ws://localhost:3491/');

    /***********************************
     * 事件分发
     ***********************************/
    function notify(type, data) {
        var handlers = listeners[type];
        if (handlers) {
            handlers.forEach(function (fn) {
                AsynExec(function () {
                    fn.call(null, data);
                });
            });
        }
    }

    Signling.on({
        // 用户登陆事件
        login: function (data) {
            me = data.me;
            NET.config(me);

            data.list.forEach(function (user) {
                users[user.id] = {name: user.name, id: user.id, cl: null};
            });
            notify('inited', me);
            notify('user:change', users);
        },


        // 新用户登陆通知事件
        new_login: function (data) {
            users[data.id] = {name: data.name, id: data.id, cl: null};
            notify('user:change', users);
        },

        // 用户登出通知事件
        logout: function (data) {
            users[data.id] && (delete users[data.id]);
            notify('user:logout', users);
            notify('user:change', users);
        },

        // 用户(视频/音频)呼叫事件
        syscall: function (data) {
            if (data['to'] === me.id) {
                var type = data.result;
                if (type === 'ask') {
                    // 如果用户空闲则提示
                    if (!MsgWin.isBusy()) {
                        notify('user:call:ask', data.from);
                        //否则返回呼叫忙
                    } else {
                        Signling.emit({
                            'cmd': 'resyscall',
                            'data': {
                                from: data.to,
                                to: data.from,
                                type: data.type,
                                result: 'busy'
                            }
                        })
                    }
                } else if (type === 'close') {
                    notify('user:call:close', data.from);
                }
            }
        },

        // 用户(视频/音频)接收事件
        resyscall: function (data) {
            if (data.to === me.id) {
                notify('user:call:' + data.result, data.from);
            }
        }
    });


    window.AppData = {
        getUser: function (id) {
            return users[id]
        },
        setUser: function (id, value) {
            users[id] = value
        },
        getMe: function () {
            return me
        },
        removeUser: function (id) {
            users[id] && delete users[id]
        },

        /****************************
         * 注册数据模型变更事件处理器
         * @param string type 类型
         * @param function fn 事件处理器
         **********************************/
        on: function (type, fn) {
            var org = typeof type;
            if (org === 'string') {
                !listeners[type] && (listeners[type] = []);
                listeners[type].push(fn);
            } else if (org === 'object') {
                for (fn in type) {
                    if (type.hasOwnProperty(fn)) {
                        !listeners[fn] && (listeners[fn] = []);
                        listeners[fn].push(type[fn]);
                    }
                }
            }
        },

        /****************************
         * 移除数据模型变更事件处理器
         * @param string type 类型
         * @param function fn 事件处理器
         **********************************/
        off: function (type, fn) {
            var handler = listeners[type],
                f,
                find = -1;
            if (handler) {
                for (f in handler) {
                    if (handler[f] === fn) {
                        find = handler[f];
                        break;
                    }
                }
                find !== -1 && delete listeners[type][find];
            }
        }
    };
}(window, window.Signling));

/***********************************************************************
 * rtc
 **********************************************************************/
(function (global, Signling, AppData) {
    var servers = {iceServers: [
            {"url": "stun:stun.l.google.com:19302"}
        ]},
        pc = null,
        myId = 0,
        myName = "",
        channel,

        currentUser = null,
        listeners = {};

    /***********************************
     * 事件分发
     ***********************************/
    function notify(type, data) {
        var handlers = listeners[type];
        if (handlers) {
            handlers.forEach(function (fn) {
                AsynExec(function () {
                    fn.call(null, data);
                });
            });
        }
    }


    /******************************
     * 设置本地desc
     *****************************/
    function gotDescription(desc) {
        if (desc.type === 'answer') {
            trace('stpe4. 设置本地desc');
        } else {
            trace('step1. 设置本地desc');
        }
        pc.setLocalDescription(desc, function () {
            Signling.emit({
                cmd: 'media_call',
                data: {
                    type: desc.type,
                    sdp: desc.sdp,
                    from: myId,
                    to: currentUser.id
                }
            });
        }, logErr);
    }

    /*************************************
     * 媒体添加处理器
     *************************************/
    function addStream(e) {
        trace('媒体添加事件..');
        console.log(e);
        notify('media:addvideo', URL.createObjectURL(e.stream));
    }

    /**************************************
     * P2P定位处理器
     *************************************/
    function iceCandidate(e) {
        if (e.candidate) {
            Signling.emit({
                cmd: "candidate",
                data: {
                    from: myId,
                    to: currentUser.id,
                    candidate: {
                        sdpMid: e.candidate.sdpMid,
                        sdpMLineIndex: e.candidate.sdpMLineIndex,
                        candidate: e.candidate.candidate
                    }
                }
            });
        }
    }

    function init(flag) {
        pc = new RTCPeerConnection(servers);
        pc.onaddstream = addStream;
        pc.onicecandidate = iceCandidate;

        navigator.GetUserMedia({audio: true, video: true}, function (s) {
            window.s = s;
            pc.addStream(s);
            if (flag === true) {
                trace('step3. 媒体准备OK...回复answer..');
                pc.createAnswer(gotDescription, logErr);
            } else {
                pc.createOffer(gotDescription, logErr);
            }
        }, logErr);
    }

    Signling.on("media_call", function (data) {
        if (!pc) {
            currentUser = AppData.getUser(data.from);
            init(true);
        }
        if (data.sdp) {
            var remoteDesc = new RTCSessionDescription({
                type: data.type,
                sdp: data.sdp
            });
            pc.setRemoteDescription(remoteDesc, function () {
                if (remoteDesc.type === 'offer') {
                    trace('step2. 设置remoteDesc成功');
                } else {
                    trace('step5. 设置remoteDesc成功');
                }
            }, logErr);
        }
    });

    Signling.on("candidate", function (data) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });


    global.NET = {
        // 配置自身ID
        config: function (info) {
            myId = info.id;
            myName = info.name;
        },
        run: function (user) {
            currentUser = user;
            if (!pc) {
                init();
            }
        },
        close: function () {
            listeners = {};
            if (pc)
                pc.close();
            pc = null;
            currentUser = null;
        },
        /****************************
         * 注册数据模型变更事件处理器
         * @param string type 类型
         * @param function fn 事件处理器
         **********************************/
        on: function (type, fn) {
            if (!listeners[type]) {
                listeners[type] = [];
            }
            listeners[type].push(fn);
        },
        emitText: function (msg) {
            var obj = {
                type: 'text',
                content: msg,
                time: Date.nowTime()
            };
            channel.send(JSON.stringify(obj));
            obj.from = myName;
            return obj;
        }
    };
}(window, window.Signling, window.AppData));

/**********************************
 * 系统声音提示模块
 **********************************/
(function (global) {
    var sound = {};

    function createSound(type, path) {
        var audio = sound[type];
        if (!audio) {
            audio = document.createElement('audio');
        }
        audio.src = path;
        audio.load();
        sound[type] = audio;
    }

    createSound('ring', '11.mp3');

    global.SYSNotice = {
        mobilefix: function () {
            this.play('ring');
            AsynExec(function () {
                SYSNotice.stop('ring', 100);
            });
        },
        play: function (type) {
            var audio = sound[type];
            if (audio) {
                audio.currentTime = 0;
                audio.play();
            }
        },
        stop: function (type) {
            sound[type] && sound[type].pause();
        }
    }
}(window));