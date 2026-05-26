import { describe, expect, it } from "vitest";

import { UpdateConfiguration } from "../../src/animationConfiguration";

describe("UpdateConfiguration compatibility", () => {
    it("uses spec compatibility by default", () => {
        const configuration = UpdateConfiguration({}, 4096, 1);

        expect(configuration.compatibility).toEqual({
            textLayerPlacement: "spec",
            solidLayerRendering: "spec",
        });
    });

    it("allows text layer compatibility to be configured independently", () => {
        const configuration = UpdateConfiguration({ compatibility: { textLayerPlacement: "babylon8" } }, 4096, 1);

        expect(configuration.compatibility).toEqual({
            textLayerPlacement: "babylon8",
            solidLayerRendering: "spec",
        });
    });

    it("allows solid layer compatibility to be configured independently", () => {
        const configuration = UpdateConfiguration({ compatibility: { solidLayerRendering: "babylon8" } }, 4096, 1);

        expect(configuration.compatibility).toEqual({
            textLayerPlacement: "spec",
            solidLayerRendering: "babylon8",
        });
    });

    it("uses defaults when compatibility options are explicitly undefined", () => {
        const configuration = UpdateConfiguration({ compatibility: { textLayerPlacement: undefined, solidLayerRendering: undefined } }, 4096, 1);

        expect(configuration.compatibility).toEqual({
            textLayerPlacement: "spec",
            solidLayerRendering: "spec",
        });
    });
});
