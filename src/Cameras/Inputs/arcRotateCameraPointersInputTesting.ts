import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraPointersInput } from "../../Cameras/Inputs/BaseCameraPointersInput";
import { PointerTouch } from "../../Events/pointerEvents";

/**
 * Manage the pointers inputs to control an ArcRotate camera.
 * 
 * TODO(mrdunk) This class is an experimental replacement for
 * ArcRotateCameraPointersInput in src/Cameras/Inputs/arcRotateCameraPointersInput.ts.
 * If successful this file will replace arcRotateCameraPointersInput.ts
 * and this class renamed ArcRotateCameraPointersInput.
 */
export class ArcRotateCameraPointersInputTesting extends BaseCameraPointersInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * The class name of the current input.
     */
    protected _className = "ArcRotateCameraPointersInputTesting";

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Defines the pointer angular sensibility  along the X axis or how fast is
     * the camera rotating.
     */
    @serialize()
    public angularSensibilityX = 1000.0;

    /**
     * Defines the pointer angular sensibility along the Y axis or how fast is
     * the camera rotating.
     */
    @serialize()
    public angularSensibilityY = 1000.0;

    /**
     * Defines the pointer pinch precision or how fast is the camera zooming.
     */
    @serialize()
    public pinchPrecision = 12.0;

    /**
     * pinchDeltaPercentage will be used instead of pinchPrecision if different
     * from 0.
     * It defines the percentage of current camera.radius to use as delta when
     * pinch zoom is used.
     */
    @serialize()
    public pinchDeltaPercentage = 0;

    /**
     * Defines the pointer panning sensibility or how fast is the camera moving.
     */
    @serialize()
    public panningSensibility: number = 1000.0;

    /**
     * Defines whether panning (2 fingers swipe) is enabled through multitouch.
     */
    @serialize()
    public multiTouchPanning: boolean = true;

    /**
     * Defines whether panning is enabled for both pan (2 fingers swipe) and
     * zoom (pinch) through multitouch.
     */
    @serialize()
    public multiTouchPanAndZoom: boolean = true;

    /**
     * Revers pinch action direction.
     */
    public pinchInwards = true;

    private _isPanClick: boolean = false;
    private _twoFingerActivityCount: number = 0;

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     */
    protected doTouch(point: Nullable<PointerTouch>,
                      offsetX: number,
                      offsetY: number): void {
        if (this.panningSensibility !== 0 &&
          ((this._ctrlKey && this.camera._useCtrlForPanning) || this._isPanClick)) {
            this.camera.inertialPanningX += -offsetX / this.panningSensibility;
            this.camera.inertialPanningY += offsetY / this.panningSensibility;
        } else {
            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
        }
    }

    /**
     * Called on pointer POINTERDOUBLETAP event.
     */
    protected doDoubleTap(type: string) {
        if (this.camera.useInputToRestoreState) {
            this.camera.restoreState();
        }
    }

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     */
    protected doMultiTouch(pointA: Nullable<PointerTouch>,
                           pointB: Nullable<PointerTouch>,
                           previousPinchSquaredDistance: number,
                           pinchSquaredDistance: number,
                           previousMultiTouchPanPosition: Nullable<PointerTouch>,
                           multiTouchPanPosition: Nullable<PointerTouch>): void
    {
        if (previousPinchSquaredDistance === 0 && previousMultiTouchPanPosition === null) {
            // First time this method is called for new pinch.
            // Next time this is called there will be a
            // previousPinchSquaredDistance and pinchSquaredDistance to compare.
            return;
        }
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            // Last time this method is called at the end of a pinch.
            return;
        }

        var direction = this.pinchInwards ? 1 : -1;

        if (this.multiTouchPanAndZoom) {
            if (this.pinchDeltaPercentage) {
                this.camera.inertialRadiusOffset +=
                    (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 *
                    this.camera.radius * this.pinchDeltaPercentage;
            } else {
                this.camera.inertialRadiusOffset += 
                    (pinchSquaredDistance - previousPinchSquaredDistance) /
                    (this.pinchPrecision * direction *
                    (this.angularSensibilityX + this.angularSensibilityY) / 2);
            }

            if (this.panningSensibility !== 0 &&
              previousMultiTouchPanPosition && multiTouchPanPosition) {
                var moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
                var moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
                this.camera.inertialPanningX += -moveDeltaX / this.panningSensibility;
                this.camera.inertialPanningY += moveDeltaY / this.panningSensibility;
            }
        } else {
            this._twoFingerActivityCount++;
            var previousPinchDistance = Math.sqrt(previousPinchSquaredDistance);
            var pinchDistance = Math.sqrt(pinchSquaredDistance);
            if (this._twoFingerActivityCount < 20 &&
              Math.abs(pinchDistance - previousPinchDistance) >
              this.camera.pinchToPanMaxDistance) {
                // Since pinch has not been active long, assume we intend to zoom.
                if (this.pinchDeltaPercentage) {
                    this.camera.inertialRadiusOffset +=
                      (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 *
                      this.camera.radius * this.pinchDeltaPercentage;
                } else {
                    this.camera.inertialRadiusOffset += 
                        (pinchSquaredDistance - previousPinchSquaredDistance) /
                        (this.pinchPrecision * direction *
                        (this.angularSensibilityX + this.angularSensibilityY) / 2);
                }
                      
                // Since we are pinching, remain pinching on next iteration.
                this._twoFingerActivityCount = 0;
            } else {
                // Pause between pinch starting and moving implies not a zoom event.
                // Pan instead.
                if (this.panningSensibility !== 0 && this.multiTouchPanning &&
                  multiTouchPanPosition && previousMultiTouchPanPosition) {
                    var moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
                    var moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
                    this.camera.inertialPanningX += -moveDeltaX / this.panningSensibility;
                    this.camera.inertialPanningY += moveDeltaY / this.panningSensibility;
                }
            }
        }
    }

    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     */
    protected onButtonDown(evt: PointerEvent, buttonCount: number): void {
        this._isPanClick = evt.button === this.camera._panningMouseButton;
    }

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     */
    protected onButtonUp(evt: PointerEvent): void {
        this._twoFingerActivityCount = 0;
    }

    /**
     * Called when window becomes inactive.
     */
    protected onLostFocus(): void {
        this._isPanClick = false;
        this._twoFingerActivityCount = 0;
    }
}
(<any>CameraInputTypes)["ArcRotateCameraPointersInputTesting"] =
  ArcRotateCameraPointersInputTesting;

/**
 * Below this point is all temporary code to verify that
 * ArcRotateCameraPointersInputTesting functionality matches
 * ArcRotateCameraPointersInput exactly.
 * TODO(mrdunk) Delete Test_ArcRotateCameraPointersInput and associated code
 * once testing is complete.
 */
import { ArcRotateCameraPointersInput } from "../../Cameras/Inputs/arcRotateCameraPointersInput";
import { Vector3 } from "../../Maths/math";
import { Scene } from "../../scene";
import { NullEngine } from "../../Engines/nullEngine";
import { PointerEventTypes } from "../../Events/pointerEvents";

class MockCamera extends ArcRotateCamera {
  constructor(name: string) {
    super(name, 0, 0, 0, new Vector3(0, 0, 0), new Scene(new NullEngine()));
  }

  display(): void {
    console.log(this.alpha, this.beta, this.radius,
                this.inertialPanningX, this.inertialPanningY,
                this.inertialAlphaOffset, this.inertialBetaOffset);
  }
}

interface MockMouseEvent {
  target: HTMLElement;
  button?: number;
  pointerId?: number;
  pointerType?: string;
  clientX?: number;
  clientY?: number;
  movementX?: number;
  movementY?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  buttons?: number[];
  [propName: string]: any;
}

export class Test_ArcRotateCameraPointersInput {
  private _canvas: Nullable<HTMLCanvasElement>;

  public arcOriginal: MockCamera;
  public arcTesting: MockCamera;
  public arcInputOriginal: ArcRotateCameraPointersInput;
  public arcInputTesting: ArcRotateCameraPointersInputTesting;

  constructor() {
    this._canvas = document.createElement("canvas");;

    // Set up an instance of a Camera with the original ArcRotateCameraPointersInput.
    this.arcOriginal = new MockCamera("MockCameraOriginal");
    this.arcInputOriginal = new ArcRotateCameraPointersInput();
    this.arcInputOriginal.camera = this.arcOriginal;
    this.arcInputOriginal.attachControl(this._canvas);

    // Set up an instance of a Camera with the experimental ArcRotateCameraPointersInput.
    this.arcTesting = new MockCamera("MockCameraTesting");
    this.arcInputTesting = new ArcRotateCameraPointersInputTesting();
    this.arcInputTesting.camera = this.arcTesting;
    this.arcInputTesting.attachControl(this._canvas);
  }

  simulateEvent(event: MouseEvent | MockMouseEvent) {
    let pointerInfo = {};
    switch(event.type) {
      case "pointerdown":
        pointerInfo = {type: PointerEventTypes.POINTERDOWN, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputTesting)._pointerInput(pointerInfo, undefined);
        break;
      case "pointerup":
        pointerInfo = {type: PointerEventTypes.POINTERUP, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputTesting)._pointerInput(pointerInfo, undefined);
        break;
      case "pointermove":
        pointerInfo = {type: PointerEventTypes.POINTERMOVE, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputTesting)._pointerInput(pointerInfo, undefined);
        break;
      case "blur":
        (<any>this.arcInputOriginal)._onLostFocus();
        (<any>this.arcInputTesting)._onLostFocus();
        break;
      default:
        console.error("Invalid pointer event: " + event.type);
    }
  }

  eventTemplate(): MockMouseEvent {
    return {
      target: <HTMLElement>this._canvas,
      button: 0,
      preventDefault: () => {},
    }
  }

  compareCameras(): boolean {
    console.assert(this.arcOriginal.alpha === this.arcTesting.alpha);
    console.assert(this.arcOriginal.beta === this.arcTesting.beta);
    console.assert(this.arcOriginal.radius === this.arcTesting.radius);
    console.assert(this.arcOriginal.inertialPanningX === this.arcTesting.inertialPanningX);
    console.assert(this.arcOriginal.inertialPanningY === this.arcTesting.inertialPanningY);
    console.assert(this.arcOriginal.inertialAlphaOffset === this.arcTesting.inertialAlphaOffset);
    console.assert(this.arcOriginal.inertialBetaOffset === this.arcTesting.inertialBetaOffset);
    console.assert(this.arcOriginal.inertialRadiusOffset ===
      this.arcTesting.inertialRadiusOffset);
    return (
      this.arcOriginal.alpha === this.arcTesting.alpha &&
      this.arcOriginal.beta === this.arcTesting.beta &&
      this.arcOriginal.radius === this.arcTesting.radius &&
      this.arcOriginal.inertialPanningX === this.arcTesting.inertialPanningX &&
      this.arcOriginal.inertialPanningY === this.arcTesting.inertialPanningY &&
      this.arcOriginal.inertialAlphaOffset === this.arcTesting.inertialAlphaOffset &&
      this.arcOriginal.inertialBetaOffset === this.arcTesting.inertialBetaOffset &&
      this.arcOriginal.inertialRadiusOffset === this.arcTesting.inertialRadiusOffset
    );
  }

  test_oneButtonDownDrag(): boolean {
    var result = this.compareCameras();

    var event: MockMouseEvent = this.eventTemplate();
    event.type = "pointerdown";
    event.clientX = 100;
    event.clientY = 200;
    this.simulateEvent(event);

    result = result && this.compareCameras();

    event.type = "pointermove";
    this.simulateEvent(event);

    result = result && this.compareCameras();

    event.type = "pointermove";
    event.clientX = 1000;
    this.simulateEvent(event);

    result = result && this.compareCameras();

    if(result) {
      console.log("test passed");
    }
    return result;
  }
}
