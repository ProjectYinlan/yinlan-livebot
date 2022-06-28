/**
 * 面板数据API control 路由
 */

const { version } = require('../../../package.json');

const { dataDB, configDB } = require('../../../db');
const responder = require('../responder');
const auditHandler = require('../../../bot/uniControllers/auditHandler');
const common = require('../../../bot/controllers/common');
const contactManage = require('../../../bot/uniControllers/contactManage');
const broadcast = require('../../../bot/uniControllers/broadcast');

//  const axios = require('axios');
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
            friend = friend.map((e) => {
                e.name = e.nickname;
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
                await common.sendManageGroupMessage(`[通知] 请求 ${eventId} 已由面板操作`);
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

            if (!data.code) {
                await common.sendManageGroupMessage(`[通知] 已由面板执行群发`);
            }

            res.send(data);

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
                await common.sendManageGroupMessage(`[通知] 已由面板端${type == 'friend' ? "删除好友" : ""}${type == 'group' ? "退出群聊" : ""} ${id}`);
            }

            res.send(data);

        }

    }


}