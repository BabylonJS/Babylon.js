import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FollowBehavior } from "core/Behaviors/Meshes/followBehavior";
import { HandConstraintBehavior, HandConstraintOrientation, HandConstraintVisibility, HandConstraintZone } from "core/Behaviors/Meshes/handConstraintBehavior";
import { SixDofDragBehavior } from "core/Behaviors/Meshes/sixDofDragBehavior";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { WebXRHand, WebXRHandJoint, WebXRHandTracking } from "core/XR/features/WebXRHandTracking.pure";
import { WebXRCamera } from "core/XR/webXRCamera";
import { WebXRInput } from "core/XR/webXRInput";
import { WebXRInputSource } from "core/XR/webXRInputSource";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRMotionControllerManager } from "core/XR/motionController/webXRMotionControllerManager";
import "core/Culling/ray";

describe.each([false, true])("LookDirection behavior consumers (RH=%s)", (isRightHanded) => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    const cleanups: (() => void)[] = [];

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = isRightHanded;
        camera = new FreeCamera("camera", new Vector3(1, 2, 3), scene);
        camera.setTarget(camera.position.add(Vector3.Forward(isRightHanded)));
    });

    afterEach(() => {
        for (const cleanup of cleanups.splice(0).reverse()) {
            cleanup();
        }
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it.each([0, 0.7])("keeps the follow node's front toward the camera (yaw=%s)", (yaw) => {
        camera.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0.3, 0);
        const node = new TransformNode("following", scene);
        const behavior = new FollowBehavior();
        behavior.lerpTime = 0;
        behavior.attach(node, camera);
        cleanups.push(() => behavior.detach());

        scene.onBeforeRenderObservable.notifyObservers(scene);

        const front = Vector3.Forward(isRightHanded).negate();
        front.rotateByQuaternionToRef(node.rotationQuaternion!, front);
        expect(Vector3.Distance(front, camera.position.subtract(node.position).normalize())).toBeCloseTo(0, 6);
    });

    it.each([0, 2])("keeps the dragged object's front toward the camera (offsetX=%s)", (offsetX) => {
        const node = new Mesh("dragged", scene);
        node.position.copyFrom(camera.position).addInPlace(new Vector3(offsetX, 0, isRightHanded ? -3 : 3));
        node.computeWorldMatrix(true);
        const behavior = new SixDofDragBehavior();
        behavior["_ownerNode"] = node;
        behavior["_scene"] = scene;
        behavior.faceCameraOnDragStart = true;
        behavior.currentDraggingPointerIds.push(1);

        behavior["_targetDragStart"]();

        const front = Vector3.Forward(isRightHanded).negate();
        front.rotateByQuaternionToRef(behavior["_targetOrientation"], front);
        expect(Vector3.Distance(front, camera.position.subtract(node.getAbsolutePivotPoint()).normalize())).toBeCloseTo(0, 6);
    });

    function attachHand(behavior: HandConstraintBehavior, handedness: "left" | "right") {
        const sessionManager = new WebXRSessionManager(scene);
        vi.spyOn(sessionManager, "isNative", "get").mockReturnValue(false);
        const xrCamera = new WebXRCamera("xrCamera", scene, sessionManager);
        const useOnlineRepository = WebXRMotionControllerManager.UseOnlineRepository;
        const xrInput = new WebXRInput(sessionManager, xrCamera, { disableOnlineControllerRepository: true });
        cleanups.push(() => {
            xrInput.dispose();
            sessionManager.dispose();
            WebXRMotionControllerManager.UseOnlineRepository = useOnlineRepository;
        });
        const tracking = new WebXRHandTracking(sessionManager, { xrInput });
        const inputSource: XRInputSource = {
            handedness,
            targetRayMode: "tracked-pointer",
            targetRaySpace: new EventTarget(),
            profiles: [],
        };
        const controller = new WebXRInputSource(scene, inputSource);
        // WebXR defines 25 joints; the hand creates a tracking transform for each.
        const joints = Array.from({ length: 25 }, (_, i) => new Mesh(`joint${i}`, scene));
        const hand = new WebXRHand(controller, joints, null, null);
        cleanups.push(() => {
            hand.dispose();
            controller.dispose();
            tracking.dispose();
        });
        tracking["_trackingHands"][handedness] = hand;
        behavior["_handTracking"] = tracking;
        behavior.handedness = handedness;

        const middle = hand.getJointMesh(WebXRHandJoint.MIDDLE_FINGER_METACARPAL);
        const wrist = hand.getJointMesh(WebXRHandJoint.WRIST);
        const pinky = hand.getJointMesh(WebXRHandJoint.PINKY_FINGER_METACARPAL);
        middle.position.copyFrom(camera.position).addInPlace(Vector3.Forward(isRightHanded).scale(2));
        wrist.position.copyFrom(middle.position).addInPlace(new Vector3(0, -1, 0));
        pinky.position.copyFrom(middle.position).addInPlace(new Vector3(handedness === "left" ? 1 : -1, 0, 0));
        for (const joint of [middle, wrist, pinky]) {
            joint.computeWorldMatrix(true);
        }
        return { middle, pinky };
    }

    it.each(["left", "right"] as const)("preserves %s hand palm visibility and hand-oriented zone offsets", (handedness) => {
        const node = new TransformNode("handMenu", scene);
        const behavior = new HandConstraintBehavior();
        behavior.lerpTime = 0;
        behavior.handConstraintVisibility = HandConstraintVisibility.PALM_UP;
        behavior.targetZone = HandConstraintZone.ULNAR_SIDE;
        behavior.attach(node);
        cleanups.push(() => behavior.detach());
        const { middle, pinky } = attachHand(behavior, handedness);

        scene.onBeforeRenderObservable.notifyObservers(scene);

        expect(node.isEnabled()).toBe(true);
        const palmDirection = Vector3.Forward().rotateByQuaternionToRef(node.rotationQuaternion!, new Vector3());
        expect(Vector3.Distance(palmDirection, camera.getForwardRay().direction)).toBeCloseTo(0, 6);
        expect(Vector3.Distance(node.position.subtract(middle.absolutePosition), new Vector3(isRightHanded ? -behavior.targetOffset : behavior.targetOffset, 0, 0))).toBeCloseTo(
            0,
            6
        );

        pinky.position.x = 2 * middle.position.x - pinky.position.x;
        pinky.computeWorldMatrix(true);
        scene.onBeforeRenderObservable.notifyObservers(scene);

        expect(node.isEnabled()).toBe(false);
    });

    it.each(["left", "right"] as const)("keeps the %s hand camera-facing node and zones oriented toward the camera", (handedness) => {
        const node = new TransformNode("handMenu", scene);
        const behavior = new HandConstraintBehavior();
        behavior.lerpTime = 0;
        behavior.handConstraintVisibility = HandConstraintVisibility.ALWAYS_VISIBLE;
        behavior.nodeOrientationMode = HandConstraintOrientation.LOOK_AT_CAMERA;
        behavior.zoneOrientationMode = HandConstraintOrientation.LOOK_AT_CAMERA;
        behavior.targetZone = HandConstraintZone.ULNAR_SIDE;
        behavior.attach(node);
        cleanups.push(() => behavior.detach());
        const { middle } = attachHand(behavior, handedness);

        scene.onBeforeRenderObservable.notifyObservers(scene);

        const front = Vector3.Forward(isRightHanded).negate();
        front.rotateByQuaternionToRef(node.rotationQuaternion!, front);
        expect(Vector3.Distance(front, camera.position.subtract(middle.absolutePosition).normalize())).toBeCloseTo(0, 6);
        expect(Vector3.Distance(node.position.subtract(middle.absolutePosition), new Vector3(behavior.targetOffset, 0, 0))).toBeCloseTo(0, 6);
    });
});
