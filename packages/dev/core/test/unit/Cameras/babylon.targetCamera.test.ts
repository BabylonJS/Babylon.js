import { TargetCamera } from "core/Cameras";
import { NullEngine } from "core/Engines";
import { Quaternion, Vector3 } from "core/Maths";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

describe("ArcRotateCameraMouseInput", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: Nullable<TargetCamera> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        camera = new TargetCamera("camera", new Vector3(0, 0, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl();
    });

    afterEach(() => {
        camera?.dispose();
        scene?.dispose();
        engine?.dispose();
    });

    it("rotates when there are changes to the rotationQuaternion", () => {
        let isXMoving = false;
        let isYMoving = false;
        let isZMoving = false;
        let isXYMoving = false;
        let isXZMoving = false;
        let isYZMoving = false;

        if (camera) {
            let upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(1, 0, 0, 0);
            camera.getViewMatrix(true);
            isXMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(0, 1, 0, 0);
            camera.getViewMatrix(true);
            isYMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(0, 0, 1, 0);
            camera.getViewMatrix(true);
            isZMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(1, 1, 0, 0);
            camera.getViewMatrix(true);
            isXYMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(1, 0, 1, 0);
            camera.getViewMatrix(true);
            isXZMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotationQuaternion = new Quaternion(0, 1, 1, 0);
            camera.getViewMatrix(true);
            isYZMoving = !upVector.equalsWithEpsilon(camera.upVector);
        }

        expect(isXMoving, "Moving on X").toBe(true);
        expect(isYMoving, "Moving on Y").toBe(true);
        expect(isZMoving, "Moving on Z").toBe(true);
        expect(isXYMoving, "Moving on X and Y").toBe(true);
        expect(isXZMoving, "Moving on X and Z").toBe(true);
        expect(isYZMoving, "Moving on Y and Z").toBe(true);
    });

    it("rotates when there are changes to the rotation", () => {
        let isXMoving = false;
        let isYMoving = false;
        let isZMoving = false;
        let isXYMoving = false;
        let isXZMoving = false;
        let isYZMoving = false;

        if (camera) {
            let upVector = camera.upVector.clone();

            camera.rotation = new Vector3(1, 0, 0);
            camera.getViewMatrix(true);
            isXMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotation = new Vector3(0, 1, 0);
            camera.getViewMatrix(true);
            isYMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotation = new Vector3(0, 0, 1);
            camera.getViewMatrix(true);
            isZMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotation = new Vector3(1, 1, 0);
            camera.getViewMatrix(true);
            isXYMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotation = new Vector3(1, 0, 1);
            camera.getViewMatrix(true);
            isXZMoving = !upVector.equalsWithEpsilon(camera.upVector);
            upVector = camera.upVector.clone();

            camera.rotation = new Vector3(0, 1, 1);
            camera.getViewMatrix(true);
            isYZMoving = !upVector.equalsWithEpsilon(camera.upVector);
        }

        expect(isXMoving, "Moving on X").toBe(true);
        expect(isYMoving, "Moving on Y").toBe(true);
        expect(isZMoving, "Moving on Z").toBe(true);
        expect(isXYMoving, "Moving on X and Y").toBe(true);
        expect(isXZMoving, "Moving on X and Z").toBe(true);
        expect(isYZMoving, "Moving on Y and Z").toBe(true);
    });
});
