/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Vector3WithInfo extends Vector3 {        
        public constructor(source: Vector3, public buttonIndex: number = 0) {
            super(source.x, source.y, source.z);
        }
    }
}