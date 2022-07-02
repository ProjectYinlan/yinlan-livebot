/**
 * 用于解决跨域问题的 transfer
 */

const axios = require('axios');
const biliBind = require('../../bot/uniControllers/biliBind');

module.exports = {

    /**
     * B站头像
     * @param {import('express').req} req
     * @param {import('express').res} res
     */
    async biliAvatar (req, res) {
        
        let { uid } = req.query;

        result = await axios({
            url: "https://api.bilibili.com/x/space/acc/info",
            method: 'get',
            params: {
                mid: uid
            }
        }).then(resp=>resp.data);

        if (result.code) {
            res.send(result);
            return;
        }

        const { data } = result;

        axios.get(data.face, {
            responseType: 'arraybuffer'
        }).then(resp => {
            if (!resp) {
                return;
            }
            res.set('content-type', 'image/png');
            res.end(resp.data.toString('binary'), 'binary')
        })

    },


    /**
     * 用户个人信息
     * @param {import('express').req} req
     * @param {import('express').res} res
     */
    async biliInfo (req, res) {

        const { uid } = req.query;
        
        let result = await biliBind.getUserInfo(uid);

        res.send(result);
        
    }

}