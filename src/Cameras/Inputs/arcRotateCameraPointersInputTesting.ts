/**
 * This file contains temporary code to verify that
 * ArcRotateCameraPointersInputExperimental functionality matches
 * ArcRotateCameraPointersInput exactly.
 * TODO(mrdunk) Delete Test_ArcRotateCameraPointersInput and associated code
 * once testing is complete.
 */
import { Nullable } from "../../types";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { ArcRotateCameraPointersInput } from "../../Cameras/Inputs/arcRotateCameraPointersInput";
import { ArcRotateCameraPointersInputExperimental } from "../../Cameras/Inputs/arcRotateCameraPointersInputExperimental";
import { Vector3 } from "../../Maths/math";
import { Scene } from "../../scene";
import { NullEngine } from "../../Engines/nullEngine";
import { PointerEventTypes } from "../../Events/pointerEvents";

/**
 * Camera to be used in testing.
 */
class MockCamera extends ArcRotateCamera {
  constructor(name: string) {
    super(name, 0, 0, 0, new Vector3(0, 0, 0), new Scene(new NullEngine()));
  }

  /**
   * Allow comparison of Camera's position between calls of verifyChanges()
   */
  private _previousValues: {[key: string]: number} = {};

  /**
   * Properties to display in debug output.
   */
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

  /**
   * Reset camera between tests.
   */
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

  /**
   * Set camera to some known position.
   */
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

  /**
   * Reset values to be compared by verifyChanges().
   * Run this at the start of any test where verifyChanges() will be used.
   */
  verifyPrepare(): void {
    const checkValues = ["alpha", "beta", "radius", "inertialPanningX", "inertialPanningY",
      "inertialAlphaOffset", "inertialBetaOffset", "inertialRadiusOffset"];

    checkValues.forEach((key) => {
      this._previousValues[key] = (<any>this)[key];
    });
  }
}

/**
 * Many PointerEvent properties are read-only so using real "new PointerEvent()"
 * is unpractical.
 */
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

/**
 * Tests 2 instances of ArcRotateCameraPointersInput and ensures functionality is
 * the same.
 */
export class Test_ArcRotateCameraPointersInput {
  private _canvas: Nullable<HTMLCanvasElement>;
  private _testSummary: {[key: string]: string} = {};

  public arcOriginal: MockCamera;
  public arcExperimental: MockCamera;
  public arcInputOriginal: ArcRotateCameraPointersInput;
  public arcInputExperimental: ArcRotateCameraPointersInputExperimental;

  constructor() {
    this._canvas = document.createElement("canvas");;

    // Set up an instance of a Camera with the original ArcRotateCameraPointersInput.
    this.arcOriginal = new MockCamera("MockCameraOriginal");
    this.arcInputOriginal = new ArcRotateCameraPointersInput();
    this.arcInputOriginal.camera = this.arcOriginal;
    this.arcInputOriginal.attachControl(this._canvas);

    // Set up an instance of a Camera with the experimental ArcRotateCameraPointersInput.
    this.arcExperimental = new MockCamera("MockCameraTesting");
    this.arcInputExperimental = new ArcRotateCameraPointersInputExperimental();
    this.arcInputExperimental.camera = this.arcExperimental;
    this.arcInputExperimental.attachControl(this._canvas);

    // Run the tests.
    this.runTests();
  }

  /**
   * Simulate PointerEvent in ArcRotateCameraPointersInput instance.
   */
  simulateEvent(event: MockPointerEvent) {
    let pointerInfo = {};
    switch(event.type) {
      case "pointerdown":
        pointerInfo = {type: PointerEventTypes.POINTERDOWN, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputExperimental)._pointerInput(pointerInfo, undefined);
        break;
      case "pointerup":
        pointerInfo = {type: PointerEventTypes.POINTERUP, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputExperimental)._pointerInput(pointerInfo, undefined);
        break;
      case "pointermove":
        pointerInfo = {type: PointerEventTypes.POINTERMOVE, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputExperimental)._pointerInput(pointerInfo, undefined);
        break;
      case "blur":
        (<any>this.arcInputOriginal)._onLostFocus();
        (<any>this.arcInputExperimental)._onLostFocus();
        break;
      case "POINTERDOUBLETAP":
        // Not a real DOM event. Just a shortcut to trigger
        // PointerEventTypes.POINTERMOVE on the Input class.
        pointerInfo = {type: PointerEventTypes.POINTERDOUBLETAP, event};
        (<any>this.arcInputOriginal)._pointerInput(pointerInfo, undefined);
        (<any>this.arcInputExperimental)._pointerInput(pointerInfo, undefined);
        break;
      default:
        console.error("Invalid pointer event: " + event.type);
    }
  }

  /**
   * Make a mock Event.
   * Many PointerEvent properties are read-only so using real "new PointerEvent()"
   * is unpractical.
   */ 
  eventTemplate(): MockPointerEvent {
    return {
      target: <HTMLElement>this._canvas,
      button: 0,
      preventDefault: () => {},
    }
  }

  /**
   * Helper method to be used before each test.
   */
  resetEnviroment(): void {
    this.arcOriginal.reset();
    this.arcExperimental.reset();
    this.arcOriginal.setTestPosition();
    this.arcExperimental.setTestPosition();
    this.arcOriginal.verifyPrepare();
    this.arcExperimental.verifyPrepare();

    // _onLostFocus() method of Inputs clears current pointer state.
    (<any>this.arcInputOriginal)._onLostFocus();
    (<any>this.arcInputExperimental)._onLostFocus();
  }

  /**
   * Determine if the cameras controlled by each instance of
   * ArcRotateCameraPointersInput have identical position information.
   */
  compareCameras(quiet?: boolean): boolean {
    let returnVal = (
      this.arcOriginal.alpha === this.arcExperimental.alpha &&
      this.arcOriginal.beta === this.arcExperimental.beta &&
      this.arcOriginal.radius === this.arcExperimental.radius &&
      this.arcOriginal.inertialPanningX === this.arcExperimental.inertialPanningX &&
      this.arcOriginal.inertialPanningY === this.arcExperimental.inertialPanningY &&
      this.arcOriginal.inertialAlphaOffset === this.arcExperimental.inertialAlphaOffset &&
      this.arcOriginal.inertialBetaOffset === this.arcExperimental.inertialBetaOffset &&
      this.arcOriginal.inertialRadiusOffset === this.arcExperimental.inertialRadiusOffset
    );
    if(!quiet) {
      console.assert(returnVal, "Cammera values differ.");
    }
    return returnVal;
  }

  /**
   * Display position information of cameras controlled by each instance of
   * ArcRotateCameraPointersInput.
   */
  displayCameras(): void {
    let output: {[key: string]: {[key: string]: number}} = {};
    output[this.arcOriginal.name] = this.arcOriginal.summaryForDisplay();
    output[this.arcExperimental.name] = this.arcExperimental.summaryForDisplay();
    if(!this.compareCameras(true)) {
      console.error("Camera settings differ:");
    }
    console.table(output);
  }

  /**
   * Test all the tings.
   */
  runTests(): void {
    var name: string;
    // Note this method of getting test names will not survive minification.
    for(name in this) {
      if(name.split("_")[0] === "test") {
        console.group(`${name}`);
        var result = (<any>this)[name]();
        console.log(`%c${name} ${result ? "passed" : "failed"}`,
                    `color: ${result ? "green" : "red"};`);
        if(!result) {
          this.displayCameras();
        }
        console.groupEnd();
        this._testSummary[name] = `${result ? "passed" : "** failed **"}`;
      }
    }
    console.table(this._testSummary);
  }

  /**
   * Test case.
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
    this.arcInputExperimental.panningSensibility = 3;
    this.arcOriginal._useCtrlForPanning = true;
    this.arcExperimental._useCtrlForPanning = true;


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
   * Test case.
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
    this.arcInputExperimental.panningSensibility = 0;

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
   * Test case.
   * Double mouse clicks restore camera saved position.
   * useInputToRestoreState is used to enable/disable this feature.
   */
  test_doubleClickRestoresState(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    this.arcOriginal.setTestPosition();
    this.arcExperimental.setTestPosition();
    result = result && this.compareCameras();

    this.arcOriginal.storeState();
    this.arcExperimental.storeState();
    result = result && this.compareCameras();

    this.arcOriginal.reset();
    this.arcExperimental.reset();
    result = result && this.compareCameras();

    // Disable POINTERDOUBLETAP restore.
    this.arcOriginal.useInputToRestoreState = false;
    this.arcExperimental.useInputToRestoreState = false;

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
    this.arcExperimental.useInputToRestoreState = true;

    var event: MockPointerEvent = this.eventTemplate();
    event.type = "POINTERDOUBLETAP";
    this.simulateEvent(event);

    // Change in camera values after POINTERDOUBLETAP.
    result = this.arcOriginal.verifyChanges({alpha: true, beta: true, radius: true}) && result;
    result = result && this.compareCameras();

    return result;
  }

  /**
   * Test case.
   * 2 pointers can be configured to Zoom when pinching.
   * This tests Zooming when pinchDeltaPercentage > 0.
   */
  test_twoButtonsDownPinchZoomPercentage(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputExperimental.multiTouchPanAndZoom = true;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 10;
    this.arcInputExperimental.pinchDeltaPercentage = 10;
    // Panning not enabled.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputExperimental.panningSensibility = 0;

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

  /**
   * Test case.
   * 2 pointers can be configured to Zoom when pinching.
   * This tests Zooming when pinchDeltaPercentage = 0.
   */
  test_twoButtonsDownPinchZoomLinear(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputExperimental.multiTouchPanAndZoom = true;
    // Zoom changes are a set value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputExperimental.pinchDeltaPercentage = 0;
    // Panning not enabled.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputExperimental.panningSensibility = 0;

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

  /**
   * Test case.
   * 2 pointers can be configured to pan when dragging pointers.
   */
  test_twoButtonsDownPan(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputExperimental.multiTouchPanAndZoom = true;
    // Zoom changes are a set value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputExperimental.pinchDeltaPercentage = 0;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputExperimental.panningSensibility = 3;

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

  /**
   * Test case.
   * An alternative pinch/swipe method.
   * Enabled when multiTouchPanAndZoom = false.
   * This tests zoom on pinch when pinchDeltaPercentage > 0.
   */
  test_MutiTouchPinchZoomPercentage(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses not interpreted as multitouch.
    this.arcInputOriginal.multiTouchPanAndZoom = false;
    this.arcInputExperimental.multiTouchPanAndZoom = false;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 10;
    this.arcInputExperimental.pinchDeltaPercentage = 10;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputExperimental.panningSensibility = 3;

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
      debugInternalPanningXTesting.push(this.arcExperimental.inertialPanningX);
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

  /**
   * Test case.
   * An alternative pinch/swipe method.
   * Enabled when multiTouchPanAndZoom = false.
   * This tests zoom on pinch when pinchDeltaPercentage === 0.
   */
  test_MutiTouchPinchZoomLinear(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses not interpreted as multitouch.
    this.arcInputOriginal.multiTouchPanAndZoom = false;
    this.arcInputExperimental.multiTouchPanAndZoom = false;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 0;
    this.arcInputExperimental.pinchDeltaPercentage = 0;
    // Panning enabled.
    this.arcInputOriginal.panningSensibility = 3;
    this.arcInputExperimental.panningSensibility = 3;

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
      debugInternalPanningXTesting.push(this.arcExperimental.inertialPanningX);
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

  /**
   * Test case.
   * Loosing window focus should reset everything.
   * This test checks a single mouse down is reset.
   */
  test_LooseFocusCancelsDrag(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

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

    // Move X coordinate.
    event.type = "pointermove";
    event.clientX = 1000;
    event.button = 0;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({inertialAlphaOffset: true}) && result;
    result = result && this.compareCameras();

    // Lose window focus.
    (<any>this.arcInputOriginal)._onLostFocus();
    (<any>this.arcInputExperimental)._onLostFocus();

    // Move X coordinate some more, this time with no affect.
    event.type = "pointermove";
    event.clientX = 2000;
    event.button = 0;
    this.simulateEvent(event);

    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    return result;
  }

  /**
   * Test case.
   * Loosing window focus should reset everything.
   * This test checks a double pointer down is reset.
   */
  test_LooseFocusCancelsDoubleDrag(): boolean {
    this.resetEnviroment();
    var result = this.compareCameras();

    // Multiple button presses interpreted as "pinch" and "swipe".
    this.arcInputOriginal.multiTouchPanAndZoom = true;
    this.arcInputExperimental.multiTouchPanAndZoom = true;
    // Zoom changes are a percentage of current value.
    this.arcInputOriginal.pinchDeltaPercentage = 10;
    this.arcInputExperimental.pinchDeltaPercentage = 10;
    // Panning not enabled.
    this.arcInputOriginal.panningSensibility = 0;
    this.arcInputExperimental.panningSensibility = 0;

    var event: MockPointerEvent = this.eventTemplate();

    // 1st button down.
    event.type = "pointerdown";
    event.pointerType = "touch";
    event.clientX = 1000;
    event.clientY = 200;
    event.button = 0;
    event.pointerId = 1;
    this.simulateEvent(event);

    // Start moving pointer.
    event.type = "pointermove";
    event.button = -1;
    event.pointerId = 1;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
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

    // Lose window focus.
    (<any>this.arcInputOriginal)._onLostFocus();
    (<any>this.arcInputExperimental)._onLostFocus();

    // Move Y coordinate some more, this time with no affect.
    event.type = "pointermove";
    event.clientX = 2000;
    event.clientY = 2500;
    event.button = -1;
    event.pointerId = 2;
    this.simulateEvent(event);
    result = this.arcOriginal.verifyChanges({}) && result;
    result = result && this.compareCameras();

    return result;
  }
}
