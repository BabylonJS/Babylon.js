import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";

describe("FBX skeletal animation loading", () => {
    it("links imported bones and their animation to reachable transform nodes", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        await new FBXFileLoader().importMeshAsync(null, scene, minimalAnimatedSkinFbx(), "");

        expect(scene.skeletons).toHaveLength(1);
        expect(scene.animationGroups).toHaveLength(1);
        const skeleton = scene.skeletons[0];
        const animationGroup = scene.animationGroups[0];
        expect(skeleton.bones).toHaveLength(3);
        expect(animationGroup.targetedAnimations).toHaveLength(1);

        const reachableNodes = new Set(scene.rootNodes.flatMap((rootNode) => [rootNode, ...rootNode.getDescendants()]));
        for (const bone of skeleton.bones) {
            const transformNode = bone.getTransformNode();
            expect(transformNode).not.toBeNull();
            if (!transformNode) {
                throw new Error(`Bone ${bone.name} is missing its transform node`);
            }
            expect(reachableNodes.has(transformNode)).toBe(true);
        }

        const boneTransformNodes = new Set(skeleton.bones.map((bone) => bone.getTransformNode()));
        expect(boneTransformNodes.has(animationGroup.targetedAnimations[0].target)).toBe(true);

        scene.dispose();
        engine.dispose();
    });

    it("targets a shared animated ancestor only once when it belongs to multiple rigs", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        await new FBXFileLoader().importMeshAsync(null, scene, sharedAnimatedAncestorFbx(), "");

        expect(scene.skeletons).toHaveLength(2);
        expect(scene.animationGroups).toHaveLength(1);
        const sharedNode = scene.getTransformNodeByName("CharactersGroup");
        expect(sharedNode).not.toBeNull();
        expect(scene.skeletons.filter((skeleton) => skeleton.bones.some((bone) => bone.getTransformNode() === sharedNode))).toHaveLength(2);

        const sharedNodeAnimations = scene.animationGroups[0].targetedAnimations.filter(
            ({ animation, target }) => target === sharedNode && animation.targetProperty === "position"
        );
        expect(sharedNodeAnimations).toHaveLength(1);

        scene.dispose();
        engine.dispose();
    });
});

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

function sharedAnimatedAncestorFbx(): string {
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
    Geometry: 1, "Geometry::TriangleA", "Mesh" {
        Vertices: *9 {
            a: 0,0,0,1,0,0,0,1,0
        }
        PolygonVertexIndex: *3 {
            a: 0,1,-3
        }
    }
    Geometry: 101, "Geometry::TriangleB", "Mesh" {
        Vertices: *9 {
            a: 0,0,0,1,0,0,0,1,0
        }
        PolygonVertexIndex: *3 {
            a: 0,1,-3
        }
    }
    Model: 2, "Model::TriangleA", "Mesh" {
    }
    Model: 102, "Model::TriangleB", "Mesh" {
    }
    Model: 9, "Model::CharactersGroup", "Null" {
    }
    Model: 10, "Model::HipsA", "LimbNode" {
    }
    Model: 110, "Model::HipsB", "LimbNode" {
    }
    Deformer: 3, "Deformer::SkinA", "Skin" {
    }
    Deformer: 4, "SubDeformer::HipsA", "Cluster" {
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
    Deformer: 103, "Deformer::SkinB", "Skin" {
    }
    Deformer: 104, "SubDeformer::HipsB", "Cluster" {
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
    C: "OO", 101, 102
    C: "OO", 102, 0
    C: "OO", 3, 1
    C: "OO", 4, 3
    C: "OO", 10, 4
    C: "OO", 103, 101
    C: "OO", 104, 103
    C: "OO", 110, 104
    C: "OO", 10, 9
    C: "OO", 110, 9
    C: "OO", 9, 0
    C: "OO", 21, 20
    C: "OO", 22, 21
    C: "OP", 22, 9, "Lcl Translation"
    C: "OP", 23, 22, "d|X"
}`;
}
