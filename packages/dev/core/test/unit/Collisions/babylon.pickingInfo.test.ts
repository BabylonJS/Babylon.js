import { PickingInfo } from "core/Collisions";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { Mesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

describe("PickingInfo", () => {
    let subject: Engine;
    let scene: Scene;
    let box: Mesh;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);

        box = MeshBuilder.CreateBox("Box", { size: 1 }, scene);
    });

    describe("getNormal", () => {
        it("should return null when no intersection", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = null;

            expect(pickingInfo.getNormal()).toBeNull();
        });

        it('should return null when "useVerticesNormals" is true and no normals', () => {
            const pickingInfo = new PickingInfo();

            box.isVerticesDataPresent = () => false;
            pickingInfo.pickedMesh = box;

            expect(pickingInfo.getNormal(true)).toBeNull();
        });

        it("should return null when no indices", () => {
            const pickingInfo = new PickingInfo();

            box.getIndices = () => null;
            pickingInfo.pickedMesh = box;

            expect(pickingInfo.getNormal()).toBeNull();
        });
    });
});
