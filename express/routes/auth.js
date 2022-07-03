/**
 * 登陆系统
 */

// 引入库
const express = require('express');
const auth = require('../controllers/auth');

// 初始化路由
const router = express.Router();

// 引入控制器

router.post('/getVerifyCode', auth.getVerifyCode);

router.post('/login', auth.login);

router.get('/logout', auth.logout);

module.exports = router;