/**
 * 配置文件 & 数据库检查
 */

const logger = require('npmlog');
const randomstring = require('randomstring');
const fs = require('fs');
const path = require('path');
const sql = require('better-sqlite3');

module.exports = async () => {

    console.log(`

    __     ___       _             
    \\ \\   / (_)     | |            
     \\ \\_/ / _ _ __ | | __ _ _ __  
      \\   / | | '_ \\| |/ _\` | '_ \\ 
       | |  | | | | | | (_| | | | |
       |_|  |_|_| |_|_\\\\__,_|_| |_|
                       

    Author: 玖叁 @colour93
    GitHub: https://github.com/colour93/yinlan-livebot

    `)

    // 检查路径
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }
    if (!fs.existsSync('temp')) {
        fs.mkdirSync('temp');
    }

    // 检查 配置文件 数据库
    if (!fs.existsSync('config.json')) {

        logger.info("配置文件不存在，正在生成");

        const configJson = {
            http: {
                port: 21050,
                secret: randomstring.generate(10)
            }
        }

        fs.writeFileSync('config.json', JSON.stringify(configJson, null, 2));

        logger.info("生成完毕！");
    };

    // 判断数据库是否存在
    if (!fs.existsSync(path.resolve('data', 'data.db'))) {

        logger.info("data 数据库不存在，正在生成");

        fs.closeSync(fs.openSync(path.resolve('data', 'data.db'), 'w'));

        const sqlFile = fs.readFileSync(path.resolve(__dirname, 'template', 'data.sql'), 'utf8');

        sql(path.resolve('data', 'data.db')).exec(sqlFile);

        logger.info("生成完毕！");
    }
    if (!fs.existsSync(path.resolve('data', 'config.db'))) {

        logger.info("config 数据库不存在，正在生成");

        fs.closeSync(fs.openSync(path.resolve('data', 'config.db'), 'w'));

        const sqlFile = fs.readFileSync(path.resolve(__dirname, 'template', 'config.sql'), 'utf8');

        sql(path.resolve('data', 'config.db')).exec(sqlFile);

        logger.info("生成完毕！");
    }


    // 然后判断 link 是否存在
    if (!require('../config.json').link) {

        logger.info("Bot 连接配置文件不存在，进入初始化阶段");

        return 1;
    }

    return 0;

}