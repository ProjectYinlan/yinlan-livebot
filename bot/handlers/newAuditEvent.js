/**
 * 处理好友申请 & 邀群申请
 */

const common = require('../controllers/common');

const logger = require('npmlog');

const { configDB, dataDB } = require('../../db');

module.exports = {
    
    /**
     * 好友申请处理
     * @param {} data
     */
    async newFriendHandler (data) {

        const { eventId, fromId, groupId, nick, message } = data;

        // 先判断是否自动同意
        result = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'autoAcceptFriend';`).get();
        if (result && result.value) {
            await data.accept();
            await common.sendManageGroupMessage(`已自动同意好友请求\n${nick} (${fromId})${groupId ? "\n来自群 " + groupId : "" }`);
        }  

        const ts = (new Date()).getTime();
        
        // 首先插数据库
        result = dataDB.prepare(`
            INSERT INTO auditList (eventId, type, fromId, groupId, nick, message, ts)
            VALUES (?, 'friend', ?, ?, ?, ?, ?);
        `).run(eventId, fromId, groupId, nick, message, ts);

        // 插失败
        if (!result.changes) {
            await common.sendManageGroupMessage("向数据库中插入数据失败，请及时注意 [newAuditEvent]", true, 'error');
        }

        // 转发至群聊
        await common.sendManageGroupMessage(`[好友请求] ${eventId}\n${nick} (${fromId})${groupId ? "\n来自群 " + groupId : "" }\n回复该消息 “同意” “拒绝” “忽略” 即可操作`);

    }

}