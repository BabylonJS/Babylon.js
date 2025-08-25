import type { PointerInfo } from "core/Events/pointerEvents";
import type { Vector3 } from "core/Maths/math.vector";
import type { Nullable } from "core/types";

/**
 * Event type for drag move events
 */
export type DragEvent = {
    /**
     * Delta between last drag position and current drag position in world space
     */
    delta: Vector3;
    /**
     * Point in world space where the drag intersects the drag plane
     *
     * (if validatedDrag is used, the position of the attached mesh might not equal dragPlanePoint)
     */
    dragPlanePoint: Vector3;
    /**
     * Normal of the current drag plane used during the drag
     */
    dragPlaneNormal: Vector3;
    /**
     * Distance along the drag axis
     */
    dragDistance: number;
    /**
     * Pointer id to use
     */
    pointerId: number;
    /**
     * Pointer info for the event (if any)
     */
    pointerInfo: Nullable<PointerInfo>;
};

/**
 * Event type for drag start and end events
 */
export type DragStartEndEvent = Pick<DragEvent, "dragPlanePoint" | "pointerId" | "pointerInfo">;
