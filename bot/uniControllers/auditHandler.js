/**
 * 统一控制器
 * 申请列表管理
 */

const common = require('../controllers/common');

const bot = require('../index')();

const logger = require('npmlog');

const { configDB, dataDB } = require('../../db');


module.exports = {

    /**
     * 处理 好友 / 邀群 事件
     */
    async auditHandle(eventId, operate) {

        // 先根据 eventId 查找对应事件
        let event = dataDB.prepare(`SELECT * FROM auditList WHERE eventId = ? AND status = 'pending';`).get(eventId);

        if (!event) {
            return {
                code: -404,
                msg: "eventId不存在或已被处理"
            }
        }

        let result, operateId;
        const { fromId, groupId } = event;
        switch (operate) {

            case 'accept':
                operateId = 0;
                break;

            case 'deny':
                operateId = 1;
                break;

            // 草 忽略
            case 'ignore':
                result = dataDB.prepare(`UPDATE auditList SET status = 'ignore' WHERE eventId = ?;`).run(eventId);
                if (result && result.changes) {
                    return {
                        code: 0,
                        msg: 'success'
                    }
                } else {
                    return {
                        code: -500,
                        msg: "内部错误：更新status到ignore时出错"
                    }
                }

            default:
                return {
                    code: -400,
                    msg: "operate错误"
                }
        }
        switch (event.type) {

            case 'friend':
                result = await bot.handleNewFriendRequest(eventId, fromId, groupId, operateId);

                break;

            case 'group':
                result = await bot.handleBotInvitedJoinGroupRequest(eventId, fromId, groupId, operateId);

                break;

            default:
                return {
                    code: -500,
                    msg: "内部错误：数据库中event对应type不正确"
                }
        }

        if (!result.code) {
            dataDB.prepare(`UPDATE auditList SET status = ? WHERE eventId = ?;`).run(operate, eventId);
        }

        return result;

    },

    /**
     * 获取申请事件列表
     */
    async auditList() {

        let data = []

        let auditList = dataDB.prepare(`SELECT * FROM auditList WHERE status = 'pending' ORDER BY ts DESC;`).all();

        auditList.forEach(auditItem => {
            if (auditItem.type == 'friend') {
                data.push({
                    eid: auditItem.eventId,
                    type: auditItem.type,
                    id: auditItem.fromId,
                    name: auditItem.nick,
                    fromId: auditItem.groupId,
                    fromName: auditItem.groupName,
                    desc: auditItem.message,
                    ts: auditItem.ts
                })
            } else {
                data.push({
                    eid: auditItem.eventId,
                    type: auditItem.type,
                    id: auditItem.groupId,
                    name: auditItem.groupName,
                    fromId: auditItem.fromId,
                    fromName: auditItem.nick,
                    ts: auditItem.ts
                })
            }
        })

        return data;

    }

}