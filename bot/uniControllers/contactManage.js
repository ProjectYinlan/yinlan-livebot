/**
 * 统一控制器
 * 好友 / 群聊
 */

 const common = require('../controllers/common');

 const bot = require('../index')();
 
 const logger = require('npmlog');
 
 const { configDB, dataDB } = require('../../db');
const utils = require('../controllers/utils');


module.exports = {

    /**
     * 删除好友 / 退出群聊
     */
    async remove (id, type) {

        let data = {};

        switch (type) {

            case 'friend':
                if (utils.verifyAccess(id) != 'normal') {
                    return {
                        code: -403,
                        msg: "不可删除 Bot 管理员"
                    }
                }
                if (id == bot.qq) {
                    return {
                        code: -403,
                        msg: "不可删除 Bot"
                    }
                }
                result = (await bot.deleteFriend(id)).data;
                break;

            case 'group':
                if (id == utils.getManageGroupId()) {
                    return {
                        code: -403,
                        msg: "Bot 管理群聊不可退出"
                    }
                }
                result = await bot.quit(id);
                break;
        
            default:
                return {
                    code: -400,
                    msg: "请求参数错误"
                }
        }
        

        if (!result.code) {
            data = result;
        } else {

            if (result.code == 5) {

                data = {
                    code: -404,
                    msg: '指定对象不存在'
                }

            } else {

                data = {
                    code: 0 - result.code,
                    msg: result.msg
                }

            }

        }

        return data;

    }

}