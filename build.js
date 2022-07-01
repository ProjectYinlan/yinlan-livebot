/**
 * 负责前后端连接及编译工作
 */

const fs = require('fs');
const logger = require('npmlog');
const path = require('path');

init();

async function init () {

    r = fs.existsSync(path.resolve(__dirname, 'yinlan-livebot-front'));
    if (!r) {
        logger.error("submodule 不存在，请确认是否使用 git clone --recursive");
        return;
    };

    fs.cpSync(path.resolve(__dirname, 'yinlan-livebot-front', 'dist'), path.resolve(__dirname, 'express', 'public'), { recursive: true });

    logger.info("操作执行完毕");

}