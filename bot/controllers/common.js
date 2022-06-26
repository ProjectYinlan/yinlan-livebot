const bot = require('../index')();
const utils = require('./utils');

const logger = require('npmlog');

module.exports = {

    /**
     * 向管理群发送消息
     * @param {import('node-mirai-sdk').MessageChain} messageChain
     * @param {Boolean} log 是否同时向控制台输出
     * @param {String} level 输出级别
     */
    async sendManageGroupMessage (messageChain, log, level) {
        let groupId = utils.getManageGroupId();
        if (!groupId) return false;
        result = await bot.sendGroupMessage(messageChain, groupId);

        if (log) {
            let nLogger;
            switch (level) {
                case 'warn':
                    nLogger = logger.warn
                    break;
            
                case 'error':
                    nLogger = logger.error
                    break;

                case 'log':
                default:
                    nLogger = logger.log;
                    break;
            }
            if (typeof(messageChain) == 'string') {
                nLogger(messageChain);
            } else {
                let msg = "";
                messageChain.forEach(chain => {
                    if (chain.type == 'Plain') {
                        msg += chain.Text;
                    }
                });
                nLogger(msg);
            }
        }
        if (result.code == 0) {
            return true;
        } else {
            return false;
        }
    }

}
