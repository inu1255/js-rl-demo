/**
 * Created Date: 2017-10-19 13:41:13
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 11:36:01
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const co = require("co");
const utils = require("../common/utils");
const fs = require("fs");
const _ = require("lodash");
const { Architect, Layer, Network } = require('synaptic');
const Learner = require("./Learner");

class DQNLearner extends Learner {
    build() {
        this.data = [];
        this.learn_step_counter = 0;
        let game = this.game;

        this.q_eval = this.config.buildNet(game.n_state, game.n_action);
        this.q_next = this.config.buildNet(game.n_state, game.n_action);
    }
    chooseAction(state, forbid) {
        if (Math.random() < this.config.e_greedy) {
            let action_score = this.q_eval.activate(state);
            // 禁止 forbid
            for (let item of forbid) {
                action_score[item] = -1;
            }
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
        return this.randIndex(this.game.n_action, forbid);
    }
    toJSON() {
        return {
            q_eval: this.q_eval.toJSON(),
            q_next: this.q_next.toJSON(),
        };
    }
    fromJSON(data) {
        this.q_eval = Network.fromJSON(data.q_eval);
        this.q_next = Network.fromJSON(data.q_next);
    }
    learn(state, action, score, stop, next_state) {
        // if (this.data.length > this.config.cache_size) {
        //     this.data.shift(Math.floor(Math.random() * this.data.length), 1);
        // }
        // this.data.push({ state, action, score, next_state });
        // for (let item of this.data) {
        let n = score > 0 ? 10 : 1;
        for (var i = 0; i < n; i++) {
            // let { state, action, score, next_state } = item;
            let q_next = this.q_next.activate(next_state);
            let q_eval = this.q_eval.activate(state);
            let max = _.max(q_next);
            q_eval[action] = score / 2 + this.config.reward_decay * max;
            // console.log(state.indexOf(1), action, score, q_eval);
            this.q_eval.propagate(this.config.learning_rate, q_eval);
        }
        this.count_and_replace();
    }
    count_and_replace() {
        this.learn_step_counter++;
        if (this.learn_step_counter % this.config.replace_target_iter == 0) {
            this.q_next = Network.fromJSON(this.q_eval.toJSON());
        }
    }
}

DQNLearner.config = {
    e_greedy: 0.9, // 策略采纳率
    cache_size: 1, // 缓存学习数据
    replace_target_iter: 30, // 覆盖q_next前学习多少次
    learning_rate: 0.01, // 学习效率
    reward_decay: 0.5, // 策略激进性
    buildNet: function(input, output) {
        const inputLayer = new Layer(input); // 输入状态
        const hiddenLayer = new Layer(100);
        const outputLayer = new Layer(output); // 行动得分

        inputLayer.project(hiddenLayer);
        hiddenLayer.project(outputLayer);

        return new Network({
            input: inputLayer,
            hidden: [hiddenLayer],
            output: outputLayer
        });
    }
};

module.exports = DQNLearner;