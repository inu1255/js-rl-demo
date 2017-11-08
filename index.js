/**
 * Created Date: 2017-10-18 13:07:19
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 14:18:32
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const co = require("co");
const QLearner = require("./reinforce/QLearner");
const DQNLearner = require("./reinforce/DQNLearner");
const FindNumber = require("./games/FindNumber");
const GuessWord = require("./games/GuessWord");

const game = new GuessWord();
const rl = new DQNLearner(game, { reward_decay: 0 });

co(function*() {
    try {
        let j = 0;
        if (rl.load) {
            yield rl.load();
        }
        for (let i = 0; i < 100; i++) {
            let data = yield rl.play();
            j += data.step;
            console.log(data.step);
        }
        yield rl.save();
        // console.log(JSON.stringify(rl.q_table, null, 4));
        // console.log(JSON.stringify(rl.eligibility_trace, null, 4));
        console.log(j, "步");
    } catch (error) {
        console.log(error);
    }
});