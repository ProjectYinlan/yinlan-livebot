/**
 * 添加监听
 */

const bot = require('../index')();
const { newFriendHandler } = require('./newAuditEvent');

bot.on('newFriendRequest', (data) => {
    newFriendHandler(data);
})