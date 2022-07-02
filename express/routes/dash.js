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

    data.data.cards.liveroomList = await controlCtrl.data.liveroomList();
    data.data.cards.auditList = await controlCtrl.data.auditList();
    data.data.cards.liveroomOptions = await controlCtrl.data.liveroomOptions();
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

router.get('/control/liveroomList', async (req, res) => {
    data = await controlCtrl.data.liveroomList();
    res.send({
        code: 0,
        msg: null,
        data
    })
})

router.get('/control/liveroomOptions', async(req, res) => {
    data = await controlCtrl.data.liveroomOptions();
    res.send({
        code: 0,
        msg: null,
        data
    });
})

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

router.post('/control/broadcast', controlCtrl.control.broadcast);

router.get('/control/liveroomList/getCondidateData', controlCtrl.control.liveroomList.getCondidateData);

router.get('/control/liveroomList/getGroupDetail', controlCtrl.control.liveroomList.getGroupDetail);

router.get('/control/liveroomList/getLiveroomDetail', controlCtrl.control.liveroomList.getLiveroomDetail);

router.post('/control/liveroomList/setAtAll', controlCtrl.control.liveroomList.setAtAll);

router.post('/control/liveroomList/addNewBind', controlCtrl.control.liveroomList.addNewBind);

router.post('/control/liveroomList/unbind', controlCtrl.control.liveroomList.unbind);

router.post('/control/liveroomList/clearGroup', controlCtrl.control.liveroomList.clearGroup);

router.post('/control/liveroomList/removeLiveroom', controlCtrl.control.liveroomList.removeLiveroom);

router.post('/control/liveroomOptions/setCheckOptions', controlCtrl.control.liveroomOptions.setCheckOptions);

router.get('/control/liveroomOptions/getLoginQR', controlCtrl.control.liveroomOptions.getLoginQR);

router.post('/control/liveroomOptions/getLoginInfo', controlCtrl.control.liveroomOptions.getLoginInfo);

router.get('/control/liveroomOptions/logout', controlCtrl.control.liveroomOptions.logout);

router.post('/control/contactList/remove', controlCtrl.control.removeContact);

module.exports = router;