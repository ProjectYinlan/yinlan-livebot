/**
 * 统一控制器
 * B站直播绑定解绑相关
 */


const axios = require('axios');

const bot = require('../index')();

const { dataDB } = require("../../db");
const biliCheck = require('./biliCheck');

module.exports = {


    /**
     * 关注 / 取关用户
     * @param {number} uid
     * @param {number} operate 1 关注, 2 取关, 3 悄悄关注, 5 黑名单, 6 移除黑名单
     */
    async subscribeUser(uid) {

        let accountData = await biliCheck.getAccount();
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

            changes = dataDB.prepare(`INSERT INTO liverooms (uid, roomId, uname) VALUES (?, ?, ?);`).run(uid, live_room.roomid, name).changes;

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
    async getGroupDetail (groupId) {

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
    async getLiveroomDetail (uid) {

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
    async setAtAll (uid, groupId, atAll) {

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
    async unbind (uid, groupId) {

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
    async clearGroup (groupId) {

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
    async removeLiveroom (uid) {

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