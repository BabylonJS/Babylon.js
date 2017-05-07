/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Measure {
        public constructor(public left: number, public top: number, public width: number, public height: number) {

        }

        public copyFrom(other: Measure): void {
            this.left = other.left;
            this.top = other.top;
            this.width = other.width;
            this.height = other.height;
        }

        public isEqualsTo(other: Measure): boolean {

            if (this.left !== other.left) {
                return false;
            }

            if (this.top !== other.top) {
                return false;
            }

            if (this.width !== other.width) {
                return false;
            }

            if (this.height !== other.height) {
                return false;
            }

            return true;
        }

        public static Empty(): Measure {
            return new Measure(0, 0, 0, 0);
        }
    }    
}