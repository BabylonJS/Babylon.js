// Copyright (c) Microsoft Corporation.
// MIT License

import { Clamp } from "core/Maths/math.scalar.functions";
import type { IColor4Like } from "core/Maths/math.like";

const MakeTempColor4Like = (): IColor4Like => {
    return {
        r: Number.NaN,
        g: Number.NaN,
        b: Number.NaN,
        a: Number.NaN,
    };
};

const TmpColor1 = MakeTempColor4Like();
const TmpColor2 = MakeTempColor4Like();
const TmpColor3 = MakeTempColor4Like();
const TmpColor4 = MakeTempColor4Like();

/**
 * Samples the texture data at the given uv coordinate using bilinear interpolation.
 * Note this will not match GPU sampling behavior exactly.
 * Currently assumes clamping behavior.
 * @param u - The u coordinate to sample.
 * @param v - The v coordinate to sample.
 * @param widthPx - The width of the texture in texels.
 * @param heightPx - The height of the texture in texels.
 * @param data - The texture data to sample.
 * @param result - The color to store the sample.
 * @param normalizeFunc - The function to normalize the texel values. Default is to divide by 255.
 * @returns The result color.
 */
export function Sample2DRgbaToRef<T extends IColor4Like>(
    u: number,
    v: number,
    widthPx: number,
    heightPx: number,
    data: Uint8Array | Uint16Array | Float32Array,
    result: T,
    normalizeFunc = (value: number) => value / 255.0
): T {
    if (widthPx <= 0 || heightPx <= 0) {
        throw new Error("Sample2DRgbaToRef: widthPx and heightPx must be positive.");
    }

    const expectedLength = widthPx * heightPx * 4;
    if (data.length < expectedLength) {
        throw new Error(`Sample2DRgbaToRef: data length (${data.length}) is less than required (${expectedLength}).`);
    }

    // Default to clamping behavior, but could support others.
    u = Clamp(u);
    v = Clamp(v);

    // Compute 4 nearest neighbor texels.
    const fractionalTexelX = Math.max(u * widthPx - 0.5, 0);
    const fractionalTexelY = Math.max(v * heightPx - 0.5, 0);
    const xLeft = Math.floor(fractionalTexelX);
    const xRight = Math.min(xLeft + 1, widthPx - 1);
    const yBottom = Math.floor(fractionalTexelY);
    const yTop = Math.min(yBottom + 1, heightPx - 1);

    // Sample nearest neighbor texels.
    const lowerLeftColor = TexelFetch2DRgbaToRef(xLeft, yBottom, widthPx, heightPx, data, TmpColor1, normalizeFunc);
    const upperLeftColor = TexelFetch2DRgbaToRef(xLeft, yTop, widthPx, heightPx, data, TmpColor2, normalizeFunc);
    const lowerRightColor = TexelFetch2DRgbaToRef(xRight, yBottom, widthPx, heightPx, data, TmpColor3, normalizeFunc);
    const upperRightColor = TexelFetch2DRgbaToRef(xRight, yTop, widthPx, heightPx, data, TmpColor4, normalizeFunc);

    // Compute weights.
    const tX = fractionalTexelX - xLeft;
    const tY = fractionalTexelY - yBottom;
    const oneMinusTX = 1.0 - tX;
    const oneMinusTY = 1.0 - tY;
    const w0 = oneMinusTX * oneMinusTY;
    const w1 = tX * oneMinusTY;
    const w2 = oneMinusTX * tY;
    const w3 = tX * tY;

    // Compute the result.
    result.r = lowerLeftColor.r * w0 + lowerRightColor.r * w1 + upperLeftColor.r * w2 + upperRightColor.r * w3;
    result.g = lowerLeftColor.g * w0 + lowerRightColor.g * w1 + upperLeftColor.g * w2 + upperRightColor.g * w3;
    result.b = lowerLeftColor.b * w0 + lowerRightColor.b * w1 + upperLeftColor.b * w2 + upperRightColor.b * w3;
    result.a = lowerLeftColor.a * w0 + lowerRightColor.a * w1 + upperLeftColor.a * w2 + upperRightColor.a * w3;
    return result;
}

/**
 * Fetches a texel from a 2D texture and stores the result in the given color.
 * @param x - The x coordinate in texels.
 * @param y - The y coordinate in texels.
 * @param width - The width of the texture in texels.
 * @param height - The height of the texture in texels.
 * @param data - The texture data to sample from.
 * @param result - The color to store the sampled color in.
 * @param normalizeFunc - The function to normalize the texel values. Default is to divide by 255.
 * @returns The result color.
 */
const TexelFetch2DRgbaToRef = <T extends IColor4Like>(
    x: number,
    y: number,
    width: number,
    height: number,
    data: Uint8Array | Uint16Array | Float32Array,
    result: T,
    normalizeFunc = (value: number) => value / 255.0
): T => {
    const clampedTexelX = Clamp(x, 0, width - 1);
    const clampedTexelY = Clamp(y, 0, height - 1);
    const index = 4 * (clampedTexelY * width + clampedTexelX);
    result.r = normalizeFunc(data[index]);
    result.g = normalizeFunc(data[index + 1]);
    result.b = normalizeFunc(data[index + 2]);
    result.a = normalizeFunc(data[index + 3]);
    return result;
};
