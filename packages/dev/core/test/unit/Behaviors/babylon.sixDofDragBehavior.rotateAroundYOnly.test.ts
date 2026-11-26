import { describe, expect, it } from "vitest";
import { SixDofDragBehavior } from "core/Behaviors/Meshes/sixDofDragBehavior";
import { Quaternion, Vector3 } from "core/Maths/math.vector";

describe("SixDofDragBehavior rotateAroundYOnly", () => {
    it.each([89.99, 90.01, -89.99, -90.01])("keeps the yaw at 0 for a pure %s degree pitch", (degrees) => {
        const behavior = new SixDofDragBehavior();
        behavior.rotateAroundYOnly = true;
        behavior["_dragging"] = behavior["_dragType"].DRAG;

        const pitchOnly = Quaternion.RotationYawPitchRoll(0, (degrees * Math.PI) / 180, 0);
        behavior["_onePointerPositionUpdated"](Vector3.Zero(), pitchOnly);

        // the starting orientation is the identity, so the target is the yaw-only rotation itself
        const target: Quaternion = behavior["_targetOrientation"];
        expect(Math.abs(target.w)).toBeCloseTo(1, 6);
        expect(target.y).toBeCloseTo(0, 6);
    });
});
