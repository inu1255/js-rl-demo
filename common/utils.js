/**
 * Created Date: 2017-10-18 10:52:56
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-19 13:46:37
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const co = require("co");
const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));

exports.readJson = function(filePath) {
    return co(function*() {
        var s = yield fs.readFileAsync(filePath, "utf8");
        return JSON.parse(s);
    });
};

exports.writeJson = function(filePath, data, space) {
    return co(function*() {
        fs.writeFileAsync(filePath, JSON.stringify(data, null, space), "utf8");
    });
};

exports.isGame = function(game) {
    
};