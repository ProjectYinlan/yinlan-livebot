/**
 * SQLite 数据库
 */
const path = require('path');

module.exports = {
    configDB: require('better-sqlite3')(path.resolve('data', 'config.db')),
    dataDB: require('better-sqlite3')(path.resolve('data', 'data.db'))
}