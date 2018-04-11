/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /** @ignore */
    export interface _IArrayItem {
        _index: number;
    }

    /** @ignore */
    export class _ArrayItem {
        /** @ignore */
        public static Assign(values?: _IArrayItem[]): void {
            if (values) {
                for (let index = 0; index < values.length; index++) {
                    values[index]._index = index;
                }
            }
        }
    }
}