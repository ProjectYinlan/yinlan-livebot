
// 引入库
const express = require('express');

const { version } = require('../../package.json');

// 初始化路由
const router = express.Router();

// 引入控制器
const transferRouter = require('./transfer');
const dashRouter = require('./dash');

router.get('/', (req, res) => {
    res.send({
        yinlan: 'livebot',
        version,
        uwu: 'Made with ♥ by colour93',
        doc: 'https://livebot.yinlan.furbot.icu',
        repo: 'https://github.com/colour93/yinlan-livebot'
    })
});

router.use('/transfer', transferRouter)

router.use('/dash', dashRouter);







module.exports = router;