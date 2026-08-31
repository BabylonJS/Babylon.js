import { describe, expect, it, vi, type Mock } from "vitest";
import { type Effect } from "../../../src/Materials/effect.pure";

// Regression coverage: constructing an ImageProcessingConfiguration must not pay the cost of building the white
// balance matrix (Planckian-locus lookup + Bradford adaptation) unless white balance is actually enabled and
// bound at least once, since every configuration (per scene, per material, per post process) pays this cost
// otherwise, even when white balance is never touched.

vi.mock("../../../src/Maths/colorTemperature.functions", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../src/Maths/colorTemperature.functions")>();
    return {
        ...actual,
        GetWhiteBalanceMatrix: vi.fn(actual.GetWhiteBalanceMatrix),
    };
});

function createFakeEffect(): Effect {
    return {
        setMatrix3x3() {},
        setFloat() {},
        setFloat2() {},
        setFloat4() {},
        setTexture() {},
        getEngine() {
            return { getRenderWidth: () => 100, getRenderHeight: () => 100 };
        },
    } as unknown as Effect;
}

describe("ImageProcessingConfiguration white balance laziness", () => {
    it("does not construct the white balance matrix until it is enabled and bound", async () => {
        const { GetWhiteBalanceMatrix } = await import("../../../src/Maths/colorTemperature.functions");
        const { ImageProcessingConfiguration } = await import("../../../src/Materials/imageProcessingConfiguration.pure");
        const mockFn = GetWhiteBalanceMatrix as unknown as Mock;
        mockFn.mockClear();

        const configuration = new ImageProcessingConfiguration();
        expect(mockFn).not.toHaveBeenCalled();

        const effect = createFakeEffect();
        configuration.bind(effect);
        expect(mockFn).not.toHaveBeenCalled();

        configuration.whiteBalanceEnabled = true;
        configuration.bind(effect);
        expect(mockFn).toHaveBeenCalledTimes(1);

        // Binding again with unchanged temperature/tint must not recompute.
        configuration.bind(effect);
        expect(mockFn).toHaveBeenCalledTimes(1);

        // Changing temperature must trigger exactly one recomputation on the next bind.
        configuration.temperature = 3000;
        configuration.bind(effect);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });
});
