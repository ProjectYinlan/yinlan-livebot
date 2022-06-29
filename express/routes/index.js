
// 引入库
const express = require('express');

const { version } = require('../../package.json');

const config = require('../../config.json');

// 初始化路由
const router = express.Router();

router.get('/', (req, res) => {
    res.send({
        yinlan: 'livebot',
        version,
        uwu: 'Made with ♥ by colour93',
        doc: 'https://livebot.yinlan.furbot.icu',
        repo: 'https://github.com/colour93/yinlan-livebot'
    })
});

router.use('/welcome', require('./welcome'));

router.use('/transfer', require('./transfer'))

if (config.link) {
    router.use('/dash', require('./dash'));
}


module.exports = router;