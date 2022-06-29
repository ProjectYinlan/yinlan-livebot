/**
 * 配置文件 & 数据库检查
 */

const logger = require('npmlog');

const randomstring = require('randomstring');

const fs = require('fs');

module.exports = async () => {

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

    // 最先检查 配置文件 数据库
    result = fs.existsSync('config.json');

    // 不存在就创建生成
    if (!result) {

        logger.info("配置文件不存在，正在生成");

        const configJson = {
            http: {
                port: 21050,
                secret: randomstring.generate(10)
            }
        }

        fs.writeFileSync('config.json', JSON.stringify(configJson, null, 2));

        logger.info("生成完毕！欢迎使用 洇岚 直播助手版~");

        return 1;
    };

    // 然后判断 link 是否存在
    if (!require('../config.json').link) {

        logger.info("Bot 连接配置文件不存在，进入初始化阶段");

        return 2;

    }

    return 0;

}