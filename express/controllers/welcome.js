/**
 * 初始化 API 控制器
 */

const fs = require('fs');

const logger = require('npmlog');
const baseConfig = require('../../bot/uniControllers/baseConfig');

const responder = require('./responder');

module.exports = {

    /**
     * 设置连接参数
     * @param {import('express').req} req 
     * @param {import('express').res} res 
     */
    async setLinkConfig (req, res) {

        const hostReg = /^https?:\/\/(\w+)(\.\w+)*:?([0-9]|[0-9][0-9]|[0-9][0-9][0-9]|[0-9][0-9][0-9][0-9]|[0-5][0-9][0-9][0-9][0-9]|6[0-4][0-9][0-9][0-9]|65[0-4][0-9][0-9]|655[0-2][0-9]|6553[0-6])?$/;

        const { host, verifyKey, qq, enableWebSocket } = req.body;

        if (
            typeof(host) != 'string' ||
            !hostReg.test(host) ||
            typeof(verifyKey) != 'string' ||
            typeof(qq) != 'number' ||
            typeof(enableWebSocket) != 'boolean'
        ) {
            responder.paramsError(res);
            return;
        }

        let config = require('../../config.json');

        config.link = { host, verifyKey, qq, enableWebSocket };

        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));

        logger.info("连接配置文件已写入");        

        res.send({
            code: 0,
            msg: null
        })

    },

    /**
     * 设置基本参数
     * @param {import('express').req} req 
     * @param {import('express').res} res 
     */
    async setBaseConfig (req, res) {

        const { name, owner, manageGroup, autoAcceptFriend, autoAcceptGroup } = req.body;
        if (
            typeof(name) != 'string' ||
            typeof(owner) != 'number' ||
            typeof(manageGroup) != 'number' ||
            typeof(autoAcceptFriend) != 'boolean' ||
            typeof(autoAcceptGroup) != 'boolean'
        ) {
            responder.paramsError(res);
            return;
        }

        r = baseConfig.setBotName(name);
        if (r.code) {
            res.send(r);
            return;
        }

        r = baseConfig.setOwner(owner);
        if (r.code) {
            res.send(r);
            return;
        }

        r = baseConfig.setManageGroup(manageGroup);
        if (r.code) {
            res.send(r);
            return;
        }

        r = baseConfig.setAutoAcceptFriend(autoAcceptFriend);
        if (r.code) {
            res.send(r);
            return;
        }

        r = baseConfig.setAutoAcceptGroup(autoAcceptGroup);
        if (r.code) {
            res.send(r);
            return;
        }

        res.send({
            code: 0,
            msg: null
        })

    },


    /**
     * 关闭服务
     * @param {import('express').req} req 
     * @param {import('express').res} res 
     */
    async shutdown (req, res) {

        res.send({
            code: 0,
            msg: null
        });

        process.exit();

    }

}