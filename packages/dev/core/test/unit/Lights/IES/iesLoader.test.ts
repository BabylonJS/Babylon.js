import { describe, expect, it } from "vitest";

import { LoadIESData } from "core/Lights/IES/iesLoader";

function createIesData(version: string, secondAdditionalDataValue: string): Uint8Array {
    const source = `${version}
[TEST] Candela normalization regression
TILT=NONE
1 1000 2.5 4 1 1 2 0 0 0
0.75 ${secondAdditionalDataValue} 10
0 60 120 180
0
1 2 4 8`;

    return new TextEncoder().encode(source);
}

describe("LoadIESData", () => {
    it("normalizes a nontrivial legacy candela distribution linearly", () => {
        const textureData = LoadIESData(createIesData("IESNA91", "0.5"));

        expect([textureData.data[0], textureData.data[60], textureData.data[120]]).toEqual([0.125, 0.25, 0.5]);
    });

    it("does not change texture data based on the LM-63-2019 file generation type", () => {
        const computerSimulation = LoadIESData(createIesData("IES:LM-63-2019", "1.00010"));
        const accreditedLabInterpolatedAndScaled = LoadIESData(createIesData("IES:LM-63-2019", "1.11100"));

        expect(computerSimulation.data).toEqual(accreditedLabInterpolatedAndScaled.data);
    });
});
