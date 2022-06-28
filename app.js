/**
 * 洇岚 直播助手版
 * 0.1.0
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

    // 加载预处理
    await require('./common/preload')();

    const bot = await require('./bot')();

    require('./bot/handlers');

    const express = require('./express');

    require('./bot/schedule');

}

