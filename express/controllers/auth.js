/**
 * 初始化 API 控制器
 */

const logger = require('npmlog');
const utils = require('../../bot/controllers/utils');

const bot = require('../../bot')();

const responder = require('./responder');

module.exports = {

    /**
     * 获取验证码
      * @param {import('express').req} req 
      * @param {import('express').res} res 
     */
    async getVerifyCode(req, res) {

        // 判断是否有权限
        const { id } = req.body;
        if (!id || typeof(id) != 'number') {
            responder.paramsError(res);
            return;
        }

        let role = utils.verifyAccess(id);

        if (role=='normal') {
            res.send({
                code: -403,
                msg: "请确认管理员账号"
            });
            return;
        } 

        const ts = (new Date()).getTime();

        // 判断是否已经生成及其过期时间和有效性
        const { verifyCode } = req.session;

        // 判断是否在 60s 内重复执行
        if (verifyCode && (verifyCode.signTs + 60000 > ts)) {
            res.send({
                code: -403,
                msg: `请 ${parseInt((verifyCode.signTs + 60000 - ts) / 1000)} 秒后再试`
            });
            return;
        }

        let gVerifyCode = generateVerifyCode();

        // 发送
        await bot.sendFriendMessage(`您的验证码是【${gVerifyCode.code}】，有效期五分钟`, id);

        req.session.verifyCode = gVerifyCode
        res.send({
            code: 0,
            msg: null,
            ts: gVerifyCode.signTs
        });
    },

    /**
     * 登录
     * @param {import('express').req} req 
     * @param {import('express').res} res 
     */
    async login(req, res) {

        const { id, code } = req.body;

        if (
            !id || typeof(id) != 'number' ||
            !code || typeof(code) != 'string'
        ) {
            responder.paramsError(res);
            return;
        }

        if (req.session.verifyCode.code != code) {
            res.send({
                code: -5,
                msg: "验证码错误"
            });
            return;
        }

        let role = utils.verifyAccess(id);

        req.session.account = { id, role };

        res.send({
            code: 0,
            msg: null
        })

    },

    /**
     * 登出
     * @param {import('express').req} req 
     * @param {import('express').res} res 
     */
    async logout(req, res) {

        req.session.destroy();

        res.send({
            code: 0,
            msg: null
        })

    }

}


/**
 * 生成验证码
 */
function generateVerifyCode() {

    let ts = (new Date()).getTime();

    let randomSixStr = '';
    for (let i = 0; i < 6; i++) {
        randomSixStr += Math.floor(Math.random() * 10).toString();
    }

    return {
        code: randomSixStr,
        signTs: ts
    }

}