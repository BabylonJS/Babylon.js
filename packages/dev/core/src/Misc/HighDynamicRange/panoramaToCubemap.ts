/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../../types";
import { Vector3 } from "../../Maths/math.vector";
import { Constants } from "../../Engines/constants";

/**
 * CubeMap information grouping all the data for each faces as well as the cubemap size.
 */
export interface CubeMapInfo {
    /**
     * The pixel array for the front face.
     * This is stored in format, left to right, up to down format.
     */
    front: Nullable<ArrayBufferView>;

    /**
     * The pixel array for the back face.
     * This is stored in format, left to right, up to down format.
     */
    back: Nullable<ArrayBufferView>;

    /**
     * The pixel array for the left face.
     * This is stored in format, left to right, up to down format.
     */
    left: Nullable<ArrayBufferView>;

    /**
     * The pixel array for the right face.
     * This is stored in format, left to right, up to down format.
     */
    right: Nullable<ArrayBufferView>;

    /**
     * The pixel array for the up face.
     * This is stored in format, left to right, up to down format.
     */
    up: Nullable<ArrayBufferView>;

    /**
     * The pixel array for the down face.
     * This is stored in format, left to right, up to down format.
     */
    down: Nullable<ArrayBufferView>;

    /**
     * The size of the cubemap stored.
     *
     * Each faces will be size * size pixels.
     */
    size: number;

    /**
     * The format of the texture.
     *
     * RGBA, RGB.
     */
    format: number;

    /**
     * The type of the texture data.
     *
     * UNSIGNED_INT, FLOAT.
     */
    type: number;

    /**
     * Specifies whether the texture is in gamma space.
     */
    gammaSpace: boolean;
}

/**
 * Helper class useful to convert panorama picture to their cubemap representation in 6 faces.
 */
export class PanoramaToCubeMapTools {
    private static FACE_LEFT = [new Vector3(-1.0, -1.0, -1.0), new Vector3(1.0, -1.0, -1.0), new Vector3(-1.0, 1.0, -1.0), new Vector3(1.0, 1.0, -1.0)];
    private static FACE_RIGHT = [new Vector3(1.0, -1.0, 1.0), new Vector3(-1.0, -1.0, 1.0), new Vector3(1.0, 1.0, 1.0), new Vector3(-1.0, 1.0, 1.0)];
    private static FACE_FRONT = [new Vector3(1.0, -1.0, -1.0), new Vector3(1.0, -1.0, 1.0), new Vector3(1.0, 1.0, -1.0), new Vector3(1.0, 1.0, 1.0)];
    private static FACE_BACK = [new Vector3(-1.0, -1.0, 1.0), new Vector3(-1.0, -1.0, -1.0), new Vector3(-1.0, 1.0, 1.0), new Vector3(-1.0, 1.0, -1.0)];
    private static FACE_DOWN = [new Vector3(1.0, 1.0, -1.0), new Vector3(1.0, 1.0, 1.0), new Vector3(-1.0, 1.0, -1.0), new Vector3(-1.0, 1.0, 1.0)];
    private static FACE_UP = [new Vector3(-1.0, -1.0, -1.0), new Vector3(-1.0, -1.0, 1.0), new Vector3(1.0, -1.0, -1.0), new Vector3(1.0, -1.0, 1.0)];

    /**
     * Converts a panorama stored in RGB right to left up to down format into a cubemap (6 faces).
     *
     * @param float32Array The source data.
     * @param inputWidth The width of the input panorama.
     * @param inputHeight The height of the input panorama.
     * @param size The willing size of the generated cubemap (each faces will be size * size pixels)
     * @param supersample enable supersampling the cubemap
     * @returns The cubemap data
     */
    public static ConvertPanoramaToCubemap(float32Array: Float32Array, inputWidth: number, inputHeight: number, size: number, supersample = false): CubeMapInfo {
        if (!float32Array) {
            // eslint-disable-next-line no-throw-literal
            throw "ConvertPanoramaToCubemap: input cannot be null";
        }

        if (float32Array.length != inputWidth * inputHeight * 3) {
            // eslint-disable-next-line no-throw-literal
            throw "ConvertPanoramaToCubemap: input size is wrong";
        }

        const textureFront = this.CreateCubemapTexture(size, this.FACE_FRONT, float32Array, inputWidth, inputHeight, supersample);
        const textureBack = this.CreateCubemapTexture(size, this.FACE_BACK, float32Array, inputWidth, inputHeight, supersample);
        const textureLeft = this.CreateCubemapTexture(size, this.FACE_LEFT, float32Array, inputWidth, inputHeight, supersample);
        const textureRight = this.CreateCubemapTexture(size, this.FACE_RIGHT, float32Array, inputWidth, inputHeight, supersample);
        const textureUp = this.CreateCubemapTexture(size, this.FACE_UP, float32Array, inputWidth, inputHeight, supersample);
        const textureDown = this.CreateCubemapTexture(size, this.FACE_DOWN, float32Array, inputWidth, inputHeight, supersample);

        return {
            front: textureFront,
            back: textureBack,
            left: textureLeft,
            right: textureRight,
            up: textureUp,
            down: textureDown,
            size: size,
            type: Constants.TEXTURETYPE_FLOAT,
            format: Constants.TEXTUREFORMAT_RGB,
            gammaSpace: false,
        };
    }

    private static CreateCubemapTexture(texSize: number, faceData: Vector3[], float32Array: Float32Array, inputWidth: number, inputHeight: number, supersample = false) {
        const buffer = new ArrayBuffer(texSize * texSize * 4 * 3);
        const textureArray = new Float32Array(buffer);

        // If supersampling, determine number of samples needed when source texture width is divided for 4 cube faces
        const samples = supersample ? Math.max(1, Math.round(inputWidth / 4 / texSize)) : 1;
        const sampleFactor = 1 / samples;
        const sampleFactorSqr = sampleFactor * sampleFactor;

        const rotDX1 = faceData[1].subtract(faceData[0]).scale(sampleFactor / texSize);
        const rotDX2 = faceData[3].subtract(faceData[2]).scale(sampleFactor / texSize);

        const dy = 1 / texSize;
        let fy = 0;

        for (let y = 0; y < texSize; y++) {
            for (let sy = 0; sy < samples; sy++) {
                let xv1 = faceData[0];
                let xv2 = faceData[2];

                for (let x = 0; x < texSize; x++) {
                    for (let sx = 0; sx < samples; sx++) {
                        const v = xv2.subtract(xv1).scale(fy).add(xv1);
                        v.normalize();

                        const color = this.CalcProjectionSpherical(v, float32Array, inputWidth, inputHeight);

                        // 3 channels per pixels
                        textureArray[y * texSize * 3 + x * 3 + 0] += color.r * sampleFactorSqr;
                        textureArray[y * texSize * 3 + x * 3 + 1] += color.g * sampleFactorSqr;
                        textureArray[y * texSize * 3 + x * 3 + 2] += color.b * sampleFactorSqr;

                        xv1 = xv1.add(rotDX1);
                        xv2 = xv2.add(rotDX2);
                    }
                }

                fy += dy * sampleFactor;
            }
        }

        return textureArray;
    }

    private static CalcProjectionSpherical(vDir: Vector3, float32Array: Float32Array, inputWidth: number, inputHeight: number): any {
        let theta = Math.atan2(vDir.z, vDir.x);
        const phi = Math.acos(vDir.y);

        while (theta < -Math.PI) {
            theta += 2 * Math.PI;
        }
        while (theta > Math.PI) {
            theta -= 2 * Math.PI;
        }

        let dx = theta / Math.PI;
        const dy = phi / Math.PI;

        // recenter.
        dx = dx * 0.5 + 0.5;

        let px = Math.round(dx * inputWidth);
        if (px < 0) {
            px = 0;
        } else if (px >= inputWidth) {
            px = inputWidth - 1;
        }

        let py = Math.round(dy * inputHeight);
        if (py < 0) {
            py = 0;
        } else if (py >= inputHeight) {
            py = inputHeight - 1;
        }

        const inputY = inputHeight - py - 1;
        const r = float32Array[inputY * inputWidth * 3 + px * 3 + 0];
        const g = float32Array[inputY * inputWidth * 3 + px * 3 + 1];
        const b = float32Array[inputY * inputWidth * 3 + px * 3 + 2];

        return {
            r: r,
            g: g,
            b: b,
        };
    }
}
