/**
 * 统一控制器
 * 基础信息设置
 */

const { configDB } = require("../../db")

module.exports = {


    /**
     * 设置 Bot 名称
     * @param {string} name 
     */
    setBotName (name) {

        changes = configDB.prepare(`UPDATE stringConfig SET value = ? WHERE key = 'name';`).run(name).changes;
        if (!changes) {
            return {
                code: -500,
                msg: "数据库操作错误"
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    },

    /**
     * 设置运营者QQ
     * @param {number} id 
     */
    setOwner (id) {

        let changes, result;
        result = configDB.prepare(`SELECT * FROM managers WHERE role = 'owner';`).get();
        if (result) {
            changes = configDB.prepare(`UPDATE managers SET id = ? WHERE role = 'owner';`).run(id).changes;
        } else {
            changes = configDB.prepare(`INSERT INTO managers (id, role) VALUES (?, 'owner');`).run(id).changes;
        }

        if (!changes) {
            return {
                code: -500,
                msg: "数据库操作错误"
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    },

    /**
     * 设置管理群聊
     * @param {number} id 
     */
    setManageGroup (id) {

        let changes, result;
        result = configDB.prepare(`SELECT * FROM managers WHERE role = 'group';`).get();
        if (result) {
            changes = configDB.prepare(`UPDATE managers SET id = ? WHERE role = 'group';`).run(id).changes;
        } else {
            changes = configDB.prepare(`INSERT INTO managers (id, role) VALUES (?, 'group');`).run(id).changes;
        }

        if (!changes) {
            return {
                code: -500,
                msg: "数据库操作错误"
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    },

    /**
     * 设置自动接受好友申请
     * @param {Boolean} flag 
     */
    setAutoAcceptFriend (flag) {

        changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'autoAcceptFriend';`).run(flag ? 1 : 0).changes;

        if (!changes) {
            return {
                code: -500,
                msg: "数据库操作错误"
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    },

    /**
     * 设置自动接受群聊申请
     * @param {Boolean} flag 
     */
     setAutoAcceptGroup (flag) {

        changes = configDB.prepare(`UPDATE numberConfig SET value = ? WHERE key = 'autoAcceptGroup';`).run(flag ? 1 : 0).changes;

        if (!changes) {
            return {
                code: -500,
                msg: "数据库操作错误"
            }
        } else {
            return {
                code: 0,
                msg: null
            }
        }

    }


}