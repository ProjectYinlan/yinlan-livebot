module.exports = {

    /**
     * 异步延时
     * @param {number} ms 毫秒
     */
    wait: function (ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), ms);
        })
    },

    /**
     * 时间换算
     * @param {number} time 时间
     * @param {string} type ms 毫秒，s 秒
     * @param {string} ss 是否显示秒
     */
    getTimeStr(time, type, ss) {
        if (type && type == 'ms') time = time / 1000;
        // 转换为式分秒
        let h = parseInt((time / 60 / 60) % 24);
        h = h < 10 ? "0" + h : h;
        let m = parseInt((time / 60) % 60);
        m = m < 10 ? "0" + m : m;
        let s = parseInt(time % 60);
        s = s < 10 ? "0" + s : s;
        // 作为返回值返回
        return `${h}时${m}分${ss ? s + '秒' : ''}`;
    }
}