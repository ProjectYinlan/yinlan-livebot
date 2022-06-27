/**
 * 添加监听
 */

const bot = require('../index')();
const newAuditEvent = require('./newAuditEvent');

bot.on('newFriendRequest', (data) => {
    newAuditEvent.newFriendEventHandler(data);
})

bot.on('invitedJoinGroupRequest', (data) => {
    newAuditEvent.newGroupEventHandler(data);
})