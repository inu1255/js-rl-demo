/**
 * Created Date: 2017-10-19 13:53:22
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 11:39:30
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const co = require("co");
const utils = require("../common/utils");
const fs = require("fs");

/**
 * 判断一个变量是否为 Promise，按标准实现
 * @param x
 * @return {boolean}
 */
function isPromise(x) {
    return x && typeof x.then === "function";
}

class Learner {
    constructor(game, config) {
        this.game = game;
        this.name = this.constructor.name.toLowerCase().replace(/learner$/, "");
        this.config = Object.assign({}, this.constructor.config, config);
        this.build();
    }
    build() {
        // 初始化,可以覆盖
    }
    cacheFileName() {
        return "cache/" + this.name + "-" + this.game.name + ".json";
    }
    save() {
        let data = this.toJSON();
        return utils.writeJson(this.cacheFileName(), data);
    }
    load() {
        let that = this;
        let filename = this.cacheFileName();
        return co(function*() {
            if (fs.existsSync(filename)) {
                try {
                    let data = yield utils.readJson(filename);
                    that.fromJSON(data);
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }
    fromJSON() {
        console.log(this.constructor.name, "fromJSON需要实现");
    }
    toJSON(data) {
        console.log(this.constructor.name, "toJSON需要实现");
    }
    randIndex(n, forbid) {
        let list = [];
        for (let i = 0; i < n; i++) {
            list.push(i);
        }
        for (let i of forbid) {
            list[i] = -1;
        }
        list = list.filter(x => x >= 0);
        return list[Math.floor(Math.random() * list.length)];
    }
    chooseAction(state, forbid) {
        console.log(this.constructor.name, "选择行动操作需要实现");
    }
    learn(state, action, score, stop, next_state) {
        console.log(this.constructor.name, "学习操作需要实现");
    }
    play() {
        let rl = this;
        let game = this.game;
        return co(function*() {
            let ret;
            let step = 0;
            let score = 0;
            ret = game.begin();
            if (isPromise(ret)) yield ret;
            while (!game.isEnd()) {
                let state = game.getState();
                if (isPromise(state)) state = yield state;
                let forbid = game.forbid();
                if (isPromise(forbid)) forbid = yield forbid;
                let action = rl.chooseAction(state, forbid);
                let reward = game.play(action);
                if (isPromise(reward)) reward = yield reward;
                let next_state = game.getState();
                if (isPromise(next_state)) next_state = yield next_state;
                rl.learn(state, action, reward, game.isEnd(), next_state);
                step++;
                score += reward;
            }
            return { step, score };
        });
    }
}

module.exports = Learner;