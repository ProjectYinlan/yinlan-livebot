/**
 * 添加监听
 */

const bot = require('../index')();
const newAuditEvent = require('./newAuditEvent');

const baseCtrl = require('../controllers/base');
const manageCtrl = require('../controllers/manage');

bot.on('newFriendRequest', (data) => {
    newAuditEvent.newFriendEventHandler(data);
})

bot.on('invitedJoinGroupRequest', (data) => {
    newAuditEvent.newGroupEventHandler(data);
})

bot.onMessage(message => {
    baseCtrl.baseQuoteCtrl(message);
    manageCtrl.manageQuoteRoute(message);
})