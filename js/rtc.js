/*****************************************************************
 * L5 SNS webRTC
 * @author lonphy
 * @version 1.0
 ****************************************************************/
var signalingChannel = new Worker("js/SignalingChannel.js"),
    peer,
    channel,

    localView = $('self-video'),
    remoteView = $('remote-video'),

    servers = {iceServers: [
        {"url": "stun:stun.l.google.com:19302"}
    ]},
//servers = {iceServers:[]},
    peerOptional = {
        optional: [
            {DtlsSrtpKeyAgreement: true},
            {RtpDataChannels: true}
        ]
    };

function start(isCalled) {
    if (UserList.currentUser() === null) return;
    peer = new RTCPeerConnection(servers);

    peer.onaddstream = function (e) {
        trace('start remote video..');
        remoteView.src = URL.createObjectURL(e.stream);
    };

    peer.onicecandidate = function (e) {
        trace('正在打洞......');
        if (e.candidate) {
            signalingChannel.send({
                cmd: "candidate",
                data: {
                    from: (UserList.getMe())['id'],
                    to: (UserList.currentUser())['id'],
                    candidate: {
                        sdpMid: e.candidate.sdpMid,
                        sdpMLineIndex: e.candidate.sdpMLineIndex,
                        candidate: e.candidate.candidate
                    }
                }
            });
        }
    };

    peer.onnegotiationneeded = function (e) {
        peer.createOffer(gotDescription, logErr);
    };

    /*******************************************************************
     navigator.GetUserMedia({audio:true,video:true}, function(stream){
		localView.src = URL.createObjectURL(stream);
		peer.addStream(stream);

		if(isCalled === true){
			gotDescription.type = "ack";
			peer.createAnswer(gotDescription, logErr);
		}else{
			peer.createOffer(gotDescription, logErr);
		}
	}, logErr);

     **********************************************************************/
    if (isCalled !== true) {
        channel = peer.createDataChannel("sns-chat");
        setupChat();
    } else {
        peer.ondatachannel = function (e) {
            channel = e.channel;
            setupChat();
        };
    }

    trace('peer created ....');
}

function gotDescription(desc) {
    peer.setLocalDescription(desc, function () {
        signalingChannel.send({
            cmd: gotDescription.type === 'ack' ? 'media_pong' : 'media_call',
            data: {
                type: desc.type,
                sdp: desc.sdp,
                from: (UserList.getMe())['id'],
                to: (UserList.currentUser())['id']
            }
        });
    }, logErr);
}


function setupChat() {
    channel.onopen = function () {
        channel.send('data channel is opened!');
    };

    channel.onmessage = function (evt) {
        trace('>>>>data-channel:' + evt.data);
    };
}

signalingChannel.onmessage = function (evt) {
    if (!peer) {
        start(true);
    }
    var msg = evt.data;
    switch (msg.type) {
        case 'candidate' :
            trace('websocket [candidate] signaling....');
            AsynExec(function () {
                peer.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
            });
            break;
        case 'media_call' :
            trace('websocket [media_call] signaling....');
            AsynExec(function () {
                if (msg.data.sdp) {
                    var remoteDesc = new RTCSessionDescription({
                        type: msg.data.type,
                        sdp: msg.data.sdp
                    });
                    peer.setRemoteDescription(remoteDesc, function (aa) {
                        if (remoteDesc.type === 'offer') {
                            peer.createAnswer(gotDescription, logErr);
                            trace('recived a offer... reply a answer,wait a monment please');
                        } else {
                            trace('recived a answer...');
                        }

                    }, logErr);
                    trace('set remote desc...');
                }
            });
            break;
        case 'new_login' :
            trace('websocket [new_login] signaling....');
            AsynExec(function () {
                UserList.add(msg.data);
            });
            break;
        case 'login_success':
            trace('websocket [login_success] signaling....');
            AsynExec(function () {
                UserList.setMe(msg.data['me']);
                UserList.adds(msg.data['list']);
            });
            break;
        case 'logout' :
            trace('websocket [logout] signaling....');
            AsynExec(function () {
                UserList.remove(data.data['id']);
            });
            break;
    }
};

/**********************
 * 被动设置本地desc
 *********************/
function localDescCreated(desc) {
    peer.setLocalDescription(desc);
    var tar_id = (UserList.currentUser())['id'],
        me_id = (UserList.getMe())['id'],
        data = {cmd: 'media_pong', data: {type: 'answer', sdp: desc.sdp, from: me_id, to: tar_id}};
    signalingChannel.send(data);
}

function closeDataChannels() {
    peer.close();
    peer = null;
    trace('Closed peer connections');
}

$("app_button").onclick = start;
$("app_close").onclick = closeDataChannels;

$("msg").addEventListener("keypress", function (e) {
    if (e.which === 13) {
        var tar = UserList.currentUser(),
            me = UserList.getMe(),
            data = {
                cmd: 'message',
                from: me.id,
                to: tar.id,
                time: Date.nowTime(),
                msg: this.value
            };
        signalingChannel.send(data);
        data["fromname"] = me.name;
        MsgBox.add(data);
        this.value = "";
        return false;
    }
    return true;
}, false);


/***************** UI 事件 ************************/
var username = $("username"),

    app_connect = $("app_connect");
app_connect.onclick = function () {
    var state = this.dataset["state"];
    if (state === "online") {

    } else {
        var name = username.value + Math.ceil(Math.random() * 100);
        signalingChannel.send({cmd: "init", data: name});
        this.disabled = true;
        username.disabled = true;
    }
};

