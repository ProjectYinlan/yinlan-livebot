/**
 * 初始化的预处理
 */

const logger = require('npmlog');

const { configDB } = require('../db');

module.exports = async function () {

    // 清空状态数据库
    configDB.prepare(`UPDATE statusConfig SET value = 0;`).run();

    justABrand();
    startTimer();
}


/**
 * 标注启动时间
 */
function startTimer() {
    const ts = (new Date()).getTime();
    result = configDB.prepare("SELECT value FROM numberConfig WHERE key = 'startTime';").get();
    if (result) {
        result = configDB.prepare("UPDATE numberConfig SET value = ? WHERE key = 'startTime';").run(ts);
    } else {
        result = configDB.prepare("INSERT INTO numberConfig (key, value) VALUES ('startTime', ?);").run(ts);
    }
    if (result.changes) {
        logger.info("已记录启动时间");
    }
    return;
} 

function justABrand() {
    console.log(`

    __     ___       _             
    \\ \\   / (_)     | |            
     \\ \\_/ / _ _ __ | | __ _ _ __  
      \\   / | | '_ \\| |/ _\` | '_ \\ 
       | |  | | | | | | (_| | | | |
       |_|  |_|_| |_|_\\\\__,_|_| |_|
                       

    Author: 玖叁 @colour93
    GitHub: https://github.com/yinlan-livebot

`)
}