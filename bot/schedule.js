/**
 * 计划任务
 */

const schedule = require('node-schedule');
const { dataDB } = require('../db');

const logger = require('npmlog');

logger.info("加载计划任务");

module.exports = {

    /**
     * 每分钟记录启动时长
     */
    onlineTimer: schedule.scheduleJob('0 * * * * *', () => {
        r = dataDB.prepare(`UPDATE stats SET value =  (value + 1) WHERE key = 'onlineTime';`).run();
    })

}