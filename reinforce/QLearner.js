/**
 * Created Date: 2017-10-19 14:25:16
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 11:39:55
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const Learner = require("./Learner");

class QLearner extends Learner {
    build(){
        this.q_table = {};
    }
    toJSON(){
        return this.q_table;
    }
    fromJSON(data){
        this.q_table = data;
    }
    activate(state_hash, action) {
        let t = this.q_table;
        t = t[state_hash];
        if (!t) return 0;
        t = t[action];
        if (!t) return 0;
        return t;
    }
    propagate(state_hash, action, q_target) {
        let t = this.q_table[state_hash];
        if (!t) t = this.q_table[state_hash] = {};
        let q_next = t[action] || 0;
        t[action] = q_next + this.config.learning_rate * (q_target - q_next);
    }
    maxScore(state_hash) {
        let t = this.q_table;
        t = t[state_hash];
        if (!t) return 0;
        let max = 0;
        for (let k in t) {
            let v = t[k];
            max = v > max ? v : max;
        }
        return max;
    }
    chooseAction(state, forbid) {
        if (Math.random() < this.config.e_greedy) {
            let t = this.q_table[this.config.stateHash(state)];
            if (t) {
                let max = 0;
                let maxi = 0;
                for (let i = 0; i < this.game.n_action; i++) {
                    if (forbid.indexOf(i)>=0) {
                        continue;
                    }
                    let v = t[i] || 0;
                    if (v > max) {
                        max = v;
                        maxi = i;
                    }
                }
                return maxi;
            }
        }
        return this.randIndex(this.game.n_action, forbid);
    }
    learn(state, action, score, stop, next_state) {
        let state_hash = this.config.stateHash(state);
        let q_target;
        if (stop) {
            q_target = score;
        } else {
            q_target = score + this.config.reward_decay * this.maxScore(this.config.stateHash(next_state));
        }
        this.propagate(state_hash, action, q_target);
    }
};

QLearner.config = {
    stateHash: function(state) {
        if (state instanceof Array) {
            return state.join("");
        }
        if (typeof state === "object") {
            return Object.value(state).join("");
        }
        return state;
    },
    reward_decay: 0.5,
    learning_rate: 0.01,
    e_greedy: 0.9,
};

module.exports = QLearner;