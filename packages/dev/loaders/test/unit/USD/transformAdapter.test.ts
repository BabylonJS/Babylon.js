import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { TransformNode } from "core/Meshes/transformNode.pure";
import { Scene } from "core/scene";
import { ApplyResolvedTransform, CreateStageRoot } from "loaders/USD/adapter/transformAdapter";
import { type IResolvedTransform, type IStageMetadata } from "loaders/USD/resolution/resolvedStage";

const Epsilon = 1e-6;

function baseMetadata(metadata: Partial<IStageMetadata>): IStageMetadata {
    return {
        upAxis: "Y",
        metersPerUnit: 1,
        timeCodesPerSecond: 24,
        startTimeCode: 0,
        endTimeCode: 0,
        ...metadata,
    };
}

function areEquivalentQuaternions(actual: Quaternion, expected: Quaternion): boolean {
    const dot = actual.x * expected.x + actual.y * expected.y + actual.z * expected.z + actual.w * expected.w;
    return Math.abs(Math.abs(dot) - 1) < Epsilon;
}

describe("USD transform adapter", () => {
    it("enables right-handed scene mode when creating the stage root", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            CreateStageRoot(baseMetadata({}), scene);

            expect(scene.useRightHandedSystem).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("converts Z-up centimeter stage transforms to Y-up meter world space", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const root = CreateStageRoot(baseMetadata({ upAxis: "Z", metersPerUnit: 0.01 }), scene);
            const node = new TransformNode("UsdChild", scene);
            node.parent = root;

            ApplyResolvedTransform(node, {
                translation: [1, 2, 3],
                rotation: [0, 0, 0, 1],
                scale: [1, 1, 1],
            });

            root.computeWorldMatrix(true);
            node.computeWorldMatrix(true);

            expect(node.getAbsolutePosition().equalsWithEpsilon(new Vector3(0.01, 0.03, -0.02), Epsilon)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("keeps a Y-up meter stage root identity-like", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const root = CreateStageRoot(baseMetadata({ upAxis: "Y", metersPerUnit: 1 }), scene);

            expect(root.position.equalsWithEpsilon(Vector3.Zero(), Epsilon)).toBe(true);
            expect(root.scaling.equalsWithEpsilon(Vector3.One(), Epsilon)).toBe(true);
            expect(areEquivalentQuaternions(root.rotationQuaternion!, Quaternion.Identity())).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("preserves a full local matrix in preference to the TRS fallback", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const node = new TransformNode("UsdMatrixNode", scene);
            const matrix = Matrix.FromValues(1, 0.5, 0, 0, 0, 1, 0.25, 0, 0, 0, 1, 0, 5, 6, 7, 1);

            ApplyResolvedTransform(node, {
                translation: [100, 200, 300],
                rotation: [0, 0, 0, 1],
                scale: [10, 10, 10],
                matrix: matrix.asArray(),
            });

            expect(node.computeWorldMatrix(true).equals(matrix)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("applies TRS directly when no full matrix is present", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const node = new TransformNode("UsdTrsNode", scene);
            const rotation = Quaternion.RotationAxis(new Vector3(0, 0, 1), Math.PI / 4);
            const transform: IResolvedTransform = {
                translation: [1, 2, 3],
                rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
                scale: [4, 5, 6],
            };

            ApplyResolvedTransform(node, transform);

            expect(node.position.equalsWithEpsilon(new Vector3(1, 2, 3), Epsilon)).toBe(true);
            expect(node.scaling.equalsWithEpsilon(new Vector3(4, 5, 6), Epsilon)).toBe(true);
            expect(areEquivalentQuaternions(node.rotationQuaternion!, rotation)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
