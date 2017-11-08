/**
 * Created Date: 2017-10-19 14:36:43
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-20 11:28:50
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
class Game {
    forbid(){
        // 禁止的action
        return [];
    }
    begin() {
        console.log(this.constructor.name, "begin需要实现");
    }
    isEnd() {
        console.log(this.constructor.name, "isEnd需要实现");
    }
    getState() {
        console.log(this.constructor.name, "getState需要实现");
    }
    play() {
        console.log(this.constructor.name, "play需要实现");
    }
}