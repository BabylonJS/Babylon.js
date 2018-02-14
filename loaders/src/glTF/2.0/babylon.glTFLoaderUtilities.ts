/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export interface TypedArray extends ArrayBufferView {
        [index: number]: number;
    }

    export interface IArrayItem {
        _index: number;
    }

    export class ArrayItem {
        public static Assign(values?: IArrayItem[]): void {
            if (values) {
                for (let index = 0; index < values.length; index++) {
                    values[index]._index = index;
                }
            }
        }
    }
}