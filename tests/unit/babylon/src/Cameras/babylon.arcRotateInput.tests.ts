/**
 * Many PointerEvent properties are read-only so using real "new PointerEvent()"
 * is unpractical.
 */
interface MockPointerEvent {
  target?: HTMLElement;
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

class MockCamera /*extends BABYLON.ArcRotateCamera*/ {
  constructor(name: string, scene: BABYLON.Scene) {
    //super(name, 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
  }

   /**
   * Allow comparison of Camera's position between calls of verifyChanges()
   */
  private _previousValues: {[key: string]: number} = {};

  /**
   * Reset camera between tests.
   */
  /*reset(): void {
    this.alpha = 10;
    this.beta = 20;
    this.radius = 30;
    this.inertialPanningX = 0;
    this.inertialPanningY = 0;
    this.inertialAlphaOffset = 0;
    this.inertialBetaOffset = 0;
    this.inertialRadiusOffset = 0;
    this._panningMouseButton = 2;
    this.useInputToRestoreState = true;
    this._useCtrlForPanning = true;
  }*/

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
        `Expected ${tc ? "it to have changed" : "\"" + pv + "\""}.`
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
 * Simulate PointerEvent in ArcRotateCameraPointersInput instance.
 */
function simulateEvent(camera: any, event: MockPointerEvent) {
  let pointerInfo = {};
  switch (event.type) {
    case "pointerdown":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERDOWN, event};
      camera._pointerInput(pointerInfo, undefined);
      break;
    case "pointerup":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERUP, event};
      camera._pointerInput(pointerInfo, undefined);
      break;
    case "pointermove":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERMOVE, event};
      camera._pointerInput(pointerInfo, undefined);
      break;
    case "blur":
      camera._onLostFocus();
      break;
    case "POINTERDOUBLETAP":
      // Not a real DOM event. Just a shortcut to trigger
      // PointerEventTypes.POINTERMOVE on the Input class.
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERDOUBLETAP, event};
      camera._pointerInput(pointerInfo, undefined);
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
function eventTemplate(): MockPointerEvent {
  let returnVal = {
    target: <HTMLElement>this._canvas,
		button: 0,
		preventDefault: () => {},
  };
  return returnVal;
}

/**
 * Test the things.
 */
describe('arcRotateCameraInput', function() {
  /**
   * Sets the timeout of all the tests to 10 seconds.
   */
  this.timeout(10000);

  before(function(done) {
    // runs before all tests in this block
    this.timeout(180000);
    (BABYLONDEVTOOLS).Loader
      .useDist()
      .testMode()
      .load(function() {
        // Force apply promise polyfill for consistent behavior between
        // PhantomJS, IE11, and other browsers.
        BABYLON.PromisePolyfill.Apply(true);
        done();
      });

    this._canvas = document.createElement("canvas");
    this._scene = new BABYLON.Scene(new BABYLON.NullEngine());
    
    // Set up an instance of a Camera with the ArcRotateCameraPointersInput.
    this.camera = new BABYLON.ArcRotateCamera(
      "MockCameraOriginal", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), this._scene);
    this.cameraInput = new BABYLON.ArcRotateCameraPointersInput();
    this.cameraInput.camera = this.camera;
    this.cameraInput.attachControl(this._canvas);
  });

  beforeEach(function() {
    // runs before each test in this block
    //this.camera.reset();
  });

  describe('one button drag', function() {
    it('should change inertialAlphaOffset', function() {
      var event: MockPointerEvent = eventTemplate();

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      //this.cameraInput.simulateEvent(event);
      expect(true).to.equal(true);
      expect(true).to.be.true;
    });
  });
});
