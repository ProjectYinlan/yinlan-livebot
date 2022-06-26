/**
 * Bot 索引
 */

const Mirai = require('node-mirai-sdk');
const logger = require('npmlog');

const utils = require('./controllers/utils');

const { link } = require('../config.json');

const bot = new Mirai(link);

bot.onMessage(async message => {

});

// bot.on('newFriendRequest', (data) => {
//     newFriendHandler(data);
// })

bot.listen('all');

process.on('exit', () => {
    bot.release();
    logger.info("已释放");
});

module.exports = auth;

/**
 * 登录 异步
 */
function auth() {

    // 判断是否已经验证
    if (bot.signal.signals.length == 2) {
        return bot;
    };

    // 不是就返回一个封装好的登录 Promise 对象
    return new Promise((resolve, reject) => {

        bot.onSignal('authed', () => {
            logger.info("已登录");
            bot.verify();
        });

        bot.onSignal('verified', async () => {
            logger.info("已校验");

            // 发动登录后发消息提醒术
            let groupId = utils.getManageGroupId();
            if (!groupId) return;
            await bot.sendGroupMessage(`${utils.getBotName()} 已上线~`, groupId);

            resolve(bot);
        });

    })
}