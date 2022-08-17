/**
 * 洇岚 直播助手版
 * 
 * Author: 玖叁 @colour93 (https://github.com/colour93)
 * 
 * __     ___       _             
 * \ \   / (_)     | |            
 *  \ \_/ / _ _ __ | | __ _ _ __  
 *   \   / | | '_ \| |/ _` | '_ \ 
 *    | |  | | | | | | (_| | | | |
 *    |_|  |_|_| |_|_|\__,_|_| |_|
 * 
 */

// const utils = require('./common/utils');

init();

async function init() {

    // 配置文件&数据库检查
    result = await require('./common/configCheck')();

    if (!result) {
        
        // 加载预处理
        await require('./common/preload')();
    
        const bot = await require('./bot')();
    
        require('./bot/handlers');
        
        require('./bot/schedule');
        
    }
    
    const express = require('./express');

}

