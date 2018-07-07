module BABYLON.GUI {
    /**
     * Defines the interface used storage information atlas texture
     */
    export interface IAtlasSourceData {
        frame: any,
        pivot: any,
        rotated: boolean,
        sourceSize: any,
        spriteSourceSize: any,
        trimmed: boolean,
    }

    /**
     * The class used for source's GUI.Image
     */
    export class AtlasSourceImage {
        constructor(public name: string, public source: HTMLImageElement, public data: IAtlasSourceData) {
        }

        public get x(): number {
            return this.data.frame.x;
        }

        public get y(): number {
            return this.data.frame.y;
        }

        public get w(): number {
            return this.data.frame.w;
        }

        public get h(): number {
            return this.data.frame.h;
        }
    }
}