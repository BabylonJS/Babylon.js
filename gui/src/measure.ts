/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Measure {
        public constructor(public left: number, public top: number, public width: number, public height: number) {

        }

        public copy(): Measure {
            return new Measure(this.left, this.top,  this.width, this.height);
        }
    }    
}