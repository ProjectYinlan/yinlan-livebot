/**
 * 面板数据API control 路由
 */

const fs = require('fs');

const { version } = require('../../../package.json');

const { dataDB, configDB } = require('../../../db');
const responder = require('../responder');
const auditHandler = require('../../../bot/uniControllers/auditHandler');
const common = require('../../../bot/controllers/common');
const contactManage = require('../../../bot/uniControllers/contactManage');
const broadcast = require('../../../bot/uniControllers/broadcast');
const biliCheck = require('../../../bot/uniControllers/biliCheck');
const bot = require('../../../bot')();

module.exports = {

    /**
     * 数据路由
     */
    data: {

        /**
         * 获取申请列表
         * @example
         * [{
         *  eid: Number,
         *  type: String,
         *  name: String,
         *  id: Number,
         *  desc: String,
         *  ts: Number
         * }]
         */
        async auditList() {

            return (await auditHandler.auditList());

        },

        /**
         * 获取直播间绑定列表
         * @example
         * {
         *  groupView: [{
         *      name: String,
         *      id: Number,
         *      count: Number
         *  }],
         *  liveroomView: [{
         *      name: String,
         *      id: Number,
         *      count: Number
         *  }]
         * }
         */
        async liveroomList() {

            let groupView = dataDB.prepare(`SELECT groupId AS 'id', COUNT() AS 'count' FROM liveroom_group GROUP BY groupId;`).all();

            let groupList = await bot.getGroupList();

            groupView.map((groupItem) => {
                groupItem.name = groupList.filter((group) => {
                    if (group.id == groupItem.id) return true;
                })[0]['name'];
            })

            let liveroomView = dataDB.prepare(`
                SELECT liverooms.uid AS 'id', liverooms.uname AS 'name', IFNULL(COUNT(liveroom_group.uid), 0) AS 'count'
                FROM liverooms
                LEFT JOIN liveroom_group
                ON liverooms.uid = liveroom_group.uid
                GROUP BY liverooms.uid;
            `).all();

            return {
                groupView,
                liveroomView
            }

        },


        /**
         * 获取直播检测选项
         * @example
         * {
         *  mode: auth | anonymous
         *  accountStatus: authed | unauth
         *  interval: Number (10-60) | (60)
         * }
         */
        async liveroomOptions () {

            let { data, code } = await biliCheck.getWorkMode(true);
            if (code) return null;
            data.accountStatus = (data.account && data.account.mid) ? 'authed' : 'unauth';

            return data;

        },

        /**
         * 获取联系人列表
         * @example
         * {
         *  group: [
         *      {
         *          id: Number,
         *          name: String
         *      }
         *  ],
         *  friend: [
         *      {
         *          id: Number,
         *          name: String
         *      }
         *  ]
         * }
         */
        async contactList() {

            let group = await bot.getGroupList();

            let friend = await bot.getFriendList();

            let managers = configDB.prepare(`SELECT * FROM managers WHERE role = 'owner' OR role = 'admin';`).all();

            friend = friend.map((e) => {
                e.name = e.nickname;
                if (e.id == bot.qq) {
                    e.role = 'bot';
                } else {
                    for (let i = 0; i < managers.length; i++) {
                        const manager = managers[i];
                        if (manager.id == e.id) {
                            e.role = manager.role;
                        } else {
                            e.role = 'normal';
                        }
                    }
                }
                delete e.remark;
                delete e.nickname;
                return e;
            })

            return {
                group,
                friend
            }

        }

    },

    /**
     * 控制路由
     */
    control: {

        /**
         * 设置
         */
        setting: {

            /**
             * 重置设置
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async resetConfig (req, res) {

                fs.unlinkSync('config.json');

                res.send({
                    code: 0,
                    msg: "已重置，请手动重启程序"
                });

                process.exit();

            }


        },

        /**
         * 对申请的处理
         * @param {import('express').req} req
         * @param {import('express').res} res
         */
        async auditHandle(req, res) {

            const { eventId, operate } = req.body;
            if (!eventId || !operate) {
                responder.paramsError(res);
                return;
            }

            data = await auditHandler.auditHandle(eventId, operate);

            if (!data.code) {
                common.sendManageGroupMessage(`请求 ${eventId} 已由面板操作`, true);
            }

            res.send(data);

        },

        /**
         * 广播
         * @param {import('express').req} req
         * @param {import('express').res} res
         */
        async broadcast(req, res) {

            const { content, type } = req.body;
            if (!content || !type) {
                responder.paramsError(res);
                return;
            }

            data = await broadcast(content, type);

            res.send(data);

        },

        /**
         * 直播间列表
         */
        liveroomList: {

            /**
             * 获取自动补全候选信息
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async getCondidateData (req, res) {

                let groupList = await bot.getGroupList();

                groupList = groupList.map((item) => {
                    delete item.permission;
                    return item;
                })

                let liveroomListResult = biliCheck.getUsers();
                if (liveroomListResult.code != 0) {
                    res.send(liveroomListResult);
                    return;
                };

                let liveroomList = liveroomListResult.data.map((item) => {
                    return {
                        id: item.uid,
                        name: item.uname
                    }
                })

                res.send({
                    code: 0,
                    msg: null,
                    data: {
                        groupList,
                        liveroomList
                    }
                })

            },

            /**
             * 绑定新的直播间
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async addNewBind (req, res) {

                const { uid, groupId, atAll } = req.body;

                if (
                    !uid || typeof(uid) != 'number' ||
                    !groupId || typeof(groupId) != 'number'
                ) {
                    responder.paramsError(res);
                    return;
                }

                result = await biliCheck.bindLiveroom(groupId, uid, atAll);
                res.send(result);

            },

            /**
             * 获取群绑定信息详情
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async getGroupDetail (req, res) {

                const { groupId } = req.query;

                if (!groupId) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.getGroupDetail(groupId));

            },

            /**
             * 获取直播间绑定信息详情
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async getLiveroomDetail (req, res) {
                
                const { uid } = req.query;

                if (!uid) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.getLiveroomDetail(uid));

            },

            /**
             * 设置绑定条目的直播全体提醒
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async setAtAll (req, res) {

                const { uid, groupId, atAll } = req.body;

                if (
                    !uid || typeof(uid) != 'number' ||
                    !groupId || typeof(groupId) != 'number' ||
                    typeof(atAll) != 'boolean'
                ) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.setAtAll(uid, groupId, atAll));
            },

            /**
             * 解除绑定
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async unbind (req, res) {

                const { uid, groupId } = req.body;

                if (
                    !uid || typeof(uid) != 'number' ||
                    !groupId || typeof(groupId) != 'number'
                ) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.unbind(uid, groupId));

            },

            /**
             * 清空群聊所有直播间
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async clearGroup (req, res) {

                const { groupId } = req.body;

                if (
                    !groupId || typeof(groupId) != 'number'
                ) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.clearGroup(groupId));

            },

            /**
             * 清空群聊所有直播间
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async removeLiveroom (req, res) {

                const { uid } = req.body;

                if (
                    !uid || typeof(uid) != 'number'
                ) {
                    responder.paramsError(res);
                    return;
                }

                res.send(await biliCheck.removeLiveroom(uid));

            },

        },

        /**
         * 直播间选项
         */
        liveroomOptions: {

            /**
             * 修改直播检测参数
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async setCheckOptions(req, res) {

                result = await biliCheck.setCheckOptions(req.body);
                res.send(result);

            },

            /**
             * 获取登录二维码
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async getLoginQR(req, res) {

                result = await biliCheck.getLoginQR();
                res.send(result);

            },

            /**
             * 获取登录信息
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async getLoginInfo(req, res) {

                const { oauthKey } = req.body;
                if (!oauthKey) {
                    responder.paramsError(res);
                    return;
                }

                result = await biliCheck.getLoginInfo(oauthKey);
                res.send(result);

            },

            /**
             * 登出
             * @param {import('express').req} req
             * @param {import('express').res} res
             */
            async logout(req, res) {

                result = await biliCheck.logout();
                res.send(result);

            },

        },

        /**
         * 删除好友 / 群聊
         * @param {import('express').req} req
         * @param {import('express').res} res
         */
        async removeContact(req, res) {

            const { id, type } = req.body;
            if (!id || !type) {
                responder.paramsError(res);
                return;
            }

            data = await contactManage.remove(id, type);

            if (!data.code) {
                await common.sendManageGroupMessage(`已由面板端${type == 'friend' ? "删除好友" : ""}${type == 'group' ? "退出群聊" : ""} ${id}`);
            }

            res.send(data);

        }

    }


}