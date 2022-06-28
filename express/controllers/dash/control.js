/**
 * 面板数据API control 路由
 */

const { version } = require('../../../package.json');

const { dataDB, configDB } = require('../../../db');
const responder = require('../responder');
const newAuditEvent = require('../../../bot/handlers/newAuditEvent');
const common = require('../../../bot/controllers/common');

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

            return (await newAuditEvent.auditList());

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

            data = await newAuditEvent.newAuditHandle(eventId, operate);

            if (!data.code) {
                await common.sendManageGroupMessage(`[通知] 请求 ${eventId} 已由面板操作`);
            }

            res.send(data);

        }

    }


}