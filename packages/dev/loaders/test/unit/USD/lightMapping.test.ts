import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer } from "loaders/USD/resolution/sdf";

describe("USD light mapping", () => {
    it("maps supported UsdLux lights into resolved light prims", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/lights.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "World",
                    path: "/World",
                    specifier: "def",
                    typeName: "Xform",
                    properties: {},
                    children: [
                        {
                            name: "Sun",
                            path: "/World/Sun",
                            specifier: "def",
                            typeName: "DistantLight",
                            properties: {
                                "inputs:color": { kind: "attribute", typeName: "color3f", default: { type: "color3f", value: [0.25, 0.5, 0.75] } },
                                "inputs:intensity": { kind: "attribute", typeName: "float", default: { type: "float", value: 3 } },
                                "inputs:exposure": { kind: "attribute", typeName: "float", default: { type: "float", value: 2 } },
                                "inputs:angle": { kind: "attribute", typeName: "float", default: { type: "float", value: 0.5 } },
                            },
                            children: [],
                        },
                        {
                            name: "Portal",
                            path: "/World/Portal",
                            specifier: "def",
                            typeName: "RectLight",
                            properties: {
                                "inputs:width": { kind: "attribute", typeName: "float", default: { type: "float", value: 2 } },
                                "inputs:height": { kind: "attribute", typeName: "float", default: { type: "float", value: 3 } },
                                "inputs:normalize": { kind: "attribute", typeName: "bool", default: { type: "bool", value: true } },
                            },
                            children: [],
                        },
                        {
                            name: "Sky",
                            path: "/World/Sky",
                            specifier: "def",
                            typeName: "DomeLight",
                            properties: {
                                "inputs:texture:file": { kind: "attribute", typeName: "asset", default: { type: "asset", value: { authoredPath: "./textures/sky.exr" } } },
                            },
                            children: [],
                        },
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const world = stage.root.children[0];
        const sun = world.children[0];
        const portal = world.children[1];
        const sky = world.children[2];

        expect(sun.kind).toBe("light");
        expect(sun.light).toEqual({
            kind: "distant",
            color: [0.25, 0.5, 0.75],
            intensity: 3,
            exposure: 2,
            angle: 0.5,
        });
        expect(portal.light).toMatchObject({ kind: "rect", color: [1, 1, 1], intensity: 1, exposure: 0, width: 2, height: 3, normalize: true });
        expect(sky.light?.domeTexture).toMatchObject({ uri: "/Scenes/textures/sky.exr", uvSet: 0, wrapU: "repeat", wrapV: "repeat", colorSpace: "sRGB" });
        // Area and dome lights are approximated by the direct Babylon adapter and now report honest,
        // non-fatal fidelity diagnostics; the faithful DistantLight mapping stays silent.
        expect(stage.diagnostics).toHaveLength(2);
        expect(stage.diagnostics[0]).toMatchObject({ severity: "info", path: "/World/Portal", message: expect.stringMatching(/point light/i) });
        expect(stage.diagnostics[1]).toMatchObject({ severity: "info", path: "/World/Sky", message: expect.stringMatching(/hemispheric/i) });
    });
});
