const bot = require('../index')();
const utils = require('./utils');

const logger = require('npmlog');

module.exports = {

    
    /**
     * 命令筛选通用
     * @param {import('node-mirai-sdk').message} message
     * @param {string} keyword 关键词 可为 null
     * @param {object} options
     * {
     *  type: 'friend' | 'group' | 'all',
     *  mode: 'spilt' | 'includes' | 'equal',
     *  quote: 'bot' | 'normal' | 'none',
     *  at: 'bot' | 'normal' | 'none',
     *  permission: ['botOwner' | 'groupOwner' | 'botAdmin' | 'groupAdmin' | 'none']
     * }
     * 
     */
    compareKeyword(message, keyword, options) {

        let quote, quoteObj = {}, operateData, msg = "", msgPlain, at, img, msgAry = [];
            
        // 先判断来源
        switch (options.type) {
            case 'friend':
                if (message.type != 'FriendMessage') return;
                break;
                
            case 'group':
                if (message.type != 'GroupMessage') return;
                break;

            case 'all':
            default:
                break;
        }

        // 解离 messageChain
        message.messageChain.forEach(chain => {
            switch (chain.type) {

                case 'Plain':
                    msg += chain.text;
                    break;

                case 'Image':
                    img = chain;
                    break;

                case 'At':
                    at = chain;
                    break;

                case 'Quote':
                    quote = chain;
                    chain.origin.forEach(qChain => {

                        quoteObj.msg = "";

                        switch (qChain.type) {

                            case 'Plain':
                                quoteObj.msg += qChain.text;
                                break;
            
                            case 'Image':
                                quoteObj.img = qChain;
                                break;
            
                            case 'At':
                                quoteObj.at = qChain;
                                break;

                            default:
                                break;

                        }
                    })
                    break;
            
                default:
                    break;
            }
        })
        msgAry = msg.split(' ');

        // 然后判断是否强制 quote
        switch (options.quote) {
            case 'bot':
                if (!quote || quote.senderId != bot.qq) return;
                tempAry = quoteObj.msg.match(/^\[(\S+)\]\s(\w+)/);
                if (!tempAry) break;
                operateData = {
                    key: tempAry[1],
                    value: tempAry[2]
                }
                break;
                
            case 'normal':
                if (!quote) return;
                break;
        
            case 'none':
            default:
                break;
        }

        // 判断 at
        switch (options.at) {
            case 'bot':
                if (!at || at.senderId != bot.qq) return;
                break;

            case 'normal':
                if (!at) return;
                break;
        
            case 'none':
            default:
                break;
        }

        // 接着判断 keyword
        if (keyword) {
            switch (options.mode) {
    
                default:
                case 'split':
                    if (msgAry[0] != keyword) return;
                    msgAry.shift();
                    msgPlain = msgAry.join(' ');
                    break;
    
                case 'includes':
                    if (!msg.includes(keyword)) return;
                    break;
    
                case 'equal':
                    if (msg != keyword) return;
                    break;
            
            }
        }

        // 最后是权限判断
        if (options.permission) {
            let flag = 0;
            options.permission.forEach(permission => {
                switch (permission) {

                    case 'botOwner':
                        if (utils.verifyAccess(message.sender.id) == 'owner') flag++;
                        break;

                    case 'groupOwner':
                        if (message.sender.permission == 'OWNER') flag++;
                        break;

                    case 'botAdmin':
                        if (['owner', 'admin'].includes(utils.verifyAccess(message.sender.id))) flag++;
                        break;

                    case 'groupAdmin':
                        if (['OWNER', 'ADMINISTRATOR'].includes(message.sender.permission)) flag++;
                        break;
                
                    case 'none':
                    default:
                        break;
                }
            })
        }

        // 结束
        return {
            msg,
            msgAry,
            msgPlain,
            at,
            quote,
            quoteObj,
            operateData,
            img,
            message
        }

    },

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
