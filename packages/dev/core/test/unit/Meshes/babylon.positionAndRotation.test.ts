import { Engine, NullEngine } from "core/Engines";
import { Vector3, Quaternion } from "core/Maths";
import { AbstractMesh } from "core/Meshes";
import { Scene } from "core/scene";

/**
 * Describes the test suite.
 */
describe("Babylon position and rotation", () => {
    let subject: Engine;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("#position and rotation:", () => {
        it("converts between quaternions/euler", () => {
            // Converting between quaternions/euler
            const originalRotation = new Vector3(0.1, 0.2, 0.3);
            const v = originalRotation.clone();
            const q = Quaternion.FromEulerVector(v);
            q.toEulerAnglesToRef(v);
            expect(v.subtract(originalRotation).length() < 0.00001).toBe(true);
        });
        it("reorders vector in place", () => {
            const originalRotation = new Vector3(0.1, 0.2, 0.3);
            const v = originalRotation.clone();
            v.reorderInPlace("ZYX");
            expect(v.subtract(new Vector3(0.3, 0.2, 0.1)).length() < 0.00001).toBe(true);
        });
        it("handles parenting", () => {
            // Parent child positions
            const scene = new Scene(subject);
            const child = new AbstractMesh("", scene);
            const parent = new AbstractMesh("", scene);
            parent.position.set(0, 0, 1);
            child.position.set(0, 0, -1);
            child.parent = parent;
            child.computeWorldMatrix();
            expect(child.absolutePosition.equals(new Vector3(0, 0, 0))).toBe(true);

            //Rotate parent around child
            parent.rotationQuaternion = new Quaternion();
            const eulerRotation = new Vector3(0, Math.PI / 2, 0);
            const rotation = new Quaternion();
            Quaternion.RotationYawPitchRollToRef(eulerRotation.y, eulerRotation.x, eulerRotation.z, rotation);
            parent.rotationQuaternion.multiplyInPlace(rotation);
            parent.position.rotateByQuaternionAroundPointToRef(rotation, child.absolutePosition, parent.position);
            expect(parent.position.subtract(new Vector3(1, 0, 0)).length() < 0.00001).toBe(true);
            expect(parent.rotationQuaternion.toEulerAngles().subtract(eulerRotation).length() < 0.00001).toBe(true);
            expect(child.absolutePosition.subtract(new Vector3(0, 0, 0)).length() < 0.00001).toBe(true);
        });
    });
});
