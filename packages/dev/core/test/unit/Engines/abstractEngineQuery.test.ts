import { AbstractEngine } from "core/Engines/abstractEngine.pure";
import "core/Engines/AbstractEngine/abstractEngine.query";
import { type OcclusionQuery } from "core/Engines/AbstractEngine/abstractEngine.query.pure";
import { ThinEngine } from "core/Engines/thinEngine.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { describe, expect, it, vi } from "vitest";

describe("AbstractEngine occlusion query visibility", () => {
    const query = 0 as OcclusionQuery;

    it("is inherited by both WebGL and WebGPU engine abstractions", () => {
        expect(ThinEngine.prototype.isOcclusionQueryVisible).toBe(AbstractEngine.prototype.isOcclusionQueryVisible);
        expect(ThinWebGPUEngine.prototype.isOcclusionQueryVisible).toBe(AbstractEngine.prototype.isOcclusionQueryVisible);
    });

    it("normalizes a zero backend result to not visible", () => {
        const engine = Object.create(AbstractEngine.prototype) as AbstractEngine;
        engine.getQueryResult = vi.fn(() => 0);

        expect(engine.isOcclusionQueryVisible(query)).toBe(false);
        expect(engine.getQueryResult).toHaveBeenCalledWith(query);
    });

    it.each([1, 2, 42])("normalizes the backend result %i to visible", (result) => {
        const engine = Object.create(AbstractEngine.prototype) as AbstractEngine;
        engine.getQueryResult = vi.fn(() => result);

        expect(engine.isOcclusionQueryVisible(query)).toBe(true);
        expect(engine.getQueryResult(query)).toBe(result);
    });
});
