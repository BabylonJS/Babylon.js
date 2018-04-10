/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /** Array item which contains it's index in an array */
    export interface IArrayItem {
        _index: number;
    }
    /** Array item helper methods */
    export class ArrayItem {
        /** Sets the index of each array element to its index in the array */
        public static Assign(values?: IArrayItem[]): void {
            if (values) {
                for (let index = 0; index < values.length; index++) {
                    values[index]._index = index;
                }
            }
        }
    }
}