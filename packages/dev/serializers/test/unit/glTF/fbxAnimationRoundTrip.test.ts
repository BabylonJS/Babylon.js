import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";
import { GLTFFileLoader, type IGLTFLoaderData } from "loaders/glTF/glTFFileLoader";
import "loaders/glTF/2.0/glTFLoader";
import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";

describe("FBX animation GLB round-trip", () => {
    it("preserves skeletal animation from a minimal FBX after GLB export and reload", async () => {
        const sourceEngine = new NullEngine();
        const sourceScene = new Scene(sourceEngine);

        await new FBXFileLoader().importMeshAsync(null, sourceScene, minimalAnimatedSkinFbx(), "");

        expect(sourceScene.skeletons).toHaveLength(1);
        expect(sourceScene.animationGroups).toHaveLength(1);
        const sourceSkeleton = sourceScene.skeletons[0];
        const sourceAnimationGroup = sourceScene.animationGroups[0];
        expect(sourceSkeleton.bones).toHaveLength(3);
        expect(sourceAnimationGroup.targetedAnimations).toHaveLength(1);

        const reachableNodes = new Set(sourceScene.rootNodes.flatMap((rootNode) => [rootNode, ...rootNode.getDescendants()]));
        for (const bone of sourceSkeleton.bones) {
            const transformNode = bone.getTransformNode();
            expect(transformNode).not.toBeNull();
            if (!transformNode) {
                throw new Error(`Bone ${bone.name} is missing its transform node`);
            }
            expect(reachableNodes.has(transformNode)).toBe(true);
        }

        const boneTransformNodes = new Set(sourceSkeleton.bones.map((bone) => bone.getTransformNode()));
        expect(boneTransformNodes.has(sourceAnimationGroup.targetedAnimations[0].target)).toBe(true);

        const { engine: targetEngine, scene: targetScene } = await exportAndReload(sourceScene);

        expect(targetScene.animationGroups).toHaveLength(1);
        expect(targetScene.animationGroups[0].targetedAnimations).toHaveLength(sourceAnimationGroup.targetedAnimations.length);

        targetScene.dispose();
        targetEngine.dispose();
        sourceScene.dispose();
        sourceEngine.dispose();
    });
});

function isGLTFLoaderData(value: object): value is IGLTFLoaderData {
    return "json" in value && "bin" in value;
}

async function exportAndReload(sourceScene: Scene): Promise<{ engine: NullEngine; scene: Scene }> {
    const glTFData = await GLTF2Export.GLBAsync(sourceScene, "round-trip", { exportWithoutWaitingForScene: true });
    const glb = glTFData.files["round-trip.glb"];
    if (!(glb instanceof Blob)) {
        throw new Error("GLB export did not produce a Blob");
    }

    const engine = new NullEngine();
    const scene = new Scene(engine);
    const glTFLoader = new GLTFFileLoader();
    const glbBytes = Buffer.from(await glb.arrayBuffer());
    const loaderData = await glTFLoader.directLoad(scene, `model/gltf-binary;base64,${glbBytes.toString("base64")}`);
    if (!isGLTFLoaderData(loaderData)) {
        throw new Error("GLB did not produce glTF loader data");
    }

    await glTFLoader.loadAsync(scene, loaderData, "", undefined, "round-trip.glb");
    return { engine, scene };
}

function minimalAnimatedSkinFbx(): string {
    return `; FBX 7.4.0 project file
GlobalSettings: {
    Version: 1000
    Properties70: {
        P: "UpAxis", "int", "Integer", "",1
        P: "UpAxisSign", "int", "Integer", "",1
        P: "FrontAxis", "int", "Integer", "",2
        P: "FrontAxisSign", "int", "Integer", "",1
        P: "CoordAxis", "int", "Integer", "",0
        P: "CoordAxisSign", "int", "Integer", "",1
        P: "UnitScaleFactor", "double", "Number", "",1
    }
}
Objects: {
    Geometry: 1, "Geometry::Triangle", "Mesh" {
        Vertices: *9 {
            a: 0,0,0,1,0,0,0,1,0
        }
        PolygonVertexIndex: *3 {
            a: 0,1,-3
        }
        LayerElementNormal: 0 {
            MappingInformationType: "ByControlPoint"
            ReferenceInformationType: "Direct"
            Normals: *9 {
                a: 0,0,1,0,0,1,0,0,1
            }
        }
    }
    Model: 2, "Model::Triangle", "Mesh" {
    }
    Model: 10, "Model::RootBone", "LimbNode" {
        Properties70: {
            P: "Lcl Scaling", "Lcl Scaling", "", "A",2,2,2
        }
    }
    Model: 11, "Model::ChildBone", "LimbNode" {
        Properties70: {
            P: "Lcl Translation", "Lcl Translation", "", "A",0,1,0
            P: "InheritType", "enum", "", "",2
        }
    }
    Deformer: 3, "Deformer::Skin", "Skin" {
    }
    Deformer: 4, "SubDeformer::RootBone", "Cluster" {
        Indexes: *3 {
            a: 0,1,2
        }
        Weights: *3 {
            a: 1,1,1
        }
        Transform: *16 {
            a: 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1
        }
        TransformLink: *16 {
            a: 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1
        }
        Mode: "Normalize"
    }
    AnimationStack: 20, "AnimStack::Take 001", "" {
    }
    AnimationLayer: 21, "AnimLayer::BaseLayer", "" {
    }
    AnimationCurveNode: 22, "AnimCurveNode::T", "" {
    }
    AnimationCurve: 23, "AnimCurve::X", "" {
        KeyTime: *2 {
            a: 0,46186158000
        }
        KeyValueFloat: *2 {
            a: 0,1
        }
    }
}
Connections: {
    C: "OO", 1, 2
    C: "OO", 2, 0
    C: "OO", 3, 1
    C: "OO", 4, 3
    C: "OO", 11, 4
    C: "OO", 11, 10
    C: "OO", 10, 0
    C: "OO", 21, 20
    C: "OO", 22, 21
    C: "OP", 22, 11, "Lcl Translation"
    C: "OP", 23, 22, "d|X"
}`;
}
