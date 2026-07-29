import { describe, expect, it } from "vitest";

import { GetSafeFrameRate, WrapLoopFrame } from "../../src/rendering/animationController";

describe("GetSafeFrameRate", () => {
    it("keeps a positive finite frame rate", () => {
        expect(GetSafeFrameRate(60)).toBe(60);
        expect(GetSafeFrameRate(23.976)).toBe(23.976);
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("falls back to 30 for malformed rate %s", (frameRate) => {
        expect(GetSafeFrameRate(frameRate)).toBe(30);
    });
});

describe("WrapLoopFrame", () => {
    it("wraps into the inclusive-start/exclusive-end range", () => {
        expect(WrapLoopFrame(60, 0, 60)).toBe(0);
        expect(WrapLoopFrame(75, 10, 70)).toBe(15);
    });

    it("falls back to the start frame for an empty or reversed range", () => {
        expect(WrapLoopFrame(10, 10, 10)).toBe(10);
        expect(WrapLoopFrame(20, 10, 5)).toBe(10);
    });
});
