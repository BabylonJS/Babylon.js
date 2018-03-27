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

    export class AnimationMultiTarget {
        public subTargets = new Array<any>();

        public set position(value: Vector3) {
            for (const subTarget of this.subTargets) {
                subTarget.position = value;
            }
        }

        public set rotationQuaternion(value: Quaternion) {
            for (const subTarget of this.subTargets) {
                subTarget.rotationQuaternion = value;
            }
        }

        public set scaling(value: Vector3) {
            for (const subTarget of this.subTargets) {
                subTarget.scaling = value;
            }
        }

        public set influence(value: number) {
            for (const subTarget of this.subTargets) {
                subTarget.influence = value;
            }
        }
    }
}