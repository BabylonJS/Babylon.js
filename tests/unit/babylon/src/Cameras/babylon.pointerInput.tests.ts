/**
 * Mock event interface used in place of real events when testing BaseCameraPointersInput
 * and derived classes.
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

/**
 * Make a mock PointerEvent.
 * Many PointerEvent properties are read-only so using real "new PointerEvent()"
 * is unpractical.
 */
function eventTemplate(target: HTMLElement): MockPointerEvent {
  let returnVal = {
    target,
    button: 0,
    preventDefault: () => {},
  };
  return returnVal;
}

/**
 * Simulate PointerEvent in CameraPointersInput instance.
 */
function simulateEvent(cameraInput: BABYLON.ICameraInput<BABYLON.Camera>,
                       event: MockPointerEvent) {
  let pointerInfo = {};
  switch (event.type) {
    case "pointerdown":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERDOWN, event};
      // Cast "camera" to <any> to relax "private" classification.
      (<any>cameraInput)._pointerInput(pointerInfo, undefined);
      break;
    case "pointerup":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERUP, event};
      // Cast "camera" to <any> to relax "private" classification.
      (<any>cameraInput)._pointerInput(pointerInfo, undefined);
      break;
    case "pointermove":
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERMOVE, event};
      // Cast "camera" to <any> to relax "private" classification.
      (<any>cameraInput)._pointerInput(pointerInfo, undefined);
      break;
    case "blur":
      // Cast "camera" to <any> to relax "private" classification.
      (<any>cameraInput)._onLostFocus();
      break;
    case "POINTERDOUBLETAP":
      // Not a real DOM event. Just a shortcut to trigger
      // PointerEventTypes.POINTERMOVE on the Input class.
      pointerInfo = {type: BABYLON.PointerEventTypes.POINTERDOUBLETAP, event};
      // Cast "camera" to <any> to relax "private" classification.
      (<any>cameraInput)._pointerInput(pointerInfo, undefined);
      break;
    default:
      console.error("Invalid pointer event: " + event.type);
  }
}

/**
 * Override the methods of an existing camera to create a stub for testing
 * BaseCameraPointersInput.
 * @returns An instance of ArcRotateCameraPointersInput with the interesting
 *   methods stubbed out.
 */
function StubCameraInput() {
  // Force our CameraPointersInput instance to type "any" so we can access
  // protected methods from within this function.
  let cameraInput: any = (<any>new BABYLON.ArcRotateCameraPointersInput());

  /**
   * Reset all counters.
   */
  cameraInput.reset = ((): void => {
    cameraInput.countOnDoubleTap = 0;
    cameraInput.countOnTouch = 0;
    cameraInput.countOnMultiTouch = 0;
    cameraInput.countOnContextMenu = 0;
    cameraInput.countOnButtonDown = 0;
    cameraInput.countOnButtonUp = 0;
    cameraInput.countOnLostFocus = 0;

    cameraInput.lastOnDoubleTap = undefined;
    cameraInput.lastOnTouch = undefined;
    cameraInput.lastOnMultiTouch = undefined;
    cameraInput.lastOnContextMenu = undefined;
    cameraInput.lastOnButtonDown = undefined;
    cameraInput.lastOnButtonUp = undefined;
  });

  cameraInput.reset();

  /**
   * Stub out all mothods we want to test as part of the BaseCameraPointersInput testing.
   * These stubs keep track of how many times they were called and 
   */
  cameraInput.onTouch = 
    ((point: BABYLON.Nullable<BABYLON.PointerTouch>, offsetX: number, offsetY: number) => {
      cameraInput.countOnTouch++;
      cameraInput.lastOnTouch = {point, offsetX, offsetY};
    });

  cameraInput.onDoubleTap = ((type: string) => {
    cameraInput.countOnDoubleTap++;
    cameraInput.lastOnDoubleTap = type;
  });

  cameraInput.onMultiTouch = (
    (pointA: BABYLON.Nullable<BABYLON.PointerTouch>,
      pointB: BABYLON.Nullable<BABYLON.PointerTouch>,
      previousPinchSquaredDistance: number,
      pinchSquaredDistance: number,
      previousMultiTouchPanPosition: BABYLON.Nullable<BABYLON.PointerTouch>,
      multiTouchPanPosition: BABYLON.Nullable<BABYLON.PointerTouch>) => 
    {
      cameraInput.countOnMultiTouch++;
      cameraInput.lastOnMultiTouch = {
        pointA,
        pointB,
        previousPinchSquaredDistance,
        pinchSquaredDistance,
        previousMultiTouchPanPosition,
        multiTouchPanPosition,
      };
    });

  cameraInput.onButtonDown = ((evt: PointerEvent) => {
    cameraInput.countOnButtonDown++;
    let buttonCount = cameraInput.pointB !== null ? 2 : 1;
    cameraInput.lastOnButtonDown = {evt, buttonCount};
  });

  cameraInput.onButtonUp = ((evt: PointerEvent) => {
    cameraInput.countOnButtonUp++;
    let buttonCount = cameraInput.pointA !== null ? 1 : 0;
    cameraInput.lastOnButtonUp = {evt, buttonCount};
  });

  cameraInput.onContextMenu = ((evt: PointerEvent) => {
    cameraInput.countOnContextMenu++;
    cameraInput.lastOnContextMenu = evt;
  });

  cameraInput.onLostFocus = (() => {
    cameraInput.countOnLostFocus++;
  });

  return cameraInput;
}

/**
 * Test the things.
 * The BaseCameraPointersInput class first.
 */
describe('BaseCameraPointersInput', function() {
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
    this._engine = new BABYLON.NullEngine();
    this._scene = new BABYLON.Scene(this._engine);
    
    // Set up an instance of a Camera with the ArcRotateCameraPointersInput.
    this.camera = new BABYLON.ArcRotateCamera(
      "StubCamera", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), this._scene);
    this.cameraInput = StubCameraInput();
    this.cameraInput.camera = this.camera;
    this.cameraInput.attachControl(this._canvas);
  });

  beforeEach(function() {
    // runs before each test in this block
    this.cameraInput.reset();
  });

  describe('one button drag', function() {
    it('calls "onTouch" method', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      // Button down but no movement events have fired yet.
      expect(this.cameraInput.countOnTouch).to.equal(0);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(1);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      // Move just started; No value yet.
      expect(this.cameraInput.lastOnTouch.offsetX).to.equal(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.equal(0);

      // Drag.
      event.type = "pointermove";
      event.clientX = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      // Pointer dragged in X direction.
      expect(this.cameraInput.lastOnTouch.offsetX).to.above(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.equal(0);

      // Button up.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      
      // These callbacks were never called.
      expect(this.cameraInput.countOnDoubleTap).to.equal(0);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);
      expect(this.cameraInput.countOnContextMenu).to.equal(0);
      expect(this.cameraInput.countOnLostFocus).to.equal(0);
    });

    it('leaves a clean state allowing repeat calls', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      // Button down but no movement events have fired yet.
      expect(this.cameraInput.countOnTouch).to.equal(0);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(1);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      // Move just started; No value yet.
      expect(this.cameraInput.lastOnTouch.offsetX).to.equal(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.equal(0);

      // Drag.
      event.type = "pointermove";
      event.clientX = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      // Pointer dragged in X direction.
      expect(this.cameraInput.lastOnTouch.offsetX).to.above(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.equal(0);

      // Button up.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      
      // Button down for 2nd time.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      // Button down but no movement events have fired yet.
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(3);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      // Move just started; No value yet.
      expect(this.cameraInput.lastOnTouch.offsetX).to.equal(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.equal(0);

      // Drag again.
      event.type = "pointermove";
      event.clientY = 2000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(4);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      // Pointer dragged in Y direction.
      expect(this.cameraInput.lastOnTouch.offsetX).to.equal(0);
      expect(this.cameraInput.lastOnTouch.offsetY).to.above(0);

      // Button up.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnTouch).to.equal(4);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(2);
      
      // These callbacks were never called.
      expect(this.cameraInput.countOnDoubleTap).to.equal(0);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);
      expect(this.cameraInput.countOnContextMenu).to.equal(0);
      expect(this.cameraInput.countOnLostFocus).to.equal(0);
    });
  });
  
  describe('two button drag', function() {
    it('calls "onMultiTouch" method', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // 1st button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.clientX = 1000;
      event.clientY = 200;
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // Button down but no movement events have fired yet.
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(0);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);

      // Start moving before 2nd button has been pressed.
      event.type = "pointermove";
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // Moving with one button down will start a drag.
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(1);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);

      // Move X coordinate.
      event.type = "pointermove";
      event.clientX = 1500;
      event.clientY = 200;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // One button drag.
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);

      // 2nd button down. (Enter zoom mode.)
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      // 2nd button down but hasn't moved yet.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);

      // Start move of 2nd pointer.
      event.type = "pointermove";
      event.clientX = 2000;
      event.clientY = 2000;
      event.button = -1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      // Start of drag with 2 buttons down.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(1);
      // First time onMultiTouch() is called for a new drag.
      expect(this.cameraInput.lastOnMultiTouch.pinchSquaredDistance).to.be.above(0);
      expect(this.cameraInput.lastOnMultiTouch.multiTouchPanPosition).to.not.be.null;
      // previousPinchSquaredDistance will be null.
      expect(this.cameraInput.lastOnMultiTouch.previousPinchSquaredDistance).to.be.equal(0);
      expect(this.cameraInput.lastOnMultiTouch.previousMultiTouchPanPosition).to.be.null;

      // Move Y coordinate. 2nd point is the one moving.
      event.type = "pointermove";
      event.clientX = 2000;
      event.clientY = 2500;
      event.button = -1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      // Moving two button drag.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(2);
      // Neither first nor last event in a drag so everything populated.
      expect(this.cameraInput.lastOnMultiTouch.pinchSquaredDistance).to.be.above(0);
      expect(this.cameraInput.lastOnMultiTouch.multiTouchPanPosition).to.not.be.null;
      expect(this.cameraInput.lastOnMultiTouch.previousPinchSquaredDistance).to.be.above(0);
      expect(this.cameraInput.lastOnMultiTouch.previousMultiTouchPanPosition).to.not.be.null;

      // Move X and Y coordinate. 1st point is the one moving.
      event.type = "pointermove";
      event.clientX = 1700;
      event.clientY = 1700;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // Moving two button drag.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(3);

      // One of the buttons button up.
      event.type = "pointerup";
      event.pointerType = "touch";
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // Button up.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      expect(this.cameraInput.countOnTouch).to.equal(2);
      expect(this.cameraInput.countOnMultiTouch).to.equal(4);
      // onMultiTouch() is called one last time when drag ends with null value for
      // multiTouchPanPosition.
      expect(this.cameraInput.lastOnMultiTouch.pinchSquaredDistance).to.equal(0);
      expect(this.cameraInput.lastOnMultiTouch.multiTouchPanPosition).to.be.null;
      // previousPinchSquaredDistance and previousMultiTouchPanPosition are
      // populated though.
      expect(this.cameraInput.lastOnMultiTouch.previousPinchSquaredDistance).to.be.above(0);
      expect(this.cameraInput.lastOnMultiTouch.previousMultiTouchPanPosition).to.not.be.null;

      // Move X and Y coordinate of remaining pressed point.
      event.type = "pointermove";
      event.clientX = 2000;
      event.clientY = 2700;
      event.button = -1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      // Back to one button drag.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      expect(this.cameraInput.countOnTouch).to.equal(3);
      expect(this.cameraInput.countOnMultiTouch).to.equal(4);

      // Other button button up. (Now moves should have no affect.)
      event.type = "pointerup";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      // Button up.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(2);
      expect(this.cameraInput.countOnTouch).to.equal(3);
      expect(this.cameraInput.countOnMultiTouch).to.equal(4);

      // Move X and Y coordinate.
      event.type = "pointermove";
      event.clientX = 3000;
      event.clientY = 4000;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      // Not dragging anymore so no change in callbacks.
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(2);
      expect(this.cameraInput.countOnTouch).to.equal(3);
      expect(this.cameraInput.countOnMultiTouch).to.equal(4);

      // These callbacks were never called.
      expect(this.cameraInput.countOnDoubleTap).to.equal(0);
      expect(this.cameraInput.countOnContextMenu).to.equal(0);
      expect(this.cameraInput.countOnLostFocus).to.equal(0);
    });
  });

  describe('button down then up', function() {
    it('calls "onButtonDown" and "onButtonUp"', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // 1st button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.lastOnButtonDown.buttonCount).to.be.equal(1);

      // 2nd button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.lastOnButtonDown.buttonCount).to.be.equal(2);

      // One button up.
      event.type = "pointerup";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      expect(this.cameraInput.lastOnButtonUp.buttonCount).to.be.equal(1);
      
      // Other button up.
      event.type = "pointerup";
      event.pointerType = "touch";
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(2);
      expect(this.cameraInput.lastOnButtonUp.buttonCount).to.be.equal(0);
      
      // These callbacks were never called.
      expect(this.cameraInput.countOnTouch).to.equal(0);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);
      expect(this.cameraInput.countOnDoubleTap).to.equal(0);
      expect(this.cameraInput.countOnContextMenu).to.equal(0);
      expect(this.cameraInput.countOnLostFocus).to.equal(0);
    });

    it('pointerId of pointerup doesnt match', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // 1st button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(1);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.lastOnButtonDown.buttonCount).to.be.equal(1);

      // 2nd button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(2);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.lastOnButtonDown.buttonCount).to.be.equal(2);

      // 3rd button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 2;
      event.pointerId = 3;
      simulateEvent(this.cameraInput, event);
      // Only 2 buttons are tracked.
      // onButtonDown() gets called but nothing else changes.
      expect(this.cameraInput.countOnButtonDown).to.equal(3);
      expect(this.cameraInput.countOnButtonUp).to.equal(0);
      expect(this.cameraInput.lastOnButtonDown.buttonCount).to.be.equal(2);

      // One button up.
      event.type = "pointerup";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 99;
      simulateEvent(this.cameraInput, event);
      expect(this.cameraInput.countOnButtonDown).to.equal(3);
      expect(this.cameraInput.countOnButtonUp).to.equal(1);
      // Button state gets cleared. No buttons registered as being down.
      expect(this.cameraInput.lastOnButtonUp.buttonCount).to.be.equal(0);
      
      // These callbacks were never called.
      expect(this.cameraInput.countOnTouch).to.equal(0);
      expect(this.cameraInput.countOnMultiTouch).to.equal(0);
      expect(this.cameraInput.countOnDoubleTap).to.equal(0);
      expect(this.cameraInput.countOnContextMenu).to.equal(0);
      expect(this.cameraInput.countOnLostFocus).to.equal(0);
    });
  });
});

/**
 * Test the things.
 * The ArcRotateCameraInput class.
 */
describe('ArcRotateCameraInput', function() {
  /**
   * Sets the timeout of all the tests to 10 seconds.
   */
  this.timeout(10000);

  enum ValChange {
    Increase,
    Same,
    Decrease,
    DontCare,
  }

  const interestingValues = [
    "inertialPanningX",
    "inertialPanningY",
    "inertialAlphaOffset",
    "inertialBetaOffset",
    "inertialRadiusOffset",
  ];

  function resetCameraPos(camera: BABYLON.ArcRotateCamera, cameraCachePos: {}) {
    camera.alpha = 10;
    camera.beta = 20;
    camera.radius = 30;
    camera.inertialPanningX = 0;
    camera.inertialPanningY = 0;
    camera.inertialAlphaOffset = 0;
    camera.inertialBetaOffset = 0;
    camera.inertialRadiusOffset = 0;
    camera._panningMouseButton = 2;
    camera.useInputToRestoreState = true;
    camera._useCtrlForPanning = true;
    
    interestingValues.forEach((key) => {
      cameraCachePos[key] = camera[key];
    });
  }

  function verifyChanges(
    camera: BABYLON.ArcRotateCamera,
    cameraCachePos: {},
    toCheck: {[key: string]: ValChange}): boolean {
      let result = true;
      interestingValues.forEach((key) => {
        if (toCheck[key] === undefined) {
          toCheck[key] = ValChange.Same;
        }
        let r = (
          toCheck[key] === ValChange.DontCare ||
          (toCheck[key] === ValChange.Decrease && camera[key] < cameraCachePos[key]) ||
          (toCheck[key] === ValChange.Same && camera[key] === cameraCachePos[key]) ||
          (toCheck[key] === ValChange.Increase && camera[key] > cameraCachePos[key])
        );
        if (!r) {
          console.log(
            `Incorrect value for ${key}, previous: ${cameraCachePos[key]}, current: ${camera[key]}`
          );
        }
        result = result && r;

        cameraCachePos[key] = camera[key];
      });

      if (!result) {
        displayCamera(camera);
      }
      return result;
    }

  function displayCamera(camera: BABYLON.ArcRotateCamera): void {
    let info = {
      inertialPanningX: camera.inertialPanningX,
      inertialPanningY: camera.inertialPanningY,
      inertialAlphaOffset: camera.inertialAlphaOffset,
      inertialBetaOffset: camera.inertialBetaOffset,
      inertialRadiusOffset: camera.inertialRadiusOffset
    };
    console.log(info);
  };

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
      "Camera", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), this._scene);
    this.cameraInput = new BABYLON.ArcRotateCameraPointersInput();
    this.cameraInput.camera = this.camera;
    this.cameraInput.attachControl(this._canvas);

    this.cameraCachePos = {};
  });

  beforeEach(function() {
    // runs before each test in this block
    resetCameraPos(this.camera, this.cameraCachePos);
  });

  describe('Test infrastructure', function() {
    it('verifyChanges checks Decrease', function() {
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10.001;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.true;
      
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 9.999;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.false;
    });
  
    it('verifyChanges checks Same', function() {
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Same})
      ).to.be.true;
      
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10.001;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Same})
      ).to.be.false;
    });
  
    it('verifyChanges checks undefined', function() {
      // If the 'toCheck' field is undefined, treat is as ValChange.Same.
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {})
      ).to.be.true;
      
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10.001;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {})
      ).to.be.false;
    });
  
    it('verifyChanges checks DontCare', function() {
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.DontCare})
      ).to.be.true;
      
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 1001;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.DontCare})
      ).to.be.true;
    });
  
    it('verifyChanges checks Increase', function() {
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 9.999;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Increase})
      ).to.be.true;
      
      this.camera.inertialAlphaOffset = 10;
      this.cameraCachePos.inertialAlphaOffset = 10.001;
      expect(
        verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Increase})
      ).to.be.false;
    });
  });

  describe('one button drag', function() {
    it('changes inertialAlphaOffset', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move X coordinate. Drag camera.
      event.type = "pointermove";
      event.clientX = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.true;

      // Button up. Primary button.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });

    it('followed by another one button drag', function() {
      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move X coordinate. Drag camera.
      event.type = "pointermove";
      event.clientX = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.true;

      // Button up. Primary button.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // 2nd drag.
      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move Y coordinate. Drag camera.
      event.type = "pointermove";
      event.clientY = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;

      // Button up. Primary button.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });

    it('with Ctrl key changes inertialPanningY', function() {
      this.cameraInput.panningSensibility = 3;
      this.cameraInput._useCtrlForPanning = true;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move Y coordinate. Drag camera. (Not panning yet.)
      event.type = "pointermove";
      event.clientY = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;

      // Move X coordinate with Ctrl key depressed. Panning now.
      event.type = "pointermove";
      event.clientY = 2000;
      event.button = 0;
      event.ctrlKey = true;  // Will cause pan motion.
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialPanningY: ValChange.Increase})
      ).to.be.true;
      
      // Move X coordinate having released Ctrl.
      event.type = "pointermove";
      event.clientY = 3000;
      event.button = 0;
      event.ctrlKey = false;  // Will cancel pan motion.
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;
      
      // Button up. Primary button.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });

    it('with panningSensibility disabled', function() {
      this.cameraInput.panningSensibility = 0;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // Button down.
      event.type = "pointerdown";
      event.clientX = 100;
      event.clientY = 200;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      
      // Start moving.
      event.type = "pointermove";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move Y coordinate. Drag camera.
      event.type = "pointermove";
      event.clientY = 1000;
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;

      // Move X coordinate with Ctrl key depressed.
      // Panning disabled so continue regular drag..
      event.type = "pointermove";
      event.clientY = 1500;
      event.button = 0;
      event.ctrlKey = true;  // Will cause pan motion.
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;
      
      // Move X coordinate having released Ctrl.
      event.type = "pointermove";
      event.clientY = 3000;
      event.button = 0;
      event.ctrlKey = false;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialBetaOffset: ValChange.Decrease})
      ).to.be.true;
      
      // Button up. Primary button.
      event.type = "pointerup";
      event.button = 0;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });
  });

  describe('two button drag', function() {
    describe('multiTouchPanAndZoom enabled', function() {
      it('pinchDeltaPercentage enabled', function() {

        // Multiple button presses interpreted as "pinch" and "swipe".
        this.cameraInput.multiTouchPanAndZoom = true;
        // Zoom changes are a percentage of current value.
        this.cameraInput.pinchDeltaPercentage = 10;
        // Panning not enabled.
        this.cameraInput.panningSensibility = 0;

        var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

        // 1st button down.
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.clientX = 1000;
        event.clientY = 200;
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start moving before 2nd button has been pressed.
        event.type = "pointermove";
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move X coordinate.
        event.type = "pointermove";
        event.clientX = 1500;
        event.clientY = 200;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
        ).to.be.true;

        // 2nd button down. (Enter zoom mode.)
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Start move of 2nd pointer.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move Y coordinate. 2nd point is the one moving.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2500;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Increase})
        ).to.be.true;

        // Move X + Y coordinate. 1st point is the one moving.
        event.type = "pointermove";
        event.clientX = 1700;
        event.clientY = 1700;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Decrease})
        ).to.be.true;

        // One of the buttons button up. (Leave zoom mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate of remaining pressed point.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2700;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialBetaOffset: ValChange.Decrease})
        ).to.be.true;

        // Other button button up. (Now moves should have no affect.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate.
        event.type = "pointermove";
        event.clientX = 3000;
        event.clientY = 4000;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      });
      
      it('pinchDeltaPercentage disabled', function() {

        // Multiple button presses interpreted as "pinch" and "swipe".
        this.cameraInput.multiTouchPanAndZoom = true;
        // Zoom changes are not a percentage of current value.
        this.cameraInput.pinchDeltaPercentage = 0;
        // Panning not enabled.
        this.cameraInput.panningSensibility = 0;

        var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

        // 1st button down.
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.clientX = 1000;
        event.clientY = 200;
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start moving before 2nd button has been pressed.
        event.type = "pointermove";
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move X coordinate.
        event.type = "pointermove";
        event.clientX = 1500;
        event.clientY = 200;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
        ).to.be.true;

        // 2nd button down. (Enter zoom mode.)
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Start move of 2nd pointer.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move Y coordinate. 2nd point is the one moving.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2500;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Increase})
        ).to.be.true;

        // Move X + Y coordinate. 1st point is the one moving.
        event.type = "pointermove";
        event.clientX = 1700;
        event.clientY = 1700;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Decrease})
        ).to.be.true;

        // One of the buttons button up. (Leave zoom mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate of remaining pressed point.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2700;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialBetaOffset: ValChange.Decrease})
        ).to.be.true;

        // Other button button up. (Now moves should have no affect.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate.
        event.type = "pointermove";
        event.clientX = 3000;
        event.clientY = 4000;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      });
      
      it('pan on drag', function() {

        // Multiple button presses interpreted as "pinch" and "swipe".
        this.cameraInput.multiTouchPanAndZoom = true;
        // Zoom changes are not a percentage of current value.
        this.cameraInput.pinchDeltaPercentage = 0;
        // Panning not enabled.
        this.cameraInput.panningSensibility = 3;

        var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

        // 1st button down.
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.clientX = 1000;
        event.clientY = 200;
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start moving before 2nd button has been pressed.
        event.type = "pointermove";
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move X coordinate.
        event.type = "pointermove";
        event.clientX = 1500;
        event.clientY = 200;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
        ).to.be.true;

        // 2nd button down. (Enter zoom mode.)
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Start move of 2nd pointer.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move Y coordinate. 2nd point is the one moving.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2500;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Increase,
           inertialPanningY: ValChange.Increase})
        ).to.be.true;

        // Move X + Y coordinate. 1st point is the one moving.
        event.type = "pointermove";
        event.clientX = 1700;
        event.clientY = 1700;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Decrease,
           inertialPanningX: ValChange.Decrease,
           inertialPanningY: ValChange.Increase})
        ).to.be.true;

        // One of the buttons button up. (Leave zoom mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate of remaining pressed point.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2700;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialBetaOffset: ValChange.Decrease})
        ).to.be.true;

        // Other button button up. (Now moves should have no affect.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate.
        event.type = "pointermove";
        event.clientX = 3000;
        event.clientY = 4000;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      });
    });

    describe('multiTouchPanAndZoom disabled', function() {
      it('pinchDeltaPercentage enabled', function() {

        // Multiple button presses not interpreted as multitouch.
        this.cameraInput.multiTouchPanAndZoom = false;
        // Zoom changes are a percentage of current value.
        this.cameraInput.pinchDeltaPercentage = 10;
        // Panning not enabled.
        this.cameraInput.panningSensibility = 3;

        var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

        // 1st button down.
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.clientX = 1000;
        event.clientY = 200;
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start moving before 2nd button has been pressed.
        event.type = "pointermove";
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move X coordinate.
        event.type = "pointermove";
        event.clientX = 1500;
        event.clientY = 200;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
        ).to.be.true;

        // 2nd button down. (Enter zoom mode.)
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Start move of 2nd pointer.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move Y coordinate. 2nd point is the one moving.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2500;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Increase})
        ).to.be.true;

        // Move X + Y coordinate. 1st point is the one moving.
        event.type = "pointermove";
        event.clientX = 1700;
        event.clientY = 1700;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Decrease})
        ).to.be.true;

        // One of the buttons button up. (Leave zoom mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate of remaining pressed point.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2700;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialBetaOffset: ValChange.Decrease})
        ).to.be.true;

        // 1st button down again
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start move of 1st button.
        // This time trigger more than 20 pointermove events without moving more
        // than pinchToPanMaxDistance to lock into "pan" mode.
        event.type = "pointermove";
        event.clientX = 1000;
        event.clientY = 1000;
        event.button = -1;
        event.pointerId = 1;

        for (let i = 0; i < 21; i++) {
          event.clientX++;
          simulateEvent(this.cameraInput, event);
        }
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialPanningX: ValChange.Decrease})
        ).to.be.true;

        // Now we are in "pan" mode, we can move 1st pointer larger distances.
        event.type = "pointermove";
        event.clientX = 5000;
        event.clientY = 5000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialPanningX: ValChange.Decrease,
           inertialPanningY: ValChange.Increase})
        ).to.be.true;

        // One of the buttons button up. (Leave pan mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Other button button up. (Now moves should have no affect.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate.
        event.type = "pointermove";
        event.clientX = 3000;
        event.clientY = 4000;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      });
      
      it('pinchDeltaPercentage disabled', function() {

        // Multiple button presses not interpreted as multitouch.
        this.cameraInput.multiTouchPanAndZoom = false;
        // Zoom changes are not a percentage of current value.
        this.cameraInput.pinchDeltaPercentage = 0;
        // Panning not enabled.
        this.cameraInput.panningSensibility = 3;

        var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

        // 1st button down.
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.clientX = 1000;
        event.clientY = 200;
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start moving before 2nd button has been pressed.
        event.type = "pointermove";
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move X coordinate.
        event.type = "pointermove";
        event.clientX = 1500;
        event.clientY = 200;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialAlphaOffset: ValChange.Decrease})
        ).to.be.true;

        // 2nd button down. (Enter zoom mode.)
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Start move of 2nd pointer.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

        // Move Y coordinate. 2nd point is the one moving.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2500;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Increase})
        ).to.be.true;

        // Move X + Y coordinate. 1st point is the one moving.
        event.type = "pointermove";
        event.clientX = 1700;
        event.clientY = 1700;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialRadiusOffset: ValChange.Decrease})
        ).to.be.true;

        // One of the buttons button up. (Leave zoom mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate of remaining pressed point.
        event.type = "pointermove";
        event.clientX = 2000;
        event.clientY = 2700;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialBetaOffset: ValChange.Decrease})
        ).to.be.true;

        // 1st button down again
        event.type = "pointerdown";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Start move of 1st button.
        // This time trigger more than 20 pointermove events without moving more
        // than pinchToPanMaxDistance to lock into "pan" mode.
        event.type = "pointermove";
        event.clientX = 1000;
        event.clientY = 1000;
        event.button = -1;
        event.pointerId = 1;

        for (let i = 0; i < 21; i++) {
          event.clientX++;
          simulateEvent(this.cameraInput, event);
        }
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialPanningX: ValChange.Decrease})
        ).to.be.true;

        // Now we are in "pan" mode, we can move 1st pointer larger distances.
        event.type = "pointermove";
        event.clientX = 5000;
        event.clientY = 5000;
        event.button = -1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(
          this.camera,
          this.cameraCachePos,
          {inertialPanningX: ValChange.Decrease,
           inertialPanningY: ValChange.Increase})
        ).to.be.true;

        // One of the buttons button up. (Leave pan mode.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 0;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);

        // Other button button up. (Now moves should have no affect.)
        event.type = "pointerup";
        event.pointerType = "touch";
        event.button = 1;
        event.pointerId = 2;
        simulateEvent(this.cameraInput, event);

        // Move X and Y coordinate.
        event.type = "pointermove";
        event.clientX = 3000;
        event.clientY = 4000;
        event.button = -1;
        event.pointerId = 1;
        simulateEvent(this.cameraInput, event);
        expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
      });
    });
  });

  describe('loose focus', function() {
    it('cancels drag', function() {
      // Multiple button presses interpreted as "pinch" and "swipe".
      this.cameraInput.multiTouchPanAndZoom = true;
      // Zoom changes are a percentage of current value.
      this.cameraInput.pinchDeltaPercentage = 10;
      // Panning not enabled.
      this.cameraInput.panningSensibility = 0;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // 1st button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.clientX = 1000;
      event.clientY = 200;
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);

      // Start moving before 2nd button has been pressed.
      event.type = "pointermove";
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move X coordinate.
      event.type = "pointermove";
      event.clientX = 1500;
      event.clientY = 200;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.true;

      // Lost focus
      (<any>this.cameraInput)._onLostFocus();

      // Move X + Y coordinate. Should have no affect after loosing focus.
      event.type = "pointermove";
      event.clientX = 1700;
      event.clientY = 1700;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });

    it('cancels double drag', function() {
      // Multiple button presses interpreted as "pinch" and "swipe".
      this.cameraInput.multiTouchPanAndZoom = true;
      // Zoom changes are a percentage of current value.
      this.cameraInput.pinchDeltaPercentage = 10;
      // Panning not enabled.
      this.cameraInput.panningSensibility = 0;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);

      // 1st button down.
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.clientX = 1000;
      event.clientY = 200;
      event.button = 0;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);

      // Start moving before 2nd button has been pressed.
      event.type = "pointermove";
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move X coordinate.
      event.type = "pointermove";
      event.clientX = 1500;
      event.clientY = 200;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialAlphaOffset: ValChange.Decrease})
      ).to.be.true;

      // 2nd button down. (Enter zoom mode.)
      event.type = "pointerdown";
      event.pointerType = "touch";
      event.button = 1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);

      // Start move of 2nd pointer.
      event.type = "pointermove";
      event.clientX = 2000;
      event.clientY = 2000;
      event.button = -1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;

      // Move Y coordinate. 2nd point is the one moving.
      event.type = "pointermove";
      event.clientX = 2000;
      event.clientY = 2500;
      event.button = -1;
      event.pointerId = 2;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(
        this.camera,
        this.cameraCachePos,
        {inertialRadiusOffset: ValChange.Increase})
      ).to.be.true;

      // Lost focus
      (<any>this.cameraInput)._onLostFocus();

      // Move X + Y coordinate. Should have no affect after loosing focus.
      event.type = "pointermove";
      event.clientX = 1700;
      event.clientY = 1700;
      event.button = -1;
      event.pointerId = 1;
      simulateEvent(this.cameraInput, event);
      expect(verifyChanges(this.camera, this.cameraCachePos, {})).to.be.true;
    });
  });

  describe('double click', function() {
    it('doesnt restore save position', function() {
      // Disable restoring position.
      this.camera.useInputToRestoreState = false;

      this.camera.alpha = 10;
      this.camera.beta = 10;
      this.camera.radius = 10;

      this.camera.storeState();

      this.camera.alpha = 20;
      this.camera.beta = 20;
      this.camera.radius = 20;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);
      event.type = "POINTERDOUBLETAP";
      simulateEvent(this.cameraInput, event);
      
      expect(this.camera.alpha).to.be.equal(20);
      expect(this.camera.beta).to.be.equal(20);
      expect(this.camera.radius).to.be.equal(20);
    });
    it('restores save position', function() {
      // Enable restoring position.
      this.camera.useInputToRestoreState = true;

      this.camera.alpha = 10;
      this.camera.beta = 10;
      this.camera.radius = 10;

      this.camera.storeState();

      this.camera.alpha = 20;
      this.camera.beta = 20;
      this.camera.radius = 20;

      var event: MockPointerEvent = eventTemplate(<HTMLElement>this._canvas);
      event.type = "POINTERDOUBLETAP";
      simulateEvent(this.cameraInput, event);
      
      expect(this.camera.alpha).to.be.equal(10);
      expect(this.camera.beta).to.be.equal(10);
      expect(this.camera.radius).to.be.equal(10);
    });
  });
});
