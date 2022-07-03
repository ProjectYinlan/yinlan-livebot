/**
 * 面板数据API stats 路由
 */

const { version, publish } = require('../../../temp/version.json');

const { dataDB, configDB } = require('../../../db');
const biliCheck = require('../../../bot/uniControllers/biliCheck');

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
        let followCount = (dataDB.prepare(`SELECT count() AS 'count' FROM liverooms;`).get()).count;
        let pushCount = (dataDB.prepare(`SELECT value FROM stats WHERE key = 'pushCount';`).get()).value;

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

        let { data, code } = await biliCheck.getWorkMode(true);
        if (code) return null;

        let { mode, account } = data;
        let accountName, followUserCount;
        if (account) {
            accountName = account.uname;
            followUserCount = account.following;
        }

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
     *  publish: String,
     *  runningTime: Number
     * }
     */
    async yinlan() {

        let startTime = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'startTime';`).get();
        let nowTime = (new Date()).getTime();
        let runningTime = parseInt((nowTime - startTime.value) / 1000);

        return {
            version,
            publish,
            runningTime
        }

    },


}