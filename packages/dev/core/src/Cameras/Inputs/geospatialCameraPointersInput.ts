import { type GeospatialCamera } from "../../Cameras/geospatialCamera";
import { type IPointerEvent } from "../../Events/deviceInputEvents";
import { type PointerTouch } from "../../Events/pointerEvents";
import { type Nullable } from "../../types";
import { OrbitCameraPointersInput } from "./orbitCameraPointersInput";
import { Vector3Distance } from "../../Maths/math.vector.functions";
import { type PointerConditions, type PointerInputMapEntry } from "../inputMapper";

/**
 * Geospatial camera inputs can simulate dragging the globe around or tilting the camera around some point on the globe
 * This class will update the GeospatialCameraMovement class's movementDeltaCurrentFrame, and the camera is responsible for using these updates to calculate viewMatrix appropriately
 *
 * Uses the inputMap on the movement class to determine which button maps to which interaction.
 * Default: Left mouse button = pan (drag globe), Middle/Right mouse button = rotate (tilt)
 *
 */
export class GeospatialCameraPointersInput extends OrbitCameraPointersInput {
    public camera: GeospatialCamera;

    private _initialPinchSquaredDistance: number = 0;
    private _pinchCentroid: Nullable<PointerTouch> = null;

    /** Cached resolved inputMap entry for the current pointer gesture */
    private _activeEntry: PointerInputMapEntry | null = null;

    /** Cached conditions object for pointer-down resolution */
    private _pointerConditions: PointerConditions = { modifiers: { ctrl: false, alt: false, shift: false } };

    /**
     * Defines the rotation sensitivity of the pointer when rotating camera around the x axis (pitch).
     * (Multiplied by the true pixel delta of pointer input, before rotation speed factor is applied by movement class)
     * @deprecated Use the `sensitivity` field on the pointer rotate entry in `camera.movement.input.inputMap` instead.
     */
    public get pitchSensitivity(): number {
        const entry = this.camera?.movement.input.getEntry("pointer", "rotate");
        return entry?.sensitivityY ?? entry?.sensitivity ?? 1;
    }

    public set pitchSensitivity(value: number) {
        for (const entry of this.camera?.movement.input.getEntries("pointer", "rotate") ?? []) {
            entry.sensitivityY = value;
        }
    }

    /**
     * Defines the rotation sensitivity of the pointer when rotating the camera around the Y axis (yaw).
     * (Multiplied by the true pixel delta of pointer input, before rotation speed factor is applied by movement class)
     * @deprecated Use the `sensitivity` field on the pointer rotate entry in `camera.movement.input.inputMap` instead.
     */
    public get yawSensitivity(): number {
        const entry = this.camera?.movement.input.getEntry("pointer", "rotate");
        return entry?.sensitivityX ?? entry?.sensitivity ?? 1;
    }

    public set yawSensitivity(value: number) {
        for (const entry of this.camera?.movement.input.getEntries("pointer", "rotate") ?? []) {
            entry.sensitivityX = value;
        }
    }

    /**
     * Defines the distance used to consider the camera in pan mode vs pinch/zoom.
     * Basically if your fingers moves away from more than this distance you will be considered
     * in pinch mode.
     */
    public pinchToPanMax: number = 20;

    public override getClassName(): string {
        return "GeospatialCameraPointersInput";
    }

    public override onButtonDown(evt: IPointerEvent): void {
        this.camera.movement.activeInput = true;
        const scene = this.camera.getScene();

        this._pointerConditions.button = evt.button;
        this._pointerConditions.modifiers!.ctrl = evt.ctrlKey;
        this._pointerConditions.modifiers!.alt = evt.altKey;
        this._pointerConditions.modifiers!.shift = evt.shiftKey;
        this._activeEntry = this.camera.movement.input.resolveInteraction("pointer", this._pointerConditions);

        if (this._activeEntry?.interaction === "pan") {
            this.camera.movement.input.handlers.pan.start(scene.pointerX, scene.pointerY);
        }
    }

    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        if (!this._activeEntry) {
            return;
        }
        const sens = this._activeEntry.sensitivity ?? 1;
        const sensX = this._activeEntry.sensitivityX ?? sens;
        const sensY = this._activeEntry.sensitivityY ?? sens;
        const scene = this.camera.getScene();

        if (this._activeEntry.interaction === "pan") {
            this.camera.movement.input.handlers.pan.update(scene.pointerX, scene.pointerY);
        } else if (this._activeEntry.interaction === "rotate") {
            this.camera.movement.input.handlers.rotate(offsetX * sensX, -offsetY * sensY);
        }
    }

    /**
     * Move camera from multitouch (pinch) zoom distances.
     * Zooms towards the centroid (midpoint between the two fingers).
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     */
    protected override _computePinchZoom(previousPinchSquaredDistance: number, pinchSquaredDistance: number): void {
        const camera = this.camera;

        // Calculate zoom distance based on pinch delta
        const previousDistance = Math.sqrt(previousPinchSquaredDistance);
        const currentDistance = Math.sqrt(pinchSquaredDistance);
        const pinchDelta = currentDistance - previousDistance;

        // Try to zoom towards centroid if we have it
        if (this._pinchCentroid) {
            const scene = camera.getScene();
            const engine = scene.getEngine();
            const canvasRect = engine.getInputElementClientRect();

            if (canvasRect) {
                // Convert centroid from clientX/Y to canvas-relative coordinates (same as scene.pointerX/Y)
                const canvasX = this._pinchCentroid.x - canvasRect.left;
                const canvasY = this._pinchCentroid.y - canvasRect.top;

                // Pick at centroid
                const pickResult = scene.pick(canvasX, canvasY, camera.movement.pickPredicate);
                if (pickResult?.pickedPoint) {
                    // Scale zoom by distance to picked point
                    const distanceToPoint = Vector3Distance(pickResult.pickedPoint, camera.position);
                    const zoomDistance = pinchDelta * distanceToPoint * 0.005;
                    const clampedZoom = camera.limits.clampZoomDistance(zoomDistance, camera.radius, distanceToPoint);
                    camera.zoomToPoint(pickResult.pickedPoint, clampedZoom);
                    return;
                }
            }
        }

        // Fallback: scale zoom by camera radius along lookat vector
        const zoomDistance = pinchDelta * camera.radius * 0.005;
        const clampedZoom = camera.limits.clampZoomDistance(zoomDistance, camera.radius);
        camera.zoomAlongLookAt(clampedZoom);
    }

    /**
     * Move camera from multi touch panning positions.
     * In geospatialcamera, multi touch panning tilts the globe (whereas single touch will pan/drag it)
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    protected override _computeMultiTouchPanning(previousMultiTouchPanPosition: Nullable<PointerTouch>, multiTouchPanPosition: Nullable<PointerTouch>): void {
        if (previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            // Multi-touch is a gesture (no button), so `_activeEntry` is null. Resolve a fresh
            // pointer→rotate entry so the configured rotate sensitivity (yaw/pitch) is honored.
            const rotateEntry = this.camera.movement.input.getEntry("pointer", "rotate");
            const sens = rotateEntry?.sensitivity ?? 1;
            const sensX = rotateEntry?.sensitivityX ?? sens;
            const sensY = rotateEntry?.sensitivityY ?? sens;
            this.camera.movement.input.handlers.rotate(moveDeltaX * sensX, -moveDeltaY * sensY);
        }
    }

    public override onDoubleTap(type: string): void {
        const pickResult = this.camera._scene.pick(this.camera._scene.pointerX, this.camera._scene.pointerY, this.camera.movement.pickPredicate);
        if (pickResult.pickedPoint) {
            void this.camera.flyToPointAsync(pickResult.pickedPoint);
        }
    }

    public override onMultiTouch(
        pointA: Nullable<PointerTouch>,
        pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        // Store centroid for use in _computePinchZoom (it's already calculated by parent)
        this._pinchCentroid = multiTouchPanPosition;

        // Reset on gesture end
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            this._initialPinchSquaredDistance = 0;
            this._pinchCentroid = null;
            super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
            return;
        }

        // Track initial distance at gesture start for cumulative threshold detection
        if (this._initialPinchSquaredDistance === 0 && pinchSquaredDistance !== 0) {
            this._initialPinchSquaredDistance = pinchSquaredDistance;
        }

        // Use cumulative delta from gesture start for threshold detection (more forgiving than frame-to-frame)
        const cumulativeDelta = Math.abs(Math.sqrt(pinchSquaredDistance) - Math.sqrt(this._initialPinchSquaredDistance));
        this._shouldStartPinchZoom = this._twoFingerActivityCount < 20 && cumulativeDelta > this.pinchToPanMax;

        super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
    }

    public override onButtonUp(_evt: IPointerEvent): void {
        if (this._activeEntry?.interaction === "pan") {
            this.camera.movement.input.handlers.pan.stop();
        }
        this._activeEntry = null;
        this.camera.movement.activeInput = false;
        this._initialPinchSquaredDistance = 0;
        this._pinchCentroid = null;
        super.onButtonUp(_evt);
    }

    public override onLostFocus(): void {
        this._activeEntry = null;
        this._initialPinchSquaredDistance = 0;
        this._pinchCentroid = null;
        super.onLostFocus();
    }
}
