/*****************************************************************
 * L5 SNS 在线用户管理
 * @author lonphy
 * @version 1.0
 ****************************************************************/
(function (global) {
    var list = $('userlist'),
        currentUser = null,
        observer = [],
        me,
        cache = {};

    list.addEventListener('click', function (e) {
        var item = e.target;
        if (item === this) return false;
        if (item.nodeName === 'DD') {
            if (item.classList.contains('on')) return false;
            AsynExec(function () {
                if (currentUser !== null) {
                    list.querySelector('#u' + currentUser['data'].id).className = '';
                }
                item.className = 'on';
                currentUser = cache[item.id.substr(1)]['data'];
            });
        }
    }, false);

    function buildTpl(user) {
        return "<dd id='u" + user['id'] + "'>" + user['name'] + "  [<span>" + user['id'] + "</span>]</dd>";
    }

    function drawList() {
        var html = "", item;
        for (item in cache)
            html += cache[item]['tpl'];
        list.innerHTML = "<dt>Onlines</dt>" + html;
        if (currentUser !== null)
            list.querySelector('#u' + currentUser['data'].id).className = 'on';
    }

    global.UserList = {
        add: function (user) {
            cache[user['id']] = {tpl: buildTpl(user), data: user};
            drawList();
        },
        adds: function (users) {
            users.forEach(function (user) {
                cache[user['id']] = {tpl: buildTpl(user), data: user};
            });
            drawList();
        },
        setMe: function (user) {
            me = user;
        },
        getMe: function () {
            return me;
        },
        getUser: function (uid) {
            return cache[uid]['data'];
        },
        remove: function (uid) {
            if (currentUser.id === uid)
                currentUser = null;
            delete cache[uid];
            drawList();
        },
        currentUser: function () {
            return currentUser;
        }

    }
}(window));