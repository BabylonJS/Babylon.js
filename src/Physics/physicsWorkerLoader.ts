// https://github.com/webpack-contrib/worker-loader/issues/94
import './physicsWorker.d';
/*
declare module 'worker-loader!*' {
    class WebpackWorker extends Worker {
        constructor();
    }

    export = WebpackWorker;
}
*/
//import PhysicsWorker = require('worker-loader!./physicsWorker');
//import * as PhysicsWorker from "worker-loader!./physicsWorker";
import PhysicsWorker from "worker-loader!./physicsWorker";

export default PhysicsWorker;
