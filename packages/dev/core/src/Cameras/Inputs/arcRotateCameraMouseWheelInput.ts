import { type Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { type EventState, type Observer } from "../../Misc/observable";
import { type ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { type ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { type PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Plane } from "../../Maths/math.plane";
import { Vector3, Matrix, TmpVectors } from "../../Maths/math.vector.pure";
import { Epsilon } from "../../Maths/math.constants";
import { type IWheelEvent, EventConstants } from "../../Events/deviceInputEvents";
import { Clamp } from "../../Maths/math.scalar.functions";
import { Tools } from "../../Misc/tools.pure";

/**
 * Firefox uses a different scheme to report scroll distances to other
 * browsers. Rather than use complicated methods to calculate the exact
 * multiple we need to apply, let's just cheat and use a constant.
 * https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
 * https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
 */
const FfMultiplier = 40;

/**
 * Manage the mouse wheel inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * Gets or Set the mouse wheel precision or how fast is the camera zooming.
     */
    @serialize()
    public wheelPrecision = 3.0;

    /**
     * Gets or Set the boolean value that controls whether or not the mouse wheel
     * zooms to the location of the mouse pointer or not.  The default is false.
     */
    @serialize()
    public zoomToMouseLocation = false;

    /**
     * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when wheel is used.
     */
    @serialize()
    public wheelDeltaPercentage = 0;

    /**
     * If set, this function will be used to set the radius delta that will be added to the current camera radius
     */
    public customComputeDeltaFromMouseWheel: Nullable<(wheelDelta: number, input: ArcRotateCameraMouseWheelInput, event: IWheelEvent) => number> = null;

    private _wheel: Nullable<(p: PointerInfo, s: EventState) => void>;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _hitPlane: Nullable<Plane>;
    private _viewOffset: Vector3 = new Vector3(0, 0, 0);
    private _globalOffset: Vector3 = new Vector3(0, 0, 0);

    protected _computeDeltaFromMouseWheelLegacyEvent(mouseWheelDelta: number, radius: number) {
        let delta: number;
        const wheelDelta = mouseWheelDelta * 0.01 * this.wheelDeltaPercentage * radius;
        if (mouseWheelDelta > 0) {
            delta = wheelDelta / (1.0 + this.wheelDeltaPercentage);
        } else {
            delta = wheelDelta * (1.0 + this.wheelDeltaPercentage);
        }
        return delta;
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._wheel = (p) => {
            //sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) {
                return;
            }
            const event = <IWheelEvent>p.event;
            let delta: number;
            const platformScale = event.deltaMode === EventConstants.DOM_DELTA_LINE ? FfMultiplier : 1; // If this happens to be set to DOM_DELTA_LINE, adjust accordingly

            const wheelDelta = -(event.deltaY * platformScale);

            if (this.customComputeDeltaFromMouseWheel) {
                delta = this.customComputeDeltaFromMouseWheel(wheelDelta, this, event);
            } else {
                if (this.wheelDeltaPercentage) {
                    delta = this._computeDeltaFromMouseWheelLegacyEvent(wheelDelta, this.camera.radius);

                    // If zooming in, estimate the target radius and use that to compute the delta for inertia
                    // this will stop multiple scroll events zooming in from adding too much inertia
                    if (delta > 0) {
                        // When zoomToMouseLocation is active, the accumulating state lives in our private
                        // `_zoomToMouseRadiusOffset` field. Otherwise fall back to the legacy surface.
                        const currentAccumulated = this.zoomToMouseLocation ? this._zoomToMouseRadiusOffset : this.camera.inertialRadiusOffset;
                        let estimatedTargetRadius = this.camera.radius;
                        let targetInertia = currentAccumulated + delta;
                        for (let i = 0; i < 20; i++) {
                            // 20 iterations should be enough to converge
                            if (estimatedTargetRadius <= targetInertia) {
                                // We do not want a negative radius, so we break out of the loop
                                break;
                            }
                            if (Math.abs(targetInertia * this.camera.inertia) < 0.001) {
                                // We do not want to go below a certain threshold, so we break out of the loop
                                break;
                            }
                            estimatedTargetRadius -= targetInertia;
                            targetInertia *= this.camera.inertia;
                        }
                        estimatedTargetRadius = Clamp(estimatedTargetRadius, 0, Number.MAX_VALUE);
                        delta = this._computeDeltaFromMouseWheelLegacyEvent(wheelDelta, estimatedTargetRadius);
                    }
                } else {
                    // The inputMap entry's `sensitivity` takes precedence so consumers can tune
                    // wheel zoom feel declaratively; fall back to the legacy `wheelPrecision`.
                    const wheelEntry = this.camera.movement.input.getEntry("wheel", "zoom");
                    const wheelScale = wheelEntry?.sensitivity ?? 1 / (this.wheelPrecision * 40);
                    delta = wheelDelta * wheelScale;
                }
            }

            if (delta) {
                if (this.zoomToMouseLocation) {
                    // If we are zooming to the mouse location, then we need to get the hit plane at the start of the zoom gesture if it doesn't exist
                    // The hit plane is normally calculated after the first motion and each time there's motion so if we don't do this first,
                    // the first zoom will be to the center of the screen
                    if (!this._hitPlane) {
                        this._updateHitPlane();
                    }

                    this._zoomToMouse(delta);
                } else {
                    this.camera.movement.zoomAccumulatedPixels += delta;
                }
            }
            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };

        this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, PointerEventTypes.POINTERWHEEL);

        if (this.zoomToMouseLocation) {
            this._inertialPanning.setAll(0);
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (!this.zoomToMouseLocation) {
            return;
        }

        const camera = this.camera;
        // Motion check based on our private accumulator state + the legacy inertialRadiusOffset
        // surface (so user code that still writes to it continues to animate). Legacy also
        // included alpha/beta offsets in the motion check — keep that for compatibility so
        // the hit plane stays updated while the camera rotates.
        const motion =
            Math.abs(this._zoomToMouseRadiusOffset) +
            this._inertialPanning.lengthSquared() +
            Math.abs(camera.inertialAlphaOffset) +
            Math.abs(camera.inertialBetaOffset) +
            Math.abs(camera.inertialRadiusOffset);
        if (motion) {
            // if zooming is still happening as a result of inertia, then we also need to update
            // the hit plane.
            this._updateHitPlane();

            // Apply this frame's coupled radius + pan delta to the camera. They must stay
            // in lockstep so the cursor remains at the zoom focal point — keep pan here instead
            // of routing through `arcRotateCamera.inertialPanning` which uses a different
            // `panningInertia`.
            camera.target.addInPlace(this._inertialPanning);
            camera.radius -= this._zoomToMouseRadiusOffset;

            // Framerate-independent decay — matches legacy `* camera.inertia` exactly at 60fps
            // and preserves glide duration at any other fps.
            const decay = camera.movement.getFrameIndependentDecay(camera.inertia);
            this._inertialPanning.scaleInPlace(decay);
            this._zoomToMouseRadiusOffset *= decay;

            this._zeroIfClose(this._inertialPanning);
            if (Math.abs(this._zoomToMouseRadiusOffset) < Epsilon) {
                this._zoomToMouseRadiusOffset = 0;
            }
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraMouseWheelInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mousewheel";
    }

    private _updateHitPlane() {
        const camera = this.camera;
        const direction = camera.target.subtract(camera.position);
        this._hitPlane = Plane.FromPositionAndNormal(camera.target, direction);
    }

    // Get position on the hit plane
    private _getPosition(): Vector3 {
        const camera = this.camera;
        const scene = camera.getScene();

        // since the _hitPlane is always updated to be orthogonal to the camera position vector
        // we don't have to worry about this ray shooting off to infinity. This ray creates
        // a vector defining where we want to zoom to.
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera, false);
        // Since the camera is the origin of the picking ray, we need to offset it by the camera's offset manually
        // Because the offset is in view space, we need to convert it to world space first
        if (camera.targetScreenOffset.x !== 0 || camera.targetScreenOffset.y !== 0) {
            this._viewOffset.set(camera.targetScreenOffset.x, camera.targetScreenOffset.y, 0);
            camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
            this._globalOffset = Vector3.TransformNormal(this._viewOffset, camera._cameraTransformMatrix);
            ray.origin.addInPlace(this._globalOffset);
        }

        let distance = 0;
        if (this._hitPlane) {
            distance = ray.intersectsPlane(this._hitPlane) ?? 0;
        }

        // not using this ray again, so modifying its vectors here is fine
        return ray.origin.addInPlace(ray.direction.scaleInPlace(distance));
    }

    private _inertialPanning: Vector3 = Vector3.Zero();

    /**
     * Decaying accumulator for radius motion in the `zoomToMouseLocation` path.
     *
     * Units: world-space radius units. On each frame, this value is *subtracted* from
     * `camera.radius` and then multiplied by a framerate-independent decay factor (via
     * `CameraMovement.getFrameIndependentDecay`). New input from `_zoomToMouse(delta)`
     * is added on top each frame, scaled by the matching framerate-independent input
     * factor so the steady-state and total-glide-distance match legacy at 60fps at any
     * actual refresh rate.
     *
     * Replaces the use of the legacy `camera.inertialRadiusOffset` for this code path
     * so the coupled radius + pan motion can be decayed with framerate-independent
     * semantics without disturbing the public `inertialRadiusOffset` back-compat surface.
     */
    private _zoomToMouseRadiusOffset: number = 0;

    private _zoomToMouse(delta: number) {
        const camera = this.camera;
        const inertiaComp = 1 - camera.inertia;
        // inputScale corrects per-frame input so that the decayed sum matches the legacy 60fps total
        // at any actual framerate. At 60fps inputScale = 1 (no-op).
        const inputScale = camera.movement.getFrameIndependentInputScale(camera.inertia);
        if (camera.lowerRadiusLimit) {
            const lowerLimit = camera.lowerRadiusLimit ?? 0;
            if (camera.radius - (this._zoomToMouseRadiusOffset + delta * inputScale) / inertiaComp < lowerLimit) {
                delta = ((camera.radius - lowerLimit) * inertiaComp - this._zoomToMouseRadiusOffset) / inputScale;
            }
        }
        if (camera.upperRadiusLimit) {
            const upperLimit = camera.upperRadiusLimit ?? 0;
            if (camera.radius - (this._zoomToMouseRadiusOffset + delta * inputScale) / inertiaComp > upperLimit) {
                delta = ((camera.radius - upperLimit) * inertiaComp - this._zoomToMouseRadiusOffset) / inputScale;
            }
        }

        const zoomDistance = delta / inertiaComp;
        const ratio = zoomDistance / camera.radius;
        const vec = this._getPosition();

        // Now this vector tells us how much we also need to pan the camera
        // so the targeted mouse location becomes the center of zooming.

        const directionToZoomLocation = TmpVectors.Vector3[6];
        vec.subtractToRef(camera.target, directionToZoomLocation);
        directionToZoomLocation.scaleInPlace(ratio);
        directionToZoomLocation.scaleInPlace(inertiaComp);

        directionToZoomLocation.scaleInPlace(inputScale);
        this._inertialPanning.addInPlace(directionToZoomLocation);

        this._zoomToMouseRadiusOffset += delta * inputScale;
    }

    // Sets x y or z of passed in vector to zero if less than Epsilon.
    private _zeroIfClose(vec: Vector3) {
        if (Math.abs(vec.x) < Epsilon) {
            vec.x = 0;
        }
        if (Math.abs(vec.y) < Epsilon) {
            vec.y = 0;
        }
        if (Math.abs(vec.z) < Epsilon) {
            vec.z = 0;
        }
    }
}

(<any>CameraInputTypes)["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
