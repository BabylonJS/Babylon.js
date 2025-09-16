// Copyright (c) Microsoft Corporation.
// MIT License

import { Sample2DRgbaToRef } from "../../sampling";
import type { IColor4Like } from "core/Maths/math.like";

const Black = { r: 0, g: 0, b: 0, a: 1.0 };
const DarkGrey = { r: 0.25, g: 0.25, b: 0.25, a: 1.0 };
const Grey = { r: 0.5, g: 0.5, b: 0.5, a: 1.0 };
const White = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
const Red = { r: 1.0, g: 0.0, b: 0.0, a: 1.0 };
const Green = { r: 0.0, g: 1.0, b: 0.0, a: 1.0 };
const Blue = { r: 0.0, g: 0.0, b: 1.0, a: 1.0 };

expect.extend({
    toBeApproxColor4Like(received: IColor4Like, expected: IColor4Like) {
        const isEqual =
            Math.abs(received.r - expected.r) < 0.0001 &&
            Math.abs(received.g - expected.g) < 0.0001 &&
            Math.abs(received.b - expected.b) < 0.0001 &&
            Math.abs(received.a - expected.a) < 0.0001;
        return {
            message: () => `expected ${JSON.stringify(received)} to be close to ${JSON.stringify(expected)}`,
            pass: isEqual,
        };
    },
});

describe("textureSampler", () => {
    test("testVertical2x2", () => {
        const testData2x2 = new Float32Array([Black, Black, White, White].flatMap((x) => [x.r, x.g, x.b, x.a]));

        const result = { r: 0, g: 0, b: 0, a: 0 };
        Sample2DRgbaToRef(0.0, 0.0, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Black);

        Sample2DRgbaToRef(1.0, 0.25, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Black);

        Sample2DRgbaToRef(1.0, 0.375, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(DarkGrey);

        Sample2DRgbaToRef(1.0, 0.5, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Grey);

        Sample2DRgbaToRef(0.5, 0.5, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Grey);

        Sample2DRgbaToRef(1.0, 1.0, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(White);
    });
    test("testVertical3x3", () => {
        const testData2x2 = new Float32Array([Black, Black, White, White, White, White, White, White, White].flatMap((x) => [x.r, x.g, x.b, x.a]));

        const result = { r: 0, g: 0, b: 0, a: 0 };
        Sample2DRgbaToRef(0.33333333333, 0.33333333333, 3, 3, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Grey);
    });
    test("testHorizontal2x2", () => {
        const testData2x2 = new Float32Array([Black, White, Black, White].flatMap((x) => [x.r, x.g, x.b, x.a]));

        const result = { r: 0, g: 0, b: 0, a: 0 };
        Sample2DRgbaToRef(0.0, 0.0, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Black);

        Sample2DRgbaToRef(0.5, 1.0, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Grey);

        Sample2DRgbaToRef(0.5, 0.5, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(Grey);

        Sample2DRgbaToRef(1.0, 1.0, 2, 2, testData2x2, result, (value) => value);
        (expect(result) as any).toBeApproxColor4Like(White);
    });
    test("testDistinct2x2", () => {
        const data = new Float32Array([Red, Green, Blue, White].flatMap((x) => [x.r, x.g, x.b, x.a]));

        const result = { r: 0, g: 0, b: 0, a: 0 };
        Sample2DRgbaToRef(0.25, 0.25, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 1.0, g: 0.0, b: 0.0, a: 1 });

        Sample2DRgbaToRef(0.25, 0.75, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 0.0, g: 0.0, b: 1.0, a: 1 });

        Sample2DRgbaToRef(0.75, 0.25, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 0.0, g: 1.0, b: 0.0, a: 1 });

        Sample2DRgbaToRef(0.75, 0.75, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 1.0, g: 1.0, b: 1.0, a: 1 });

        Sample2DRgbaToRef(0.5, 0.5, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 0.5, g: 0.5, b: 0.5, a: 1 });

        Sample2DRgbaToRef(0.5, 0.0, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 0.5, g: 0.5, b: 0.0, a: 1 });

        Sample2DRgbaToRef(0.0, 0.5, 2, 2, data, result, (v) => v);
        (expect(result) as any).toBeApproxColor4Like({ r: 0.5, g: 0.0, b: 0.5, a: 1 });
    });
});
