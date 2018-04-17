/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /** @hidden */
    export interface _IArrayItem {
        _index: number;
    }

    /** @hidden */
    export class _ArrayItem {
        /** @hidden */
        public static Assign(values?: _IArrayItem[]): void {
            if (values) {
                for (let index = 0; index < values.length; index++) {
                    values[index]._index = index;
                }
            }
        }
    }
}