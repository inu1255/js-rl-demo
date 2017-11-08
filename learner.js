/**
 * Created Date: 2017-10-18 13:06:25
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-19 13:38:11
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */

const co = require("co");
const utils = require("./utils");
const fs = require("fs");
const _ = require("lodash");
const { Architect, Layer, Network, Trainer } = require('synaptic');

function hashString(state) {
    if (state instanceof Array) {
        return state.join("");
    }
    if (typeof state === "object") {
        return Object.value(state).join("");
    }
    return state;
}

class Learner {
    constructor(game, config) {
        this.q_table = {};
        Object.assign(this, {
            stateHash: hashString,
            reward_decay: 0.9,
            learning_rate: 0.01,
            e_greedy: 0.9,
        }, config);
        this.game = game;
    }
}

/**
 * chooseAction
 * learn
 */
class QLeaner extends Learner {
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
        t[action] = q_next + this.learning_rate * (q_target - q_next);
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
    chooseAction(state) {
        if (Math.random() < this.e_greedy) {
            let t = this.q_table[this.stateHash(state)];
            if (t) {
                let max = 0;
                let maxi = 0;
                for (let i = 0; i < this.game.n_action; i++) {
                    let v = t[i] || 0;
                    if (v > max) {
                        max = v;
                        maxi = i;
                    }
                }
                return maxi;
            }
        }
        return Math.floor(Math.random() * this.actions.length);
    }
    play() {
        let rl = this;
        let game = this.game;
        return co(function*() {
            let step = 0;
            let score = 0;
            yield game.begin();
            while (!game.isEnd()) {
                let state = game.getState();
                let action = rl.chooseAction(state);
                let reward = game.play(action);
                let next_state = game.getState();
                rl.learn(state, action, reward, game.isEnd(), next_state);
                step++;
                score += reward;
            }
            return { step, score };
        });
    }
    learn(state, action, score, stop, next_state) {
        let state_hash = this.stateHash(state);
        let q_target;
        if (stop) {
            q_target = score;
        } else {
            q_target = score + this.reward_decay * this.maxScore(this.stateHash(next_state));
        }
        this.propagate(state_hash, action, q_target);
    }
};
exports.QLeaner = QLeaner;

class SarsaLearner extends QLeaner {
    learn(state, action, score, stop, next_state, next_action) {
        let state_hash = this.stateHash(state);
        let q_target;
        if (stop) {
            q_target = score;
        } else {
            let next_state_hash = this.stateHash(next_state);
            q_target = score + this.reward_decay * this.activate(next_state_hash, next_action);
        }
        this.propagate(state_hash, action, q_target);
    }
    play() {
        let rl = this;
        let game = this.game;
        return co(function*() {
            let step = 0;
            let score = 0;
            yield game.begin();
            let next_state = game.getState();
            let next_action = rl.chooseAction(next_state);
            while (!game.isEnd()) {
                let state = next_state;
                let action = next_action;
                let reward = game.play(action);
                next_state = game.getState();
                next_action = rl.chooseAction(state);
                rl.learn(state, action, reward, game.isEnd(), next_state, next_action);
                step++;
                score += reward;
            }
            return { step, score };
        });
    }
};
exports.SarsaLearner = SarsaLearner;

class SarsaLambdaLearner extends SarsaLearner {
    constructor(game, config) {
        super(game, config);
        this.trace_decay = this.trace_decay || 0.9;
        this.eligibility_trace = {};
    }
    propagate(state_hash, action, q_target) {
        let t = this.q_table[state_hash];
        if (!t) t = this.q_table[state_hash] = {};
        let q_next = t[action] || 0;
        let dx = this.learning_rate * (q_target - q_next);
        this.eligibility_trace[state_hash] = { action, value: 1 };
        for (let k in this.eligibility_trace) {
            let v = this.eligibility_trace[k];
            this.q_table[k][v.action] = (this.q_table[k][v.action] || 0) + dx * v.value;
            v.value *= this.trace_decay;
        }
    }
};
exports.SarsaLambdaLearner = SarsaLambdaLearner;

function randProbIndex(prob) {
    let sum = 0;
    for (var i = 0; i < prob.length; i++) {
        sum += prob[i];
    }
    if (sum > 0) {
        let r = Math.random();
        let v = 0;
        for (var i = 0; i < prob.length; i++) {
            v += prob[i] / sum;
            if (r < v) {
                return i;
            }
        }
    }
    return Math.floor(Math.random() * prob.length);
}

class DQNLearner {
    constructor(game, config) {
        this.game = game;
        Object.assign(this, {
            e_greedy: 0.9,
            cache_size: 100,
            replace_target_iter: 30,
            learningRate: 0.01,
            reward_decay: 0.5
        }, config);
        this.data = [];

        this.learn_step_counter = 0;

        function buildNet() {
            const inputLayer = new Layer(game.n_state); // 输入状态
            const hiddenLayer = new Layer(100);
            const outputLayer = new Layer(game.n_action); // 行动得分

            inputLayer.project(hiddenLayer);
            hiddenLayer.project(outputLayer);

            return new Network({
                input: inputLayer,
                hidden: [hiddenLayer],
                output: outputLayer
            });
        }
        this.q_eval = buildNet();
        this.q_next = buildNet();
    }
    chooseAction(state) {
        if (Math.random() < this.e_greedy) {
            let action_score = this.q_eval.activate(state);
            let list = [];
            for (var i = 0; i < action_score.length; i++) {
                list.push({
                    action: i,
                    score: action_score[i]
                });
            }
            list.sort(x => Math.random() - 0.5);
            let max = 0;
            let maxi = 0;
            for (let i = 0; i < list.length; i++) {
                let item = list[i];
                if (item.score > max) {
                    max = item.score;
                    maxi = i;
                }
            }
            return list[maxi].action;
        }
        return Math.floor(Math.random() * this.game.n_action);
    }
    save() {
        let data = {
            q_eval: this.q_eval.toJSON(),
            q_next: this.q_next.toJSON(),
        };
        return utils.writeJson("net-findnumber.json", data);
    }
    load() {
        let that = this;
        return co(function*() {
            if (fs.existsSync("net-findnumber.json")) {
                try {
                    let data = yield utils.readJson("net-findnumber.json");
                    that.q_eval = Network.fromJSON(data.q_eval);
                    that.q_next = Network.fromJSON(data.q_next);
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }
    learn(state, action, score, stop, next_state) {
        if (this.data.length > this.cache_size) {
            this.data.shift(Math.floor(Math.random() * this.data.length), 1);
        }
        this.data.push({ state, action, score, next_state });
        for (let item of this.data) {
            let { state, action, score, next_state } = item;
            let q_next = this.q_next.activate(next_state);
            let q_eval = this.q_eval.activate(state);
            let max = _.max(q_next);
            q_eval[action] = score / 2 + this.reward_decay * max;
            // console.log(state.indexOf(1), action, score, q_eval);
            this.q_eval.propagate(this.learningRate, q_eval);
        }
        this.count_replace();
    }
    count_replace() {
        this.learn_step_counter++;
        if (this.learn_step_counter % this.replace_target_iter == 0) {
            this.q_next = Network.fromJSON(this.q_eval.toJSON());
        }
    }
    play() {
        let rl = this;
        let game = this.game;
        return co(function*() {
            let step = 0;
            let score = 0;
            yield game.begin();
            while (!game.isEnd()) {
                let state = game.getState();
                let action = rl.chooseAction(state);
                let reward = game.play(action);
                let next_state = game.getState();
                rl.learn(state, action, reward, game.isEnd(), next_state);
                step++;
                score += reward;
            }
            // console.log([1, 0, 0, 0, 0, 0, 0, 0, 0, 0], rl.q_eval.activate([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
            console.log([0, 1, 0, 0, 0, 0, 0, 0, 0, 0], rl.q_eval.activate([0, 1, 0, 0, 0, 0, 0, 0, 0, 0]));
            // console.log([0, 0, 1, 0, 0, 0, 0, 0, 0, 0], rl.q_eval.activate([0, 0, 1, 0, 0, 0, 0, 0, 0, 0]));
            console.log([0, 0, 0, 1, 0, 0, 0, 0, 0, 0], rl.q_eval.activate([0, 0, 0, 1, 0, 0, 0, 0, 0, 0]));
            // console.log([0, 0, 0, 0, 1, 0, 0, 0, 0, 0], rl.q_eval.activate([0, 0, 0, 0, 1, 0, 0, 0, 0, 0]));
            // console.log([0, 0, 0, 0, 0, 0, 1, 0, 0, 0], rl.q_eval.activate([0, 0, 0, 0, 0, 0, 1, 0, 0, 0]));
            console.log([0, 0, 0, 0, 0, 0, 0, 1, 0, 0], rl.q_eval.activate([0, 0, 0, 0, 0, 0, 0, 1, 0, 0]));
            // console.log([0, 0, 0, 0, 0, 0, 0, 0, 1, 0], rl.q_eval.activate([0, 0, 0, 0, 0, 0, 0, 0, 1, 0]));
            console.log([0, 0, 0, 0, 0, 0, 0, 0, 0, 1], rl.q_eval.activate([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));
            return { step, score };
        });
    }
}
exports.DQNLearner = DQNLearner;