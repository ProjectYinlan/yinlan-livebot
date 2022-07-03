/**
 * 统一控制器
 * B站账户相关
 */

const axios = require('axios');

const { configDB, dataDB } = require("../../db");


module.exports = {

    /**
     * 获取工作模式
     * @param {Boolean} showAccount 是否展示账号信息
     */
    async getWorkMode(showAccount) {

        let mode = (configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckMode';`).get()).value ? 'auth' : 'anonymous';
        let interval = (configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckInterval';`).get()).value;

        let account;
        if (showAccount) {
            account = (await this.getAccount(true)).data;
        }

        return {
            code: 0,
            msg: null,
            data: {
                mode,
                interval,
                account
            }
        }

    },

    /**
     * 获取已绑定的账户信息
     * @param {Boolean} info 是否返回账号信息
     * @returns 
     */
    async getAccount(info) {

        let data = {};

        let result = configDB.prepare(`SELECT value FROM stringConfig WHERE key = 'biliCheckAccount';`).get();

        if (!result || !result.value) {
            return {
                code: -401,
                msg: "未登录"
            }
        }

        data.cookie = result.value;

        let cookieObj = data.cookie.split(";").map(item => item.split("="));
        cookieObj.forEach(cookieItem => {
            if (cookieItem[0] == 'bili_jct') data.csrf = cookieItem[1];
        })

        if (info) {

            result = await this.getAccountInfo(data.cookie);

            if (result.code) return result;

            const { uname, mid, following } = result.data;
            data.uname = uname;
            data.mid = mid;
            data.following = following;

        }

        return {
            code: 0,
            msg: null,
            data
        }


    },

    /**
     * 通过 cookie 获取账户信息
     * @param {string} cookie 
     */
    async getAccountInfo(cookie) {

        let result = await axios.get('https://api.bilibili.com/x/web-interface/nav', {
            withCredentials: true,
            headers: {
                cookie
            }
        }).then(resp => resp.data);
        if (result.code != 0) return {
            code: -402,
            msg: "登录信息已失效"
        };

        const { uname, mid } = result.data;

        result = await axios.get('https://api.bilibili.com/x/web-interface/nav/stat', {
            withCredentials: true,
            headers: {
                cookie
            }
        }).then(resp => resp.data);

        const { following } = result.data;

        return {
            code: 0,
            msg: null,
            data: {
                uname,
                mid,
                following
            }
        }

    },

    /**
     * 获取登录二维码
     */
    async getLoginQR() {

        result = await axios.get('http://passport.bilibili.com/qrcode/getLoginUrl').then(resp => resp.data);

        if (result.code) {
            return result;
        }

        let { ts, data } = result;
        data.ts = ts;

        return {
            code: 0,
            msg: null,
            data
        }

    },


    /**
     * 获取登录信息
     * @param {String} oauthKey oauthKey
     */
    async getLoginInfo(oauthKey) {

        let resp = await axios({
            method: 'post',
            url: 'http://passport.bilibili.com/qrcode/getLoginInfo',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: (new URLSearchParams({
                oauthKey
            })).toString()
        });

        let result = resp.data;

        // 错误处理
        let msg;
        if (typeof (result.data) == 'number') {
            switch (result.data) {
                case -2:
                    msg = "二维码已失效或信息不完整";
                    break;

                case -4:
                    msg = "未扫描二维码";
                    break;

                case -5:
                    msg = "未确认登录";
                    break;

                default:
                    msg = message;
                    break;
            }
            return {
                code: result.data,
                msg
            }
        }

        // 获取 cookie 以及去掉 expire
        let cookie = resp.headers['set-cookie'];
        cookie = cookie.map((item) => {
            t = item.split(";");
            return t[0];
        })
        cookie = cookie.join(';');

        // 获取信息
        result = await this.getAccountInfo(cookie);

        if (result.code) return result;

        // 写入数据库
        changes = configDB.prepare(`UPDATE stringConfig SET value = ? WHERE key = 'biliCheckAccount';`).run(cookie).changes;

        if (!changes) return {
            code: -500,
            msg: "数据库操作出错",
            data: result.data
        }

        // 关注一遍列表
        let users = (this.getUsers()).data;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            await this.subscribeUser(user.uid, 1);
        }

        return result;

    },

    /**
     * 登出
     */
    async logout() {

        changes = configDB.prepare(`UPDATE stringConfig SET value = null WHERE key = 'biliCheckAccount';`).run().changes;

        if (!changes) return {
            code: -500,
            msg: "数据库操作出错"
        }

        return {
            code: 0,
            msg: null
        };

    },

    /**
     * 设置
     * @param {object} options mode, interval
     */
    async setCheckOptions(options) {

        const schedule = require('../schedule');

        let { mode, interval } = options;

        let msg = [];

        if (mode) {
            changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'biliCheckMode';`).run(mode == 'auth' ? 1 : 0).changes;
            if (!changes) msg.push("biliCheckMode 修改失败");
        }

        if (interval) {

            if (!mode) mode = (await this.getWorkMode()).data.mode;

            if (
                ((mode == 'auth') && (interval >= 10) && (interval <= 60)) ||
                ((mode == 'anonymous') && (interval == 60))
            ) {
                changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'biliCheckInterval';`).run(interval).changes;
                schedule.biliCheck.reschedule((`*/${interval} * * * * *`));
                if (!changes) msg.push("biliCheckInterval 修改失败");
            } else {
                msg.push("interval 值不正确")
            }

        }

        if (msg.length) {
            return {
                code: -400,
                msg: msg.join("；")
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    },

    /**
     * 关注 / 取关用户
     * @param {number} uid
     * @param {number} operate 1 关注, 2 取关, 3 悄悄关注, 5 黑名单, 6 移除黑名单
     */
    async subscribeUser(uid) {

        let accountData = await this.getAccount();
        if (accountData.code) return accountData;

        let { cookie, csrf } = accountData.data;

        result = await axios({
            method: 'post',
            url: 'https://api.bilibili.com/x/relation/modify',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                cookie
            },
            data: (new URLSearchParams({
                fid: uid,
                act: 1,
                csrf
            })).toString()
        }).then(resp => resp.data);

        return result;

    },


    /**
     * 获取已关注用户
     */
    getUsers() {

        data = dataDB.prepare(`SELECT * FROM liverooms;`).all();

        return {
            code: 0,
            msg: null,
            data
        }

    },


    /**
     * 获取用户信息
     * @param {number} uid
     */
    async getUserInfo(uid) {
        return (await axios(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`).then(resp => resp.data));
    },


    /**
     * 直播间和群聊绑定
     * @param {number} groupId
     * @param {number} uid
     * @param {boolean} atAll
     */
    async bindLiveroom(groupId, uid, atAll) {

        const bot = require('../index')();

        let msg = [];

        // 判断条目是否已经绑定
        result = dataDB.prepare(`SELECT * FROM liveroom_group WHERE uid = ? AND groupId = ?`).get(uid, groupId);
        if (result) return {
            code: -412,
            msg: "条目已经绑定"
        }

        // 判断群号是否存在
        groupList = await bot.getGroupList();
        groupSearch = groupList.filter((item) => {
            if (item.id == groupId) return true;
        })
        if (!groupSearch.length) return {
            code: -404,
            msg: "没有找到该群聊"
        }

        // 判断 uid 是否已经关注
        result = dataDB.prepare(`SELECT * FROM liverooms WHERE uid = ?;`).get(uid);

        // 不存在就先关注上
        if (!result) {

            // 判断是否存在
            result = await this.getUserInfo(uid);
            if (result.code) {
                if (result.code == -404) {
                    return {
                        code: -404,
                        msg: "没有找到该用户"
                    }
                } else return result;
            }
            const { name, live_room } = result.data;

            // 判断是否开通直播间
            if (!live_room.roomStatus) {
                msg.push("该用户未开通直播间")
            }

            result = await this.subscribeUser(uid, 1);
            if (result.code) return result;
            msg.push("关注成功")

            changes = dataDB.prepare(`INSERT INTO liverooms (uid, roomId, uname, status, flag, ts, pending) VALUES (?, ?, ?, 0, 0, 0, 0);`).run(uid, live_room.roomid, name).changes;

            if (!changes) return {
                code: -500,
                msg: "操作数据库时出现错误"
            }

        }

        // 然后添加条目
        changes = dataDB.prepare(`INSERT INTO liveroom_group (uid, groupId, atAll) VALUES (?, ?, ?);`).run(uid, groupId, atAll ? 1 : 0).changes;
        if (!changes) return {
            code: -500,
            msg: "操作数据库时出现错误"
        }
        msg.push("绑定成功");

        return {
            code: 0,
            msg: msg.join("；")
        }

    },

    /**
     * 获取群聊绑定详情
     * @param {number} groupId
     */
    async getGroupDetail(groupId) {

        let data = dataDB.prepare(`
            SELECT liveroom_group.uid AS id, liverooms.uname AS name, liveroom_group.atAll AS atAll
            FROM liveroom_group
            JOIN liverooms
            ON liveroom_group.uid = liverooms.uid
            WHERE groupId = ?;
        `).all(groupId);

        data.map((item) => {
            item.atAll = item.atAll ? true : false;
        })

        return {
            code: 0,
            msg: null,
            data
        }

    },

    /**
     * 获取直播间绑定详情
     * @param {number} uid
     */
    async getLiveroomDetail(uid) {

        const bot = require('../index')();

        let data = dataDB.prepare(`
            SELECT liveroom_group.groupId AS id, liveroom_group.atAll AS atAll
            FROM liverooms
            JOIN liveroom_group
            ON liverooms.uid = liveroom_group.uid
            WHERE liverooms.uid = ?;
        `).all(uid);

        let groupList = await bot.getGroupList();

        data.map((groupItem) => {
            groupItem.name = groupList.filter((group) => {
                if (group.id == groupItem.id) return true;
            })[0]['name'];
            groupItem.atAll = groupItem.atAll ? true : false;
        })

        return {
            code: 0,
            msg: null,
            data
        }

    },

    /**
     * 修改提醒是否at全体
     * @param {number} uid
     * @param {number} groupId
     * @param {boolean} atAll
     */
    async setAtAll(uid, groupId, atAll) {

        console.log(atAll);

        changes = dataDB.prepare(`
            UPDATE liveroom_group
            SET atAll = ?
            WHERE uid = ? AND groupId = ?
        `).run(atAll ? 1 : 0, uid, groupId).changes;

        if (!changes) return {
            code: -404,
            msg: "没有找到对应条目"
        }

        return {
            code: 0,
            msg: null
        }

    },

    /**
     * 解除绑定
     * @param {number} uid
     * @param {number} groupId
     */
    async unbind(uid, groupId) {

        changes = dataDB.prepare(`DELETE FROM liveroom_group WHERE uid = ? AND groupId = ?;`).run(uid, groupId).changes;

        if (!changes) return {
            code: -404,
            msg: "没有找到对应条目"
        }

        return {
            code: 0,
            msg: null
        }

    },

    /**
     * 清除群聊所有直播间
     * @param {number} groupId
     */
    async clearGroup(groupId) {

        changes = dataDB.prepare(`DELETE FROM liveroom_group WHERE groupId = ?;`).run(groupId).changes;

        if (!changes) return {
            code: -404,
            msg: "没有找到对应条目"
        }

        return {
            code: 0,
            msg: null
        }

    },

    /**
     * 删除直播间订阅
     * @param {number} uid
     */
    async removeLiveroom(uid) {

        changes = dataDB.prepare(`DELETE FROM liveroom_group WHERE uid = ?;`).run(uid).changes;
        changes = dataDB.prepare(`DELETE FROM liverooms WHERE uid = ?;`).run(uid).changes;

        if (!changes) return {
            code: -404,
            msg: "没有找到对应条目"
        }

        return {
            code: 0,
            msg: null
        }

    },

}