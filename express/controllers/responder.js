/**
 * 通用响应
 */

module.exports = {
    
    /**
     * Not Found
     * @param {import('express').res} res
     */
    notFound (res, msg) {
        res.send({
            code: -404,
            msg: msg || "什么也没有嗷"
        });
    },

    /**
     * Params Error
     * @param {import('express').res} res
     */
    paramsError (res, msg) {
        res.send({
            code: -400,
            msg: msg || "请求参数错误"
        });
    },

}