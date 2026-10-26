import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Ray } from "core/Culling/ray";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { VertexBuffer } from "core/Buffers/buffer";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { Scene } from "core/scene";
import "core/Collisions/collisionCoordinator";
// the default material: without it, a submesh does not intersect and picking falls back to the bounding box
import "core/Materials/standardMaterial";

describe("AbstractMesh positions", () => {
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

    // a ray toward the box from 5 units in front of it
    const ray = () => new Ray(new Vector3(0.25, 0.25, -5), new Vector3(0, 0, 1));

    it("keeps no positions of its own when they are its geometry's", () => {
        const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
        box.refreshBoundingInfo();

        expect(box._internalAbstractMeshDataInfo._positions).toBeNull();
    });

    it("picks with its geometry's points, which the meshes of the geometry share", () => {
        const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
        const clone = box.clone("clone");
        clone.position.x = 10;
        clone.computeWorldMatrix(true);

        const hit = scene.pickWithRay(ray(), (mesh) => mesh === box);

        expect(hit?.pickedMesh).toBe(box);
        expect(hit?.distance).toBeCloseTo(4);
        expect(box._positions).toBe(box.geometry!._positions);
        expect(clone._positions).toBe(box._positions);
    });

    it("collides with its geometry's points", () => {
        const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
        box.checkCollisions = true;
        box.computeWorldMatrix(true);
        scene.collisionsEnabled = true;
        const mover = MeshBuilder.CreateSphere("mover", { diameter: 1 }, scene);
        mover.position.set(0, 0, -4);
        mover.ellipsoid = new Vector3(0.5, 0.5, 0.5);
        mover.computeWorldMatrix(true);

        // it stops against the box's face (z = -1), the ellipsoid's radius before it
        mover.moveWithCollisions(new Vector3(0, 0, 4));

        expect(mover.position.z).toBeCloseTo(-1.5, 1);
    });

    it("keeps the positions it computes when its bounding info applies its morph targets", () => {
        const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
        const target = new MorphTarget("moved", 1, scene);
        target.setPositions(box.getVerticesData(VertexBuffer.PositionKind)!.map((value, index) => (index % 3 === 2 ? value + 10 : value)));
        box.morphTargetManager = new MorphTargetManager(scene);
        box.morphTargetManager.addTarget(target);

        box.refreshBoundingInfo({ applyMorph: true });

        const positions = box._internalAbstractMeshDataInfo._positions!;
        expect(positions.length).toBe(box.getTotalVertices());
        expect(positions[0].z).toBeCloseTo(box.getVerticesData(VertexBuffer.PositionKind)![2] + 10);
        expect(scene.pickWithRay(ray())?.distance).toBeCloseTo(14);
    });
});
