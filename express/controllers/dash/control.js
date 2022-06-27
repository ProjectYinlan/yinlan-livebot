/**
 * 面板数据API control 路由
 */

const { version } = require('../../../package.json');

const { dataDB, configDB } = require('../../../db');

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

            let data = []

            // 开发模式，这里没有加 pending 限制
            let auditList = dataDB.prepare(`SELECT * FROM auditList ORDER BY ts DESC;`).all();

            auditList.forEach(auditItem => {
                if (auditItem.type == 'friend') {
                    data.push({
                        eid: auditItem.eventId,
                        type: auditItem.type,
                        name: auditItem.nick,
                        id: auditItem.fromId,
                        desc: auditItem.message,
                        ts: auditItem.ts
                    })
                } else {
                    data.push({
                        eid: auditItem.eventId,
                        type: auditItem.type,
                        name: auditItem.groupName,
                        id: auditItem.groupId,
                        desc: `来自 ${auditItem.nick} (${auditItem.fromId}) 的邀请`,
                        ts: auditItem.ts
                    })
                }
            })

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
            group = group.map((e) => {
                delete e.permission;
                return e;
            })

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

    }


}