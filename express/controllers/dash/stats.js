/**
 * 面板数据API stats 路由
 */

const { version } = require('../../../package.json');

const { dataDB, configDB } = require('../../../db');

//  const axios = require('axios');
const bot = require('../../../bot')();

module.exports = {

    /**
     * 统计数据
     * @example
     * {
     *  groupCount: Number,
     *  followCount: Number,
     *  pushCount: Number
     * }
     */
    async overview() {

        let groupCount = (await bot.getGroupList()).length;
        let followCount = 0;
        let pushCount = dataDB.prepare(`SELECT value FROM stats WHERE key = 'pushCount';`).get();

        return {
            groupCount,
            followCount,
            pushCount
        }

    },

    /**
     * B站账号信息
     * @example
     * {
     *  mode: auth | anonymous,
     *  accountName: String,
     *  followUserCount: Number
     * }
     */
    async bilibili() {

        let mode = 'auth';
        let accountName = "路过的玖叁";
        let followUserCount = 0;

        return {
            mode,
            accountName,
            followUserCount
        }

    },

    /**
     * 洇岚信息
     * @example
     * {
     *  version: String,
     *  updateDate: String,
     *  runningTime: Number
     * }
     */
    async yinlan() {

        let updateDate = "2022.8.1";

        let startTime = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'startTime';`).get();
        let nowTime = (new Date()).getTime();
        let runningTime = parseInt((nowTime - startTime.value) / 1000);

        return {
            version,
            updateDate,
            runningTime
        }

    },


}