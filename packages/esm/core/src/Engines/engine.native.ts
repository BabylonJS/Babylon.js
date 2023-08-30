import type { ICanvas, IImage } from "core/Engines/ICanvas";
import type { INative } from "core/Engines/Native/nativeInterfaces";

// the global native environment injected here
declare const _native: INative;

// TODO is this going to work as expected? side effects?
export const AcquireNativeObjectAsync = new Promise<INative>((resolve, reject) => {
    if (typeof _native !== "undefined") {
        resolve(_native);
    } else if (typeof self !== "undefined" && !Object.prototype.hasOwnProperty.call(self, "_native")) {
        let __native: INative;
        Object.defineProperty(self, "_native", {
            get: () => __native,
            set: (value: INative) => {
                if (__native) {
                    // cannot redefine the __native variable. fail silently
                    return;
                }
                __native = value;
                if (__native) {
                    resolve(__native);
                } else {
                    reject(new Error("Native object is null"));
                }
            },
        });
    } else {
        reject(new Error("Native object is null"));
    }
});

export function createCanvas(width: number, height: number): ICanvas {
    if (!_native.Canvas) {
        throw new Error("Native Canvas plugin not available.");
    }
    const canvas = new _native.Canvas();
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export function createCanvasImage(): IImage {
    if (!_native.Canvas) {
        throw new Error("Native Canvas plugin not available.");
    }
    const image = new _native.Image();
    return image;
}
