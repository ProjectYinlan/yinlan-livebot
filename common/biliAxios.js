/**
 * 封装一下带B站凭证的 axios
 */

const axios = require('axios');
const { configDB } = require('../db');

let result = configDB.prepare(`SELECT value FROM stringConfig WHERE key = 'biliCheckAccount';`).get();
let cookie = {};

if (result && result.value) {
    cookie = result.value;
}

module.exports = axios.create({
    withCredentials: true,
    headers: {
        cookie
    }
})