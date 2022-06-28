const { configDB, dataDB } = require('../../db');

const logger = require('npmlog');

module.exports = {
    /**
     * 获取 Bot 名称
     * @return {number || undefined}
     */
    getBotName() {
        result = configDB.prepare("SELECT value FROM stringConfig WHERE key = 'name';").get();
        if (!result) {
            result.value = "洇岚";
        }
        return result.value;
    },

    /**
     * 判断某人角色
     * @param {number} id 
     * @return {string} normal | admin | owner
     */
    verifyAccess(id) {
        let result = configDB.prepare('SELECT role FROM managers WHERE id = ?;').get(id);
        if (!result) {
            result = { role: 'normal' };
        }
        return result.role;
    },

    /**
     * 获取管理群号
     * @return {number} 没有的情况下返回 undefined
     */
    getManageGroupId() {
        result = configDB.prepare("SELECT id FROM managers WHERE role = 'group';").get();
        if (!result) return;
        return result.id;
    },
}