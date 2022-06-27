/**
 * 处理好友申请 & 邀群申请
 */

const common = require('../controllers/common');

const bot = require('../index')();

const logger = require('npmlog');

const { configDB, dataDB } = require('../../db');

module.exports = {
    
    /**
     * 好友申请事件处理
     * @param {} data
     */
    async newFriendEventHandler (data) {

        const { eventId, fromId, groupId, nick, message } = data;

        let replyMsg = "", status = "";

        const ts = (new Date()).getTime();

        // 先判断是否自动同意
        auto = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'autoAcceptFriend';`).get();
        if (auto && auto.value) {
            await data.accept();
            status = 'autoAccept';
            replyMsg = `已自动同意好友请求\n『${nick} (${fromId})』${groupId ? "\n来自群『" + groupId + "』" : "" }`;
        } else {
            status = 'pending';
            replyMsg = `[好友请求] ${eventId}\n『${nick} (${fromId})』${groupId ? "\n来自群『" + groupId + "』" : "" }\n回复该消息 “同意” “拒绝” “忽略” 即可操作`;
        }
        
        // 插数据库
        result = dataDB.prepare(`
            INSERT INTO auditList (eventId, type, fromId, groupId, nick, message, ts, status)
            VALUES (?, 'friend', ?, ?, ?, ?, ?, ?);
        `).run(eventId, fromId, groupId, nick, message, ts, status);

        // 插失败
        if (!result.changes) {
            await common.sendManageGroupMessage("向数据库中插入数据失败，请及时注意 [newAuditEvent]", true, 'error');
        }

        // 消息转发群聊
        common.sendManageGroupMessage(replyMsg);

    },

    /**
     * 邀群申请事件处理
     * @param {} data
     */
    async newGroupEventHandler (data) {

        const { eventId, fromId, groupId, groupName, nick } = data;

        let replyMsg = "", status = "";

        const ts = (new Date()).getTime();

        // 先判断是否自动同意
        result = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'autoAcceptGroup';`).get();
        if (result && result.value) {
            await data.accept();
            status = 'autoAccept';
            replyMsg = `已自动同意邀群请求\n『${groupName} (${groupId})』\n来自『${nick} (${fromId})』`;
        } else {
            status = 'pending';
            replyMsg = `[邀群请求] ${eventId}\n『${groupName} (${groupId})』\n来自『${nick} (${fromId})』\n回复该消息 “同意” “拒绝” “忽略” 即可操作`;
        }
        
        // 插数据库
        result = dataDB.prepare(`
            INSERT INTO auditList (eventId, type, fromId, groupId, groupName, nick, ts, status)
            VALUES (?, 'group', ?, ?, ?, ?, ?, ?);
        `).run(eventId, fromId, groupId, groupName, nick, ts, status);

        // 插失败
        if (!result.changes) {
            await common.sendManageGroupMessage("向数据库中插入数据失败，请及时注意 [newAuditEvent]", true, 'error');
        }

        // 转发至群聊
        common.sendManageGroupMessage(replyMsg);

    },

    /**
     * 处理 好友 / 邀群 事件
     */
    async newAuditHandle (eventId, operate) {
        
        // 先根据 eventId 查找对应事件
        let event = dataDB.prepare(`SELECT * FROM auditList WHERE eventId = ? AND status = 'pending';`).get(eventId);

        if (!event) {
            return {
                code: 404,
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
                        code: 500,
                        msg: "内部错误：更新status到ignore时出错"
                    }
                }
        
            default:
                return {
                    code: 500,
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
                    code: 500,
                    msg: "内部错误：数据库中event对应type不正确"
                }
        }

        if (!result.code) {
            dataDB.prepare(`UPDATE auditList SET status = ? WHERE eventId = ?;`).run(operate, eventId);
        }

        return result;

    }

}