/**
 * Created Date: 2017-10-19 13:42:02
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 10:25:19
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */

function FindNumber(n, max) {
    n = n || 8;
    max = max || 10;
    var state = this;
    this.name = `findnumber${n}-${max}`;
    this.begin = function() {
        state.aim = n;
        state.player = 0;
    };
    // action : Array[1x4] 
    this.play = function(action) {
        action = action > 1 ? action - 1 : action + max - 2;
        state.player = (state.player + action) % max;
        if (state.player === state.aim) {
            return 1;
        }
        return 0;
    };
    this.getState = function() {
        let condition = state.player;
        condition = new Array(max).fill(0);
        condition[state.player] = 1;
        return condition;
    };
    this.isEnd = function() {
        return state.player === state.aim;
    };
    this.n_state = max;
    this.n_action = 4;
}

module.exports = FindNumber;