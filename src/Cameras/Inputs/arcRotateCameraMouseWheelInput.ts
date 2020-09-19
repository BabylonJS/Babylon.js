import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { EventState, Observer } from "../../Misc/observable";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Scalar } from '../../Maths/math.scalar';

/**
 * Manage the mouse wheel inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
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
     * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when wheel is used.
     */
    @serialize()
    public wheelDeltaPercentage = 0;

    private _wheel: Nullable<(p: PointerInfo, s: EventState) => void>;
    private _observer: Nullable<Observer<PointerInfo>>;

    private computeDeltaFromMouseWheelLegacyEvent(mouseWheelDelta: number, radius: number) {
        var delta = 0;
        var wheelDelta = (mouseWheelDelta * 0.01 * this.wheelDeltaPercentage) * radius;
        if (mouseWheelDelta > 0) {
            delta = wheelDelta / (1.0 + this.wheelDeltaPercentage);
        } else {
            delta = wheelDelta * (1.0 + this.wheelDeltaPercentage);
        }
        return delta;
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        this._wheel = (p, s) => {
            //sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) { return; }
            var event = <MouseWheelEvent>p.event;
            var delta = 0;

            let mouseWheelLegacyEvent = event as any;
            let wheelDelta = 0;

            if (mouseWheelLegacyEvent.wheelDelta) {
                wheelDelta = mouseWheelLegacyEvent.wheelDelta;
            } else {
                wheelDelta = -(event.deltaY || event.detail) * 60;
            }

            if (this.wheelDeltaPercentage) {
                delta = this.computeDeltaFromMouseWheelLegacyEvent(wheelDelta, this.camera.radius);

                // If zooming in, estimate the target radius and use that to compute the delta for inertia
                // this will stop multiple scroll events zooming in from adding too much inertia
                if (delta > 0) {
                    var estimatedTargetRadius = this.camera.radius;
                    var targetInertia = this.camera.inertialRadiusOffset + delta;
                    for (var i = 0; i < 20 && Math.abs(targetInertia) > 0.001; i++) {
                        estimatedTargetRadius -= targetInertia;
                        targetInertia *= this.camera.inertia;
                    }
                    estimatedTargetRadius = Scalar.Clamp(estimatedTargetRadius, 0, Number.MAX_VALUE);
                    delta = this.computeDeltaFromMouseWheelLegacyEvent(wheelDelta, estimatedTargetRadius);
                }
            } else {
                delta = wheelDelta / (this.wheelPrecision * 40);
            }

            if (delta) {
                this.camera.inertialRadiusOffset += delta;
            }

            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(this._wheel, PointerEventTypes.POINTERWHEEL);
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }

    /**
     * Gets the class name of the current intput.
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
}

(<any>CameraInputTypes)["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
