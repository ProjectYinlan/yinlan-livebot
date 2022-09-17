/**
 * 初始化的预处理
 */

const logger = require('npmlog');
const axios = require('axios');

const { configDB } = require('../db');

module.exports = async function () {

    // 读取环境变量
    if (process.env.NODE_ENV == 'development') process.env.dev = 1;
    if (process.env.dev) {
        logger.info("当前为开发环境");
        logger.warn("开发环境下身份验证将被禁用");
    }

    // 清空状态数据库
    configDB.prepare(`UPDATE statusConfig SET value = 0;`).run();

    // 设置默认 axios
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.33';

    startTimer();
}


/**
 * 标注启动时间
 */
function startTimer() {
    const ts = (new Date()).getTime();
    changes = configDB.prepare("UPDATE numberConfig SET value = ? WHERE key = 'startTime';").run(ts).changes;
    if (changes) logger.info("已记录启动时间");
    return;
}