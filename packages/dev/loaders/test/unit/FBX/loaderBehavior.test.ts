import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Mesh } from "core/Meshes/mesh";
import { LinesMesh } from "core/Meshes/linesMesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type ISceneLoaderProgressEvent } from "core/Loading/sceneLoader";
import { FBXFileLoader, type FBXLoaderWarning } from "loaders/FBX/fbxFileLoader";

const TRIANGLE = `Geometry: 1, "Geometry::Tri", "Mesh" {
        Vertices: *9 {
            a: 0,0,0,1,0,0,0,1,0
        }
        PolygonVertexIndex: *3 {
            a: 0,1,-3
        }
    }`;

// Two models sharing one geometry, a Line, a position constraint, a camera and a two-key clip starting at 1 s.
const PRESET_FBX = `; FBX 7.5.0 project file
Objects: {
    ${TRIANGLE}
    Model: 10, "Model::A", "Mesh" {
        Version: 232
    }
    Model: 11, "Model::B", "Mesh" {
        Version: 232
    }
    Geometry: 2, "Geometry::Wire", "Line" {
        Points: *6 {
            a: 0,0,0,1,0,0
        }
        PointsIndex: *2 {
            a: 0,-2
        }
    }
    Model: 12, "Model::Wire", "Line" {
        Version: 232
    }
    Model: 13, "Model::Target", "Null" {
        Properties70: {
            P: "Lcl Translation", "Lcl Translation", "", "A",10,0,0
        }
    }
    Constraint: 20, "Constraint::posC", "Position From Positions" {
        Type: "Position From Positions"
        Properties70: {
            P: "Active", "bool", "", "",1
            P: "Weight", "Number", "", "A",100
        }
    }
    Model: 14, "Model::Cam", "Camera" {
        Version: 232
    }
    NodeAttribute: 15, "NodeAttribute::Cam", "Camera" {
        TypeFlags: "Camera"
    }
    AnimationStack: 30, "AnimStack::Take", "" {
        Version: 232
    }
    AnimationLayer: 31, "AnimLayer::Base", "" {
        Version: 232
    }
    AnimationCurveNode: 32, "AnimCurveNode::T", "" {
        Version: 232
    }
    AnimationCurve: 33, "AnimCurve::X", "" {
        KeyTime: *2 {
            a: 46186158000,92372316000
        }
        KeyValueFloat: *2 {
            a: 0,5
        }
    }
}
Connections: {
    C: "OO", 1, 10
    C: "OO", 1, 11
    C: "OO", 10, 0
    C: "OO", 11, 0
    C: "OO", 2, 12
    C: "OO", 12, 0
    C: "OO", 13, 0
    C: "OP", 11, 20, "Constrained Object"
    C: "OP", 13, 20, "Source"
    C: "OO", 14, 0
    C: "OO", 15, 14
    C: "OO", 31, 30
    C: "OO", 32, 31
    C: "OP", 32, 10, "Lcl Translation"
    C: "OP", 33, 32, "d|X"
}`;

// Two LOD groups of three meshes: the first uses "use LOD", "show", "hide"; the second switches all three.
const LOD_FBX = `; FBX 7.5.0 project file
Objects: {
    ${TRIANGLE}
    Model: 40, "Model::Group1", "LodGroup" {
        Version: 232
    }
    NodeAttribute: 41, "NodeAttribute::Group1", "LodGroup" {
        Properties70: {
            P: "Thresholds|Level0", "Distance", "", "",10
            P: "Thresholds|Level1", "Distance", "", "",20
            P: "DisplayLevels|Level0", "enum", "", "",0
            P: "DisplayLevels|Level1", "enum", "", "",1
            P: "DisplayLevels|Level2", "enum", "", "",2
        }
    }
    Model: 42, "Model::L0", "Mesh" {
        Version: 232
    }
    Model: 43, "Model::L1", "Mesh" {
        Version: 232
    }
    Model: 44, "Model::L2", "Mesh" {
        Version: 232
    }
    Model: 50, "Model::Group2", "LodGroup" {
        Version: 232
    }
    NodeAttribute: 51, "NodeAttribute::Group2", "LodGroup" {
        Properties70: {
            P: "Thresholds|Level0", "Distance", "", "",10
            P: "Thresholds|Level1", "Distance", "", "",20
            P: "DisplayLevels|Level0", "enum", "", "",0
            P: "DisplayLevels|Level1", "enum", "", "",0
            P: "DisplayLevels|Level2", "enum", "", "",0
        }
    }
    Model: 52, "Model::M0", "Mesh" {
        Version: 232
    }
    Model: 53, "Model::M1", "Mesh" {
        Version: 232
    }
    Model: 54, "Model::M2", "Mesh" {
        Version: 232
    }
}
Connections: {
    C: "OO", 40, 0
    C: "OO", 41, 40
    C: "OO", 42, 40
    C: "OO", 43, 40
    C: "OO", 44, 40
    C: "OO", 50, 0
    C: "OO", 51, 50
    C: "OO", 52, 50
    C: "OO", 53, 50
    C: "OO", 54, 50
    C: "OO", 1, 42
    C: "OO", 1, 43
    C: "OO", 1, 44
    C: "OO", 1, 52
    C: "OO", 1, 53
    C: "OO", 1, 54
}`;

// A bilinear NURBS patch with a skin deformer bound to it.
const NURBS_SKIN_FBX = `; FBX 7.5.0 project file
Objects: {
    Geometry: 60, "Geometry::Patch", "NurbsSurface" {
        NurbsSurfaceOrder: 2,2
        Dimensions: 2,2
        Step: 1,1
        Form: "Open","Open"
        Points: *16 {
            a: 0,0,0,1,1,0,0,1,0,1,0,1,1,1,0,1
        }
        KnotVectorU: *4 {
            a: 0,0,1,1
        }
        KnotVectorV: *4 {
            a: 0,0,1,1
        }
    }
    Model: 61, "Model::Surf", "NurbsSurface" {
        Version: 232
    }
    Deformer: 62, "Deformer::Skin", "Skin" {
        Version: 101
    }
}
Connections: {
    C: "OO", 60, 61
    C: "OO", 61, 0
    C: "OO", 62, 60
}`;

// A light whose intensity is animated by the base layer and, optionally, by a second additive layer at 50 %.
function lightIntensityFbx(secondLayer: boolean, unknownProperty: boolean): string {
    return `; FBX 7.5.0 project file
Objects: {
    Model: 70, "Model::Lamp", "Light" {
        Version: 232
    }
    NodeAttribute: 71, "NodeAttribute::Lamp", "Light" {
        TypeFlags: "Light"
        Properties70: {
            P: "LightType", "enum", "", "",0
            P: "Intensity", "Number", "", "A",100
        }
    }
    AnimationStack: 80, "AnimStack::Take", "" {
        Version: 232
    }
    AnimationLayer: 81, "AnimLayer::Base", "" {
        Version: 232
    }
    AnimationLayer: 82, "AnimLayer::Boost", "" {
        Properties70: {
            P: "Weight", "Number", "", "A",50
            P: "BlendMode", "enum", "", "",0
        }
    }
    AnimationCurveNode: 83, "AnimCurveNode::Intensity", "" {
        Version: 232
    }
    AnimationCurve: 84, "AnimCurve::Base", "" {
        KeyTime: *2 {
            a: 0,46186158000
        }
        KeyValueFloat: *2 {
            a: 100,100
        }
    }
    AnimationCurveNode: 85, "AnimCurveNode::Intensity", "" {
        Version: 232
    }
    AnimationCurve: 86, "AnimCurve::Boost", "" {
        KeyTime: *2 {
            a: 0,46186158000
        }
        KeyValueFloat: *2 {
            a: 100,100
        }
    }
    AnimationCurveNode: 87, "AnimCurveNode::Foo", "" {
        Version: 232
    }
    AnimationCurve: 88, "AnimCurve::Foo", "" {
        KeyTime: *2 {
            a: 0,46186158000
        }
        KeyValueFloat: *2 {
            a: 1,2
        }
    }
}
Connections: {
    C: "OO", 70, 0
    C: "OO", 71, 70
    C: "OO", 81, 80
    C: "OO", 83, 81
    C: "OP", 83, 71, "Intensity"
    C: "OP", 84, 83, "d|X"
    ${secondLayer ? 'C: "OO", 82, 80\n    C: "OO", 85, 82\n    C: "OP", 85, 71, "Intensity"\n    C: "OP", 86, 85, "d|X"' : ""}
    ${unknownProperty ? 'C: "OO", 87, 81\n    C: "OP", 87, 71, "Foo"\n    C: "OP", 88, 87, "d|X"' : ""}
}`;
}

// A 3ds Max metal/rough PBR material with different metalness and roughness maps.
const MAX_PBR_FBX = `; FBX 7.5.0 project file
Objects: {
    Material: 90, "Material::MaxPbr", "" {
        ShadingModel: "unknown"
        Properties70: {
            P: "3dsMax|ClassIDa", "int", "Integer", "",3490651648
            P: "3dsMax|ClassIDb", "int", "Integer", "",3195528448
        }
    }
    Texture: 91, "Texture::Metal", "" {
        FileName: "metal.png"
        RelativeFilename: "metal.png"
    }
    Texture: 92, "Texture::Rough", "" {
        FileName: "rough.png"
        RelativeFilename: "rough.png"
    }
}
Connections: {
    C: "OP", 91, 90, "3dsMax|main|metalness_map"
    C: "OP", 92, 90, "3dsMax|main|roughness_map"
}`;

describe("FBX loader behaviour", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("presets", () => {
        it("keeps the original behaviour by default", async () => {
            const progress: ISceneLoaderProgressEvent[] = [];
            await new FBXFileLoader().importMeshAsync(null, scene, PRESET_FBX, "", (event) => progress.push(event));

            // The scene loader's progress callback carries download bytes; parsing does not feed it counts.
            expect(progress).toEqual([]);
            const a = scene.getMeshByName("A") as Mesh;
            const b = scene.getMeshByName("B") as Mesh;
            expect(b.geometry).not.toBe(a.geometry);
            expect(scene.meshes.some((mesh) => mesh instanceof LinesMesh)).toBe(false);
            expect(b.behaviors).toHaveLength(0);
            expect((b.metadata as { fbxConstraints: unknown[] }).fbxConstraints).toHaveLength(1);
            expect(b.position.x).toBe(0);
            expect(scene.cameras[0].parent).toBeNull();
            // Clip rebased to frame 0 (30 fps default): keys at 1 s and 2 s become frames 0 and 30.
            expect(scene.animationGroups[0].from).toBe(0);
            expect(scene.animationGroups[0].to).toBe(30);
        });

        it("enables every feature with the full preset", async () => {
            await new FBXFileLoader({ preset: "full" }).importMeshAsync(null, scene, PRESET_FBX, "");

            const a = scene.getMeshByName("A") as Mesh;
            const b = scene.getMeshByName("B") as Mesh;
            expect(b.geometry).toBe(a.geometry);
            expect((b.metadata as { fbxInstanceOf: string }).fbxInstanceOf).toBe("A");
            expect(scene.meshes.some((mesh) => mesh instanceof LinesMesh && mesh.name === "Wire")).toBe(true);
            expect(b.behaviors.map((behavior) => behavior.name)).toEqual(["fbxConstraint:posC"]);
            expect(b.position.x).toBeCloseTo(10, 6);
            // Parented to its node (through the pivot that cancels the root's handedness mirror).
            const cameraParent = scene.cameras[0].parent;
            expect([cameraParent?.name, cameraParent?.parent?.name]).toContain("Cam");
            // Authored times: frames 30 to 60.
            expect(scene.animationGroups[0].from).toBe(30);
            expect(scene.animationGroups[0].to).toBe(60);
        });

        it("lets an explicit option override the preset", async () => {
            await new FBXFileLoader({ preset: "full", shareGeometry: false, constraints: "metadata" }).importMeshAsync(null, scene, PRESET_FBX, "");

            const a = scene.getMeshByName("A") as Mesh;
            const b = scene.getMeshByName("B") as Mesh;
            expect(b.geometry).not.toBe(a.geometry);
            expect(b.behaviors).toHaveLength(0);
            expect(scene.meshes.some((mesh) => mesh instanceof LinesMesh)).toBe(true);
        });
    });

    describe("LOD groups", () => {
        it("applies each child's display level before wiring LOD levels", async () => {
            await new FBXFileLoader().importMeshAsync(null, scene, LOD_FBX, "");

            // Group1: only L0 takes part in LOD switching (alone, so no levels), L1 always shows, L2 is hidden.
            const l0 = scene.getMeshByName("L0") as Mesh;
            expect(l0.hasLODLevels).toBe(false);
            expect(scene.getMeshByName("L1")!.isEnabled(false)).toBe(true);
            expect(scene.getMeshByName("L2")!.isEnabled(false)).toBe(false);

            // Group2: every child uses LOD, so M0 switches to M1 beyond 10 and to M2 beyond 20.
            const m0 = scene.getMeshByName("M0") as Mesh;
            expect(m0.getLODLevels().map((level) => [level.distanceOrScreenCoverage, level.mesh?.name])).toEqual([
                [20, "M2"],
                [10, "M1"],
            ]);
            expect(scene.getMeshByName("M1")!.isEnabled(false)).toBe(true);
        });
    });

    describe("NURBS", () => {
        it("imports a skinned NURBS surface undeformed and reports the deformer", async () => {
            const warnings: FBXLoaderWarning[] = [];
            await new FBXFileLoader({ onWarning: (warning) => warnings.push(warning) }).importMeshAsync(null, scene, NURBS_SKIN_FBX, "");

            const surface = scene.getMeshByName("Surf") as Mesh;
            expect(surface).toBeDefined();
            expect(surface.getTotalVertices()).toBeGreaterThan(0);
            expect(surface.skeleton).toBeNull();
            const reported = warnings.filter((warning) => (warning.details as { type?: string } | undefined)?.type === "nurbs-deformer-ignored");
            expect(reported).toHaveLength(1);
            expect(reported[0].objectName).toBe("Patch");
        });
    });

    describe("property animation", () => {
        it("evaluates a property animated by several layers through the layer stack", async () => {
            await new FBXFileLoader().importMeshAsync(null, scene, lightIntensityFbx(true, false), "");

            const intensity = scene.animationGroups[0].targetedAnimations.find((targeted) => targeted.animation.targetProperty === "intensity")!;
            // Base layer 100, additive layer 100 at 50 %: 150, which the loader maps to 1.5.
            expect(intensity.animation.getKeys().map((key) => key.value)).toEqual(expect.arrayContaining([1.5]));
            expect(intensity.animation.getKeys().every((key) => Math.abs(key.value - 1.5) < 1e-6)).toBe(true);
        });

        it("keeps single-layer property keys as authored", async () => {
            await new FBXFileLoader().importMeshAsync(null, scene, lightIntensityFbx(false, false), "");

            const intensity = scene.animationGroups[0].targetedAnimations.find((targeted) => targeted.animation.targetProperty === "intensity")!;
            expect(intensity.animation.getKeys().map((key) => [key.frame, key.value])).toEqual([
                [0, 1],
                [30, 1],
            ]);
        });

        it("only reports property curves that have no runtime mapping", async () => {
            const warnings: FBXLoaderWarning[] = [];
            await new FBXFileLoader({ onWarning: (warning) => warnings.push(warning) }).importMeshAsync(null, scene, lightIntensityFbx(false, true), "");

            const unevaluated = warnings.filter((warning) => (warning.details as { type?: string } | undefined)?.type === "unsupported-curve-node");
            expect(unevaluated.map((warning) => (warning.details as { propertyName?: string }).propertyName)).toEqual(["Foo"]);
        });
    });

    describe("textures", () => {
        it("creates only the texture it can use for metalness and roughness", async () => {
            await new FBXFileLoader({ materials: "auto" }).importMeshAsync(null, scene, MAX_PBR_FBX, "/textures/");

            const material = scene.materials.find((candidate) => candidate instanceof PBRMaterial) as PBRMaterial;
            expect(material).toBeDefined();
            // One file texture (the other scene texture is the PBR material's internal BRDF lookup).
            expect(scene.textures.filter((texture) => texture.name.endsWith(".png")).map((texture) => texture.name)).toEqual(["/textures/rough.png"]);
            expect(material.metallicTexture?.name).toContain("rough.png");
            expect(material.useMetallnessFromMetallicTextureBlue).toBe(false);
            expect(material.useRoughnessFromMetallicTextureGreen).toBe(true);
            expect((material.metadata as { fbxDroppedMetalnessTexture: string }).fbxDroppedMetalnessTexture).toBe("metal.png");
        });
    });
});
