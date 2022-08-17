/**
 * 计划任务
 */

const schedule = require('node-schedule');
const logger = require('npmlog');
const axios = require('axios');

const bot = require('../bot')();

const { dataDB, configDB } = require('../db');

const biliCheck = require('./uniControllers/biliCheck');
const utils = require('../common/utils');

logger.info("加载计划任务");

let result = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckInterval';`).get();
let interval = result.value;

module.exports = {

    /**
     * 每分钟记录启动时长
     */
    onlineTimer: schedule.scheduleJob('0 * * * * *', () => {
        r = dataDB.prepare(`UPDATE stats SET value =  (value + 1) WHERE key = 'onlineTime';`).run();
    }),

    /**
     * 直播检测
     */
    biliCheck: schedule.scheduleJob(`*/${interval} * * * * *`, async () => {

        let temp = [];

        // 获取模式
        let workMode = configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckMode';`).get().value;

        // 获取列表
        let liveroomList = dataDB.prepare(`SELECT * FROM liverooms WHERE roomId != 0;`).all();

        // 判断工作模式
        if (workMode) {

            // 获取 cookie
            let result = await biliCheck.getAccount();
            if (result.code) {
                if (result.code == -401) return;
                logger.warn(`直播检查遇到错误：${result.code} - ${result.msg}`);
                return;
            }
            const { cookie } = result.data;

            // 获取API中直播中列表
            let livingList;
            try {
                livingList = await axios({
                    method: 'get',
                    url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=2000',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        cookie
                    }
                }).then(resp => resp.data);
            } catch (error) { }
            if (livingList.code) {
                logger.warn(`直播检查遇到错误：${livingList.code} - ${livingList.msg}`);
                return;
            }

            if (!livingList.data.items || typeof (livingList.data.items) != 'object') return;

            livingList = livingList.data.items;

            /** 参考
                [
                {
                    uid: 12583120,
                    roomId: 1064790,
                    uname: '路过的玖叁',
                    status: 0,
                    flag: 0,
                    change: false
                },
                {
                    uid: 1412438819,
                    roomId: 24304788,
                    uname: 'wolf狼灵',
                    status: 1,
                    flag: 0,
                    face: 'https://i2.hdslb.com/bfs/face/2b45990b3f6de819c7442964cb0e25208285fb2f.jpg',       
                    link: 'https://live.bilibili.com/24304788?broadcast_type=1',
                    title: '摸鱼？来摸摸幸运小狼叭福契+1无声警告',
                    change: false
                }
                ]
             */

            // 这里不用map是因为async后await的时候他似乎等不住
            for (let i = 0; i < liveroomList.length; i++) {
                const liveItem = liveroomList[i];

                // 筛选一致的
                let livingItem = livingList.filter((livingItem) => {
                    if (liveItem.uid == livingItem.uid) return true;
                });

                // 没筛选到说明没直播
                if (livingItem.length == 0) {
                    livingItem = {
                        status: 0,
                        change: (liveItem.status == 1)
                    }
                } else {
                    livingItem = livingItem[0];
                    livingItem.status = 1;
                    livingItem.change = (liveItem.status == 0);
                }

                // 顺带获取一下如果change了的cover
                if (livingItem.change && livingItem.status) {
                    let info = await biliCheck.getUserInfo(livingItem.uid);
                    if (info.code) return;
                    livingItem.cover = info.data.live_room.cover;
                }

                temp.push(Object.assign(liveItem, livingItem));

            }
            liveroomList = temp;

            // 这次是逻辑循环
            for (let i = 0; i < liveroomList.length; i++) {
                const liveroomItem = liveroomList[i];
                await biliCheckStatus(liveroomItem);
            }

        } else {

            for (let i = 0; i < liveroomList.length; i++) {
                let liveroomItem = liveroomList[i];
                let livingItem = {};
                
                // 通过API判断直播间状态
                let info = await biliCheck.getUserInfo(liveroomItem.uid);
                if (info.code) break;

                livingItem = {
                    status: info.data.live_room.liveStatus,
                    title: info.data.live_room.title,
                    cover: info.data.live_room.cover,
                    change: (liveroomItem.status != info.data.live_room.liveStatus)
                }

                temp = Object.assign(liveroomItem, livingItem);

                await biliCheckStatus(temp);

            }

        }

    })

}


async function biliCheckStatus(liveroomItem) {

    let date = new Date();
    let ts = date.getTime();

    // 变更走变更流程
    if (liveroomItem.change) {

        dataDB.prepare(`UPDATE liverooms SET uname = ?, status = ?, ts = ?, flag = 0 WHERE uid = ?;`).run(liveroomItem.uname, liveroomItem.status, ts, liveroomItem.uid);

    } else {

        // flag 自增，用于消抖
        dataDB.prepare(`UPDATE liverooms SET flag = flag + 1 WHERE uid = ?;`).run(liveroomItem.uid);
    }


    // 判断是否达成推送条件
    if (
        (liveroomItem.status == 1 && liveroomItem.flag == 2) ||
        (liveroomItem.status == 0 && liveroomItem.flag == 5)
    ) {

        // 推送

        dataDB.prepare(`UPDATE liverooms SET pending = 1 WHERE uid = ?;`).run(liveroomItem.uid);

        let messageChain = liveroomItem.status ?
            [
                {
                    type: 'Plain',
                    text: `${liveroomItem.uname} 直播啦~\n${liveroomItem.title}\nhttps://live.bilibili.com/${liveroomItem.roomId}`
                },
                {
                    type: 'Image',
                    url: liveroomItem.cover
                }
            ]
            :
            [
                {
                    type: 'Plain',
                    text: `${liveroomItem.uname} 下播了~\n本次直播：${utils.getTimeStr(ts - liveroomItem.ts, 'ms')}`
                }
            ]

        // 获取群聊列表
        let groupList = (await biliCheck.getLiveroomDetail(liveroomItem.uid)).data;

        for (let j = 0; j < groupList.length; j++) {
            const groupItem = groupList[j];

            // atall
            if (groupItem.atAll && liveroomItem.status) messageChain.push({ type: 'AtAll' });

            let r = await bot.sendGroupMessage(messageChain, groupItem.id);

            if (r.messageId == -1) {
                messageChain.pop();
                await bot.sendGroupMessage(messageChain, groupItem.id);
            }

            await utils.wait(200);
        }

        dataDB.prepare(`UPDATE stats SET value = value + ? WHERE key = 'pushCount';`).run(groupList.length);
        dataDB.prepare(`UPDATE liverooms SET pending = 0 WHERE uid = ?;`).run(liveroomItem.uid);

    }
}