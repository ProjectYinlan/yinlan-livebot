module.exports = {

    /**
     * 异步延时
     * @param {number} ms 毫秒
     */
    wait: function(ms) {
        return new Promise ((resolve) => {
            setTimeout(()=>resolve(), ms);
        })
    }
}