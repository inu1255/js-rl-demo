/**
 * Created Date: 2017-10-19 13:42:47
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 13:10:04
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const co = require("co");
const utils = require("../common/utils");
const path = require("path");

const max_word_length = 14;

function Guess() {
    var state = this;
    this.name = "guessword";
    this.begin = function() {
        return co(function*() {
            let word = yield Guess.pickOne();
            console.log(word);
            state.words = word.toLowerCase();
            state.last = new Array(state.words.length).fill("*");
            state.asterisk = state.words.length;
            state.guessed = [];
        });
    };
    this.forbid = function() {
        return state.guessed;
    };
    // action : Array[1x26]
    this.play = function(action) {
        state.guessed.push(action);
        action = String.fromCharCode(action + 97);
        let score = 0;
        // console.log(guess.words, guess.last, guess.asterisk)
        for (let i = 0; i < state.last.length; i++) {
            if (state.words[i] === action) {
                if (state.last[i] != action) {
                    state.last[i] = action;
                    state.asterisk--;
                    score = 1;
                }
            }
        }
        // console.log("guess", action, score ? "1" : "");
        return score;
    };
    this.getState = function() {
        // let condition = new Array(26).fill(0);
        // for (var i = 0; i < state.last.length; i++) {
        //     var word = state.last[i];
        //     if (word != "*") {
        //         condition[word.charCodeAt(0) - 97] = 1;
        //     }
        // }
        // return condition;
        let condition = [];
        for (let i = 0; i < max_word_length; i++) {
            if (i >= state.last.length) {
                let tmp = new Array(27).fill(0);
                tmp[26] = 1;
                condition = condition.concat(tmp);
            } else if (state.last[i] == "*") {
                condition = condition.concat(new Array(27).fill(0));
            } else {
                let tmp = new Array(27).fill(0);
                tmp[state.last[i].charCodeAt(0) - 97] = 1;
                condition = condition.concat(tmp);
            }
        }
        return condition;
    };
    this.isEnd = function() {
        return !state.asterisk;
    };
    this.n_state = 27 * max_word_length;
    this.n_action = 26;
}

Guess.pickOne = function() {
    return co(function*() {
        if (!Guess.WORDS) {
            Guess.WORDS = yield utils.readJson(path.join(__dirname, "guess-word.json"));
            // let max = 0;
            // for (let word of Guess.WORDS) {
            //     max = max > word.length ? max : word.length;
            // }
            // console.log(max);
            // process.exit();
        }
        let index = Math.floor(Math.random() * Guess.WORDS.length);
        return Guess.WORDS[index];
    });
};

module.exports = Guess;