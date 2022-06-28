/**
 * 管理控制器
 */

const common = require('../common');

const auditHandler = require('../../uniControllers/auditHandler');
const contactManage = require('../../uniControllers/contactManage');

module.exports = {

    /**
     * 管理控制器
     */
    async manageRoute(message) {

        const data = common.compareKeyword(message, null, {
            permission: ['botAdmin']
        })
        if (!data) return;
        const { msgAry, msg } = data;

        let replyMsg = "";

        switch (msgAry[0]) {

            case '.退出群聊':
                replyMsg = await remove(parseInt(msgAry[1]), 'group');
                break;

            case '.删除好友':
                replyMsg = await remove(parseInt(msgAry[1]), 'friend');
                break;
        
            default:
                break;
        }

        message.quoteReply(replyMsg);

    },

    /**
     * 管理控制器 带回复
     */
    async manageQuoteRoute(message) {

        const data = common.compareKeyword(message, null, {
            quote: 'bot',
            permission: ['botAdmin']
        })
        if (!data) return;
        const { operateData, msg } = data;
        if (!operateData) return;

        let replyMsg = "";

        switch (operateData.key) {

            case '好友请求':
            case '邀群请求':
                replyMsg = await auditCtrl(operateData.value, msg);
                break;
        
            default:
                break;
        }

        message.quoteReply(replyMsg);

    }

}

/**
 * 好友 / 邀群请求处理
 * @param {number} eventId 事件id
 * @param {string} operateString 操作
 */
async function auditCtrl(eventId, operateString) {

    let operate;

    switch (operateString) {

        case "同意":
            operate = 'accept'
            break;
            
        case "拒绝":
            operate = 'deny'
            break;
            
        case "忽略":
            operate = 'ignore'
            break;
    
        default:
            return "操作有误uwu";
    }

    result = await auditHandler.auditHandle(eventId, operate);

    if (result.code) {
        return `发生错误：${result.code}\n${result.msg}`;
    } else {
        return `操作成功`;
    }


}


/**
 * 退群删好友
 * @param {number} id id
 * @param {string} type 类型
 */
async function remove(id, type) {

    result = await contactManage.remove(id, type);

    if (result.code) {
        return `发生错误：${result.code}\n${result.msg}`;
    } else {
        return `操作成功`;
    }

}