/**
 * Created Date: 2017-10-18 10:34:31
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-18 11:20:15
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const mnist = require('mnist');
const set = mnist.set(700, 20);

const trainingSet = set.training;
const testSet = set.test;

const { Layer, Network, Trainer } = require('synaptic');

const inputLayer = new Layer(784);
const hiddenLayer = new Layer(100);
const outputLayer = new Layer(10);

inputLayer.project(hiddenLayer);
hiddenLayer.project(outputLayer);

const myNetwork = new Network({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
});

const trainer = new Trainer(myNetwork);
trainer.train(trainingSet, {
    rate: .2,
    iterations: 10,
    error: .1,
    shuffle: true,
    log: 1,
    cost: Trainer.cost.MSE
});

console.log(myNetwork.activate(testSet[0].input));
console.log(testSet[0].output);