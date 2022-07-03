/**
 * 统一控制器
 * B站账户相关
 */

const axios = require('axios');

const { configDB } = require("../../db");
const schedule = require('../schedule');


module.exports = {

    /**
     * 获取工作模式
     * @param {Boolean} showAccount 是否展示账号信息
     */
    async getWorkMode(showAccount) {

        let mode = (configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckMode';`).get()).value ? 'auth' : 'anonymous';
        let interval = (configDB.prepare(`SELECT value FROM numberConfig WHERE key = 'biliCheckInterval';`).get()).value;
        
        let account;
        if (showAccount) {
            account = (await this.getAccount(true)).data;
        }
        
        return {
            code: 0,
            msg: null,
            data: {
                mode,
                interval,
                account
            }
        }

    },

    /**
     * 获取已绑定的账户信息
     * @param {Boolean} info 是否返回账号信息
     * @returns 
     */
    async getAccount(info) {

        let data = {};

        let result = configDB.prepare(`SELECT value FROM stringConfig WHERE key = 'biliCheckAccount';`).get();

        if (!result || !result.value) {
            return {
                code: -401,
                msg: "未登录"
            }
        }

        data.cookie = result.value;

        let cookieObj = data.cookie.split(";").map(item => item.split("="));
        cookieObj.forEach(cookieItem => {
            if (cookieItem[0] == 'bili_jct') data.csrf = cookieItem[1];
        })

        if (info) {

            result = await this.getAccountInfo(data.cookie);

            if (result.code) return result;

            const { uname, mid, following } = result.data;
            data.uname = uname;
            data.mid = mid;
            data.following = following;

        }

        return {
            code: 0,
            msg: null,
            data
        }


    },

    /**
     * 通过 cookie 获取账户信息
     * @param {string} cookie 
     */
    async getAccountInfo(cookie) {

        let result = await axios.get('https://api.bilibili.com/x/web-interface/nav', {
            withCredentials: true,
            headers: {
                cookie
            }
        }).then(resp => resp.data);
        if (result.code != 0) return {
            code: -402,
            msg: "登录信息已失效"
        };
        
        const { uname, mid } = result.data;

        result = await axios.get('https://api.bilibili.com/x/web-interface/nav/stat', {
            withCredentials: true,
            headers: {
                cookie
            }
        }).then(resp => resp.data);

        const { following } = result.data;

        return {
            code: 0,
            msg: null,
            data: {
                uname,
                mid,
                following
            }
        }

    },

    /**
     * 获取登录二维码
     */
    async getLoginQR() {

        result = await axios.get('http://passport.bilibili.com/qrcode/getLoginUrl').then(resp => resp.data);

        if (result.code) {
            return result;
        }

        let { ts, data } = result;
        data.ts = ts;

        return {
            code: 0,
            msg: null,
            data
        }

    },


    /**
     * 获取登录信息
     * @param {String} oauthKey oauthKey
     */
    async getLoginInfo(oauthKey) {

        let resp = await axios({
            method: 'post',
            url: 'http://passport.bilibili.com/qrcode/getLoginInfo',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: (new URLSearchParams({
                oauthKey
            })).toString()
        });

        let result = resp.data;

        // 错误处理
        let msg;
        if (typeof (result.data) == 'number') {
            switch (result.data) {
                case -2:
                    msg = "二维码已失效或信息不完整";
                    break;

                case -4:
                    msg = "未扫描二维码";
                    break;

                case -5:
                    msg = "未确认登录";
                    break;

                default:
                    msg = message;
                    break;
            }
            return {
                code: result.data,
                msg
            }
        }

        // 获取 cookie 以及去掉 expire
        let cookie = resp.headers['set-cookie'];
        cookie = cookie.map((item) => {
            t = item.split(";");
            return t[0];
        })
        cookie = cookie.join(';');

        // 获取信息
        result = await this.getAccountInfo(cookie);

        if (result.code) return result;

        // 写入数据库
        changes = configDB.prepare(`UPDATE stringConfig SET value = ? WHERE key = 'biliCheckAccount';`).run(cookie).changes;

        if (!changes) return {
            code: -500,
            msg: "数据库操作出错",
            data: result.data
        }

        return result;

    },

    /**
     * 登出
     */
    async logout() {

        changes = configDB.prepare(`UPDATE stringConfig SET value = null WHERE key = 'biliCheckAccount';`).run().changes;

        if (!changes) return {
            code: -500,
            msg: "数据库操作出错"
        }

        return {
            code: 0,
            msg: null
        };

    },

    /**
     * 设置
     * @param {object} options mode, interval
     */
    async setCheckOptions(options) {

        let { mode, interval } = options;

        let msg = [];

        if (mode) {
            changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'biliCheckMode';`).run(mode == 'auth' ? 1 : 0).changes;
            if (!changes) msg.push("biliCheckMode 修改失败");
        }
        
        if (interval) {

            if (!mode) mode = (await this.getWorkMode()).data.mode;

            if (
                ((mode == 'auth') && (interval >= 10) && (interval <= 60)) ||
                ((mode == 'anonymous') && (interval == 60))
            ) {
                changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'biliCheckInterval';`).run(interval).changes;
                schedule.biliCheck.reschedule((`*/${interval} * * * * *`));
                if (!changes) msg.push("biliCheckInterval 修改失败");
            } else {
                msg.push("interval 值不正确")
            }

        }

        if (msg.length) {
            return {
                code: -400,
                msg: msg.join("；")
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    }

}