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
    private _isPinching: boolean = false;

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     */
    protected onTouch(point: Nullable<PointerTouch>,
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
    protected onDoubleTap(type: string) {
        if (this.camera.useInputToRestoreState) {
            this.camera.restoreState();
        }
    }

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     */
    protected onMultiTouch(pointA: Nullable<PointerTouch>,
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
            if (this._isPinching ||
              (this._twoFingerActivityCount < 20 &&
               Math.abs(pinchDistance - previousPinchDistance) >
               this.camera.pinchToPanMaxDistance)) {
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
                this._isPinching = true;
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
        this._isPinching = false;
    }

    /**
     * Called when window becomes inactive.
     */
    protected onLostFocus(): void {
        this._isPanClick = false;
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
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

  private _previousValues: {[key: string]: number} = {};

  summaryForDisplay(): {[key: string]: number} {
    return {
      alpha: this.alpha,
      beta: this.beta,
      radius: this.radius,
      inertialPanningX: this.inertialPanningX,
      inertialPanningY: this.inertialPanningY,
      inertialAlphaOffset: this.inertialAlphaOffset,
      inertialBetaOffset: this.inertialBetaOffset,
      inertialRadiusOffset: this.inertialRadiusOffset
    };
  }

  reset(): void {
    this.alpha = 0;
    this.beta = 0;
    this.radius = 0;
    this.inertialPanningX = 0;
    this.inertialPanningY = 0;
    this.inertialAlphaOffset = 0;
    this.inertialBetaOffset = 0;
    this.inertialRadiusOffset = 0;
    this._panningMouseButton = 2;
    this.useInputToRestoreState = true;
    this._useCtrlForPanning = true;
  }

  setTestPosition(): void {
    this.alpha = 10;
    this.beta = 20;
    this.radius = 30;
  }

  /**
   * Ensure any listed variables have changed since last time this method was run.
   * If a variable is not listed, check it has /not/ changed.
   */
  verifyChanges(toCheck: {[key: string]: boolean}): boolean {
    let result = true;
    const checkValues = ["alpha", "beta", "radius", "inertialPanningX", "inertialPanningY",
      "inertialAlphaOffset", "inertialBetaOffset", "inertialRadiusOffset"];

    checkValues.forEach((key) => {
      let tc = toCheck[key] || false;
      let pv = this._previousValues[key] || 0;
      let tmpResult = (tc === ((<any>this)[key] !== pv));
      console.assert(
        tmpResult,
        `Value of "${key}" was "${(<any>this)[key]}". ` +
        `Expected ${tc ? "it to have changed" : "\"" + pv +"\""}.`
      );
      result = result && tmpResult;
      this._previousValues[key] = (<any>this)[key];
    });

    return result;
  }

  verifyPrepare(): void {
    const checkValues = ["alpha", "beta", "radius", "inertialPanningX", "inertialPanningY",
      "inertialAlphaOffset", "inertialBetaOffset", "inertialRadiusOffset"];

    checkValues.forEach((key) => {
      this._previousValues[key] = (<any>this)[key];
    });
  }
}

interface MockPointerEvent {
  target: HTMLElement;
  type?: string;
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

  simulateEvent(event: MockPointerEvent) {
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
      case "POINTERDOUBLETAP":
        // Not a real DOM event. Just a shortcut to trigger
        // PointerEventTypes.POINTERMOVE on the Input class.
        pointerInfo = {type: PointerEventTypes.POINTERDOUBLETAP, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputTesting)._pointerInput(pointerInfo, undefined);
        break;
      default:
        console.error("Invalid pointer event: " + event.type);
    }
  }

  eventTemplate(): MockPointerEvent {
    return {
      target: <HTMLElement>this._canvas,
      button: 0,
      preventDefault: () => {},
    }
  }

  resetEnviroment(): void {
    this.arcOriginal.reset();
    this.arcTesting.reset();
    this.arcOriginal.setTestPosition();
    this.arcTesting.setTestPosition();
    this.arcOriginal.verifyPrepare();
    this.arcTesting.verifyPrepare();

    // _onLostFocus() method of Inputs clears current pointer state.
    (<any>this.arcInputOriginal)._onLostFocus();
    (<any>this.arcInputTesting)._onLostFocus();
  }

  compareCameras(quiet?: boolean): boolean {
    let returnVal = (
      this.arcOriginal.alpha === this.arcTesting.alpha &&
      this.arcOriginal.beta === this.arcTesting.beta &&
      this.arcOriginal.radius === this.arcTesting.radius &&
      this.arcOriginal.inertialPanningX === this.arcTesting.inertialPanningX &&
      this.arcOriginal.inertialPanningY === this.arcTesting.inertialPanningY &&
      this.arcOriginal.inertialAlphaOffset === this.arcTesting.inertialAlphaOffset &&
      this.arcOriginal.inertialBetaOffset === this.arcTesting.inertialBetaOffset &&
      this.arcOriginal.inertialRadiusOffset === this.arcTesting.inertialRadiusOffset
    );
    if(!quiet) {
      console.assert(returnVal, "Cammera values differ.");
    }
    return returnVal;
  }

  displayCameras(): void {
    let output: {[key: string]: {[key: string]: number}} = {};
    output[this.arcOriginal.name] = this.arcOriginal.summaryForDisplay();
    output[this.arcTesting.name] = this.arcTesting.summaryForDisplay();
    if(!this.compareCameras(true)) {
      console.error("Camera settings differ:");
    }
    console.table(output);
  }

  runTests(): void {
    var name: string;
    for(name in this) {
      if(name.split("_")[0] === "test") {
        console.log(`testing: ${name}`);
        let result = (<any>this)[name]();
        console.log(`%c${name} ${result ? "passed" : "failed"}`,
                    `color: ${result ? "green" : "red"};`);
        //if(!result) {
          this.displayCameras();
        //}
      }
    }
  }

  /**
   * One button down with pointer moving.
   * panningSensibility !== 0 will make ctrlKey or camera._panningMouseButton
   * pan the camera instead of changing direction.
   * Will cause camera.inertialPanningX  and camera.inertialPanningY to change.
   */
  test_oneButtonDownDragPan(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Enable panning on pointer drag.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputTesting.panningSensibility = 3;
    this.arcOriginal._useCtrlForPanning = true;
    this.arcTesting._useCtrlForPanning = true;


    var event: MockPointerEvent = this.eventTemplate();

    // Button down.
    event.type = "pointerdown";
    event.clientX = 100;
    event.clientY = 200;
    event.button = 0;
    this.simulateEvent(event);

    result = result && this.compareCameras();

    // Start moving.
    event.type = "pointermove";
    event.button = 0;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X coordinate. Not panning yet.
    event.type = "pointermove";
    event.clientX = 1000;
    event.button = 0;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // Move Y coordinate. Panning due to event.ctrlKey.
    event.type = "pointermove";
    event.clientY = 1000;
    event.button = 0;
    event.ctrlKey = true;  // Will cause pan motion.
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({inertialPanningY: true}) && result;
    result = result && this.compareCameras();

    // Button up. Primary button.
    event.type = "pointerup";
    event.button = 0;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Button down. camera._panningMouseButton will cause pan motion to start.
    event.type = "pointerdown";
    event.clientY = 0;
    event.clientX = 0;
    event.button = 2;  // camera._panningMouseButton. Will cause pan motion.
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X and Y coordinate. Panning due to camera._panningMouseButton.
    event.type = "pointermove";
    event.clientX = 500;
    event.clientY = 500;
    event.button = 2;
    event.ctrlKey = false;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges(
      {inertialPanningX: true, inertialPanningY: true}) && result;
    result = result && this.compareCameras();

    // Button up. camera._panningMouseButton.
    event.button = 2;
    event.type = "pointerup";
    this.simulateEvent(event);

    result = result && this.compareCameras();

    // Move X coordinate. (Should have no affect now pointer is up.)
    event.type = "pointermove";
    event.clientX = 1000;
    event.button = 2;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    return result;
  }

  /**
   * One button down with pointer moving.
   * panningSensibility === 0 will mean ctrlKey or camera._panningMouseButton 
   * will have no affect.
   * Will cause camera.inertialAlphaOffset and camera.inertialBetaOffset to
   * change.
   */
  test_oneButtonDownDragDirection(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Disable panning on pointer drag.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputTesting.panningSensibility = 0;

    var event: MockPointerEvent = this.eventTemplate();

    // Button down.
    event.type = "pointerdown";
    event.clientX = 100;
    event.clientY = 200;
    event.button = 1;
    this.simulateEvent(event);

    result = result && this.compareCameras();

    // Start moving.
    event.type = "pointermove";
    event.button = 1;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X coordinate.
    event.type = "pointermove";
    event.clientX = 1000;
    event.button = 1;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // Move Y coordinate.
    event.type = "pointermove";
    event.clientY = 1000;
    event.ctrlKey = true;  // Will have no affect since panningSensibility === 0.
    event.button = 1;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // Button up.
    event.type = "pointerup";
    event.button = 1;
    this.simulateEvent(event);

    result = result && this.compareCameras();

    // Move X coordinate. (Should have no affect now pointer is up.)
    event.type = "pointermove";
    event.clientX = 1000;
    event.button = 1;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Button down. Button matches _panningMouseButton so it would pan if
    // panningSensibility was > 0.
    event.type = "pointerdown";
    event.clientX = 100;
    event.clientY = 200;
    event.button = 2;
    this.simulateEvent(event);

    // Start moving.
    event.type = "pointermove";
    event.button = 2;
    this.simulateEvent(event);

    result = result && this.compareCameras();
    // Move X and Y coordinate.
    event.type = "pointermove";
    event.clientY = 500;
    event.clientX = 500;
    event.ctrlKey = false;
    event.button = 2;  // camera._panningMouseButton. No affect since panningSensibility === 0.
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges(
      {inertialAlphaOffset: true, inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // Button up.
    event.type = "pointerup";
    event.button = 1;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    return result;
  }

  /**
   * Double mouse clicks restore camera saved position.
   * useInputToRestoreState is used to enable/disable this feature.
   */
  test_doubleClickRestoresState(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    this.arcOriginal.setTestPosition();
    this.arcTesting.setTestPosition();
    result = result && this.compareCameras();

    this.arcOriginal.storeState();
    this.arcTesting.storeState();
    result = result && this.compareCameras();

    this.arcOriginal.reset();
    this.arcTesting.reset();
    result = result && this.compareCameras();

    // Disable POINTERDOUBLETAP restore.
    this.arcOriginal.useInputToRestoreState = false;
    this.arcTesting.useInputToRestoreState = false;

    // Set the values expected on this camera to be the current ones.
    this.arcOriginal.verifyPrepare();

    var event: MockPointerEvent = this.eventTemplate();
    event.type = "POINTERDOUBLETAP";
    this.simulateEvent(event);

    // No change in camera values after POINTERDOUBLETAP.
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Enable POINTERDOUBLETAP restore.
    this.arcOriginal.useInputToRestoreState = true;
    this.arcTesting.useInputToRestoreState = true;

    var event: MockPointerEvent = this.eventTemplate();
    event.type = "POINTERDOUBLETAP";
    this.simulateEvent(event);

    // Change in camera values after POINTERDOUBLETAP.
    result = this.arcOriginal.verifyChanges({alpha: true, beta: true, radius: true}) && result;
    result = result && this.compareCameras();

    return result;
  }

  test_twoButtonsDownPinchZoomPercentage(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputTesting.multiTouchPanAndZoom = true;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 10;
    this.arcInputTesting.pinchDeltaPercentage = 10;
    // Panning not enabled.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputTesting.panningSensibility = 0;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 200;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start moving before 2nd button has been pressed.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X coordinate.
    event.type = "pointermove";
    event.clientX = 1500;
    event.clientY = 200;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // 2nd button down. (Enter zoom mode.)
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Start move of 2nd pointer.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move Y coordinate. 2nd point is the one moving.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2500;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // Move X and Y coordinate. 1st point is the one moving.
    event.type = "pointermove";
    event.clientX = 1700;
    event.clientY = 1700;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // One of the buttons button up. (Leave zoom mode.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Move X and Y coordinate of remaining pressed point.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2700;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // Other button button up. (Now moves should have no affect.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Move X and Y coordinate.
    event.type = "pointermove";
    event.clientX = 3000;
    event.clientY = 4000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();
    
    return result;
  }

  test_twoButtonsDownPinchZoomLinear(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputTesting.multiTouchPanAndZoom = true;
    // Zoom changes are a set value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputTesting.pinchDeltaPercentage = 0;
    // Panning not enabled.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputTesting.panningSensibility = 0;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 200;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start moving before 2nd button has been pressed.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X coordinate.
    event.type = "pointermove";
    event.clientX = 1500;
    event.clientY = 200;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // 2nd button down. (Enter zoom mode.)
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Start move of 2nd pointer.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move Y coordinate. 2nd point is the one moving.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2500;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // Move X + Y coordinate. 1st point is the one moving.
    event.type = "pointermove";
    event.clientX = 1700;
    event.clientY = 1700;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // One of the buttons button up. (Leave zoom mode.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Move X and Y coordinate of remaining pressed point.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2700;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // Other button button up. (Now moves should have no affect.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Move X and Y coordinate.
    event.type = "pointermove";
    event.clientX = 3000;
    event.clientY = 4000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();
    
    return result;
  }

  test_twoButtonsDownPan(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputTesting.multiTouchPanAndZoom = true;
    // Zoom changes are a set value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputTesting.pinchDeltaPercentage = 0;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputTesting.panningSensibility = 3;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 200;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start moving before 2nd button has been pressed.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X coordinate.
    event.type = "pointermove";
    event.clientX = 1500;
    event.clientY = 200;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // 2nd button down. (Enter zoom mode.)
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Start move of 2nd pointer.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move Y coordinate. 2nd point is the one moving.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2500;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges(
      {inertialPanningY: true, inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // Move X + Y coordinate. 1st point is the one moving.
    event.type = "pointermove";
    event.clientX = 1700;
    event.clientY = 1700;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges(
      {inertialPanningX: true, inertialPanningY: true, inertialRadiusOffset: true}
    ) && result;
    result = result && this.compareCameras();

    // One of the buttons button up. (Leave zoom mode.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move X and Y coordinate of remaining pressed point.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2700;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // Other button button up. (Now moves should have no affect.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Move X and Y coordinate.
    event.type = "pointermove";
    event.clientX = 3000;
    event.clientY = 4000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();
    
    return result;
  }

  test_MutiTouchPinchZoomPercentage(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses not interpreted as multitouch.
    this.arcInputOriginal.multiTouchPanAndZoom = false;
    this.arcInputTesting.multiTouchPanAndZoom = false;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 10;
    this.arcInputTesting.pinchDeltaPercentage = 10;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputTesting.panningSensibility = 3;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start move of 1st button.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // 2nd button down. (Enter zoom mode.)
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Start move of 2nd pointer.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move 2nd pointer.
    event.type = "pointermove";
    event.clientX = 3000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // 2nd button up. (Leave zoom mode.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move 1st pointer now it is the only one. Will result in change in alpha or beta.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 3000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges(
      {inertialAlphaOffset: true, inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // 1st button down again.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start move of 1st button.
    // This time trigger more than 20 pointermove events without moving more
    // than pinchToPanMaxDistance to lock into "pan" mode.
    event.type = "pointermove";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = -1;
    event.pointerId = 1;
    
    let debugExplination = 
      "Camera position is not exactly the same after panning. " +
      "This is due to arcRotateCamera using different methods to calculate " +
      "distance between pointers in different parts of the code. " +
      "The trends between cameras are the same though.";
    let debugInternalPanningXOriginal = [];
    let debugInternalPanningXTesting = [];

    for(let i = 0; i < 21; i++) {
      event.clientX++;
      this.simulateEvent(event);

      debugInternalPanningXOriginal.push(this.arcOriginal.inertialPanningX);
      debugInternalPanningXTesting.push(this.arcTesting.inertialPanningX);
    }
    console.warn(debugExplination);
    console.table({debugInternalPanningXOriginal, debugInternalPanningXTesting});

    result = this.arcOriginal.verifyChanges({inertialPanningX: true}) && result;
    result = result && this.compareCameras();

    // Now we are in "pan" mode, we can move 1st pointer larger distances.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 1000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialPanningX: true}) && result;
    result = result && this.compareCameras();

    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialPanningY: true}) && result;
    result = result && this.compareCameras();

    return result;
  }

  test_MutiTouchPinchZoomLinear(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses not interpreted as multitouch.
    this.arcInputOriginal.multiTouchPanAndZoom = false;
    this.arcInputTesting.multiTouchPanAndZoom = false;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputTesting.pinchDeltaPercentage = 0;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputTesting.panningSensibility = 3;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start move of 1st button.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // 2nd button down. (Enter zoom mode.)
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = result && this.compareCameras();

    // Start move of 2nd pointer.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move 2nd pointer.
    event.type = "pointermove";
    event.clientX = 3000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialRadiusOffset: true}) && result;
    result = result && this.compareCameras();

    // 2nd button up. (Leave zoom mode.)
    event.type = "pointerup";
    event.pointerType = "touch";
    event.button = 1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    // Move 1st pointer now it is the only one. Will result in change in alpha or beta.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 3000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges(
      {inertialAlphaOffset: true, inertialBetaOffset: true}) && result;
    result = result && this.compareCameras();

    // 1st button down again.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start move of 1st button.
    // This time trigger more than 20 pointermove events without moving more
    // than pinchToPanMaxDistance to lock into "pan" mode.
    event.type = "pointermove";
    event.clientX = 1000;
    event.clientY = 1000;
    event.button = -1;
    event.pointerId = 1;

    let debugExplination = 
      "Camera position is not exactly the same after panning. " +
      "This is due to arcRotateCamera using different methods to calculate " +
      "distance between pointers in different parts of the code. " +
      "The trends between cameras are the same though.";
    let debugInternalPanningXOriginal = [];
    let debugInternalPanningXTesting = [];

    for(let i = 0; i < 21; i++) {
      event.clientX++;
      this.simulateEvent(event);

      debugInternalPanningXOriginal.push(this.arcOriginal.inertialPanningX);
      debugInternalPanningXTesting.push(this.arcTesting.inertialPanningX);
    }
    console.warn(debugExplination);
    console.table({debugInternalPanningXOriginal, debugInternalPanningXTesting});

    result = this.arcOriginal.verifyChanges({inertialPanningX: true}) && result;
    result = result && this.compareCameras();

    // Now we are in "pan" mode, we can move 1st pointer larger distances.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 1000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialPanningX: true}) && result;
    result = result && this.compareCameras();

    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2000;
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({inertialPanningY: true}) && result;
    result = result && this.compareCameras();

    return result;
  }

    /*test_MutiTouchSwipePan(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();
    // TODO
    return result;
  }

  test_LooseFocusCancelsDrag(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();
    // TODO
    return result;
  }

  test_LooseFocusCancelsDoubleDrag(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();
    // TODO
    return result;
  }*/
}
