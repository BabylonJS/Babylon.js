import { describe, expect, it } from "vitest";
// Registers the ColorCurves parser used by SerializationHelper.Parse for ImageProcessingConfiguration's
// `colorCurves` field; without this side-effect import, Parse throws before reaching our own properties.
import "../../../src/Materials/colorCurves";
import { ImageProcessingConfiguration } from "../../../src/Materials/imageProcessingConfiguration.pure";
import { GetWhiteBalanceMatrix } from "../../../src/Maths/colorTemperature.functions";
import { SerializationHelper } from "../../../src/Misc/decorators.serialization";
import { type Effect } from "../../../src/Materials/effect.pure";

// Regression coverage for a bug where SerializationHelper.Clone/Parse assign the serialized `_temperature`/
// `_tint` backing fields directly (bypassing the `temperature`/`tint` setters), leaving the cached white balance
// matrix computed from the previous (or default) values instead of the deserialized ones.

/**
 * Creates a minimal fake `Effect` that only records the matrix passed to `setMatrix3x3`.
 * @returns the fake effect and a getter for whatever matrix was last captured
 */
function createFakeEffectCapturingMatrix() {
    let capturedMatrix: Float32Array | number[] | undefined;
    const effect = {
        setMatrix3x3(_name: string, matrix: Float32Array | number[]) {
            capturedMatrix = matrix;
        },
        setFloat() {},
        setFloat2() {},
        setFloat4() {},
        setTexture() {},
        getEngine() {
            return { getRenderWidth: () => 100, getRenderHeight: () => 100 };
        },
    } as unknown as Effect;
    return { effect, getCapturedMatrix: () => capturedMatrix };
}

describe("ImageProcessingConfiguration white balance clone/parse", () => {
    it("recomputes the white balance matrix after clone()", () => {
        const source = new ImageProcessingConfiguration();
        source.whiteBalanceEnabled = true;
        source.temperature = 3000;
        source.tint = 20;

        const cloned = source.clone();

        const { effect, getCapturedMatrix } = createFakeEffectCapturingMatrix();
        cloned.bind(effect);

        const expected = GetWhiteBalanceMatrix(3000, 20);
        const actual = getCapturedMatrix();
        expect(actual).toBeDefined();
        for (let i = 0; i < 9; i++) {
            expect(actual![i]).toBeCloseTo(expected[i], 5);
        }
    });

    it("recomputes the white balance matrix after SerializationHelper.Parse", () => {
        const source = new ImageProcessingConfiguration();
        source.whiteBalanceEnabled = true;
        source.temperature = 7500;
        source.tint = -40;

        const serialized = SerializationHelper.Serialize(source);
        const parsed = SerializationHelper.Parse(() => new ImageProcessingConfiguration(), serialized, null);

        const { effect, getCapturedMatrix } = createFakeEffectCapturingMatrix();
        parsed.bind(effect);

        const expected = GetWhiteBalanceMatrix(7500, -40);
        const actual = getCapturedMatrix();
        expect(actual).toBeDefined();
        for (let i = 0; i < 9; i++) {
            expect(actual![i]).toBeCloseTo(expected[i], 5);
        }
    });
});
