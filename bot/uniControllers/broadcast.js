/**
 * 统一控制器
 * 群发
 */

const common = require('../controllers/common');

const bot = require('../index')();

const logger = require('npmlog');

const { configDB, dataDB } = require('../../db');
const utils = require('../../common/utils');

/**
 * 群发
 * @param {messageChain} messageChain
 * @param {string} type
 */
module.exports = async (messageChain, type) => {

    if ( (type != 'friend' && type != 'group') || messageChain == '') {
        return {
            code: -400,
            msg: "参数错误"
        }
    }

    // 判断是否正在执行
    let status = (configDB.prepare(`SELECT value FROM statusConfig WHERE key = 'broadcastStatus';`).get()).value;
    if (status) {
        return {
            code: -401,
            msg: "操作已在执行"
        }
    } else {
        configDB.prepare(`UPDATE statusConfig SET value = 1 WHERE key = 'broadcastStatus';`).run();
        configDB.prepare(`UPDATE stringConfig SET value = null WHERE key = 'broadcastResult';`).run();
    }

    // 选择方式
    let data, flag = 0, list, typeName;
    switch (type) {

        case 'group':
            typeName = '群';
            list = await bot.getGroupList();
            break;

        case 'friend':
            typeName = '好友';
            list = await bot.getFriendList();
            break;

    }

    await common.sendManageGroupMessage(`[广播] 已开始广播，共 ${list.length} 个${typeName}，预计需要 ${list.length * 0.2} 秒`);

    for (let i = 0; i < list.length; i++) {
        const item = list[i];

        if (type == 'friend') {
            result = await bot.sendFriendMessage(messageChain, item.id);
        } else {
            result = await bot.sendGroupMessage(messageChain, item.id);
        }

        if (result.code == 0) flag ++;

        await utils.wait(200);
    }


    data = {
        type,
        complete: flag,
        total: list.length
    }
    configDB.prepare(`UPDATE stringConfig SET value = ? WHERE key = 'broadcastResult';`).run(JSON.stringify(data));
    configDB.prepare(`UPDATE statusConfig SET value = 0 WHERE key = 'broadcastStatus';`).run();
    await common.sendManageGroupMessage(`[广播] 广播完成，成功通知 ${flag} 个${typeName}，共 ${list.length} 个${typeName}`);

    return {
        code: 0,
        msg: null,
        data
    }

}