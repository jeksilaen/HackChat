const moment = require('moment');
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes()

function formatMessage(username, text) {
    return {
        username,
        text,
        time
    }
}

module.exports = formatMessage;