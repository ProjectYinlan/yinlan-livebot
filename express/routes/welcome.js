/**
 * 初始化欢迎页
 */

// 引入库
const express = require('express');
const welcome = require('../controllers/welcome');

// 初始化路由
const router = express.Router();

// 引入控制器

router.post('/setLinkConfig', welcome.setLinkConfig);

router.post('/setBaseConfig', welcome.setBaseConfig);

router.get('/shutdown', welcome.shutdown);

module.exports = router;