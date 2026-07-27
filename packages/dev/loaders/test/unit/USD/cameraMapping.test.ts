import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer } from "loaders/USD/resolution/sdf";

describe("USD camera mapping", () => {
    it("maps UsdGeomCamera attributes into a resolved camera prim", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/camera.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "Camera",
                    path: "/Camera",
                    specifier: "def",
                    typeName: "Camera",
                    properties: {
                        projection: { kind: "attribute", typeName: "token", default: { type: "token", value: "orthographic" } },
                        focalLength: { kind: "attribute", typeName: "float", default: { type: "float", value: 35 } },
                        horizontalAperture: { kind: "attribute", typeName: "float", default: { type: "float", value: 24 } },
                        verticalAperture: { kind: "attribute", typeName: "float", default: { type: "float", value: 18 } },
                        clippingRange: { kind: "attribute", typeName: "vec2f", default: { type: "vec2f", value: [0.5, 250] } },
                        fStop: { kind: "attribute", typeName: "float", default: { type: "float", value: 5.6 } },
                        focusDistance: { kind: "attribute", typeName: "float", default: { type: "float", value: 12 } },
                    },
                    children: [],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const camera = stage.root.children[0];

        expect(camera.kind).toBe("camera");
        expect(camera.camera).toEqual({
            projection: "orthographic",
            focalLength: 35,
            horizontalAperture: 24,
            verticalAperture: 18,
            clippingRange: [0.5, 250],
            fStop: 5.6,
            focusDistance: 12,
        });
        expect(stage.diagnostics).toEqual([
            {
                severity: "info",
                path: "/Camera",
                message: "Camera depth-of-field settings are preserved in IResolvedCamera but are not applied by the direct Babylon adapter.",
            },
        ]);
    });

    it("uses UsdGeomCamera defaults for omitted attributes", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/defaultCamera.usda",
            subLayers: [],
            rootPrims: [{ name: "Camera", path: "/Camera", specifier: "def", typeName: "Camera", properties: {}, children: [] }],
        };

        const stage = MapLayerToResolvedStage(layer);

        expect(stage.root.children[0].camera).toMatchObject({
            projection: "perspective",
            focalLength: 50,
            horizontalAperture: 20.955,
            verticalAperture: 15.2908,
            clippingRange: [1, 1000000],
        });
    });
});
