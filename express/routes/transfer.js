/**
 * 用于解决跨域问题的 transfer
 */

// 引入库
const express = require('express');

// 初始化路由
const router = express.Router();

// 引入控制器
const transferCtrl = require('../controllers/transfer');

router.get('/biliAvatar', async (req, res) => {
    await transferCtrl.biliAvatar(req, res);
});

module.exports = router;