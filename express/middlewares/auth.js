/**
 * 鉴权中间件
 */
module.exports = (req, res, next) => {

    const { account } = req.session;
    if ( !account || account.role == 'normal' ) {
        res.send({
            code: -401,
            msg: "无权访问"
        });
        return;
    }

    next();

}