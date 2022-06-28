/**
 * 面板数据API路由
 */

// 引入库
const express = require('express');

// 初始化路由
const router = express.Router();

// 引入控制器
const statsCtrl = require('../controllers/dash/stats');
const controlCtrl = require('../controllers/dash/control');

router.get('/', async (req, res) => {
    let data = require('../../yinlan-livebot-front/mock/dash.json');

    data.data.stats.overview = await statsCtrl.overview();
    data.data.stats.bilibili = await statsCtrl.bilibili();
    data.data.stats.yinlan = await statsCtrl.yinlan();

    data.data.cards.auditList = await controlCtrl.data.auditList();
    data.data.cards.contactList = await controlCtrl.data.contactList();

    res.send(data);
});

/**
 * 数据路由
 */

router.get('/stats/overview', async (req, res) => {
    data = await statsCtrl.overview();
    res.send({
        code: 0,
        msg: null,
        data
    });
});

router.get('/stats/bilibili', async (req, res) => {
    data = await statsCtrl.bilibili();
    res.send({
        code: 0,
        msg: null,
        data
    });
});

router.get('/stats/yinlan', async (req, res) => {
    data = await statsCtrl.yinlan();
    res.send({
        code: 0,
        msg: null,
        data
    });
});


router.get('/control/auditList', async (req, res) => {
    data = await controlCtrl.data.auditList();
    res.send({
        code: 0,
        msg: null,
        data
    });
});

// router.get('/control/auditList/auditDetail')

router.get('/control/contactList', async (req, res) => {
    data = await controlCtrl.data.contactList();
    res.send({
        code: 0,
        msg: null,
        data
    });
});

/**
 * 控制路由
 */
router.post('/control/auditHandle', controlCtrl.control.auditHandle);

module.exports = router;