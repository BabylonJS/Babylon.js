import { Nullable } from "../../types";
import { Camera } from "../../Cameras/camera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { PointerTouch } from "../../Events/pointerEvents";
import { BaseCameraPointersInput } from "../../Cameras/Inputs/BaseCameraPointersInput";

/**
 * Mock class to be used by UnitTests.
 */
export class StubCameraPointersInput extends BaseCameraPointersInput {
  /**
   * Defines the camera the input is attached to.
   */
  public camera: Camera;

  /**
   * Count how many times onDoubleTap method is called.
   */
  public countOnDoubleTap: number;

  /**
   * Count how many times onTouch method is called.
   */
  public countOnTouch: number;

  /**
   * Count how many times onMultiTouch method is called.
   */
  public countOnMultiTouch: number;

  /**
   * Count how many times onContextMenu method is called.
   */
  public countOnContextMenu: number;

  /**
   * Count how many times onButtonDown method is called.
   */
  public countOnButtonDown: number;

  /**
   * Count how many times onButtonUp method is called.
   */
  public countOnButtonUp: number;

  /**
   * Count how many times onLostFocus method is called.
   */
  public countOnLostFocus: number;

  /**
   * Store arguments of last time onDoubleTap method was called.
   */
  public lastOnDoubleTap: any;

  /**
   * Store arguments of last time onTouch method was called.
   */
  public lastOnTouch: any;

  /**
   * Store arguments of last time onMultiTouch method was called.
   */
  public lastOnMultiTouch: any;

  /**
   * Store arguments of last time onContextMenu method was called.
   */
  public lastOnContextMenu: any;

  /**
   * Store arguments of last time onButtonDown method was called.
   */
  public lastOnButtonDown: any;

  /**
   * Store arguments of last time onButtonUp method was called.
   */
  public lastOnButtonUp: any;

  /**
   * Store arguments when onDoubleTap method is called.
   */
  public valuesOnDoubleTap: any[];

  /**
   * Store arguments when onTouch method is called.
   */
  public valuesOnTouch: any[];

  /**
   * Store arguments when onMultiTouch method is called.
   */
  public valuesOnMultiTouch: any[];

  /**
   * Store arguments when onContextMenu method is called.
   */
  public valuesOnContextMenu: any[];

  /**
   * Store arguments when onButtonDown method is called.
   */
  public valuesOnButtonDown: any[];

  /**
   * Store arguments when onButtonUp method is called.
   */
  public valuesOnButtonUp: any[];

  /**
   * Reset instance of this class to default values.
   */
  public reset(): void {
    this.countOnDoubleTap = 0;
    this.countOnTouch = 0;
    this.countOnMultiTouch = 0;
    this.countOnContextMenu = 0;
    this.countOnButtonDown = 0;
    this.countOnButtonUp = 0;
    this.countOnLostFocus = 0;

    this.valuesOnDoubleTap = [];
    this.valuesOnTouch = [];
    this.valuesOnMultiTouch = [];
    this.valuesOnContextMenu = [];
    this.valuesOnButtonDown = [];
    this.valuesOnButtonUp = [];

    this.lastOnDoubleTap = undefined;
    this.lastOnTouch = undefined;
    this.lastOnMultiTouch = undefined;
    this.lastOnContextMenu = undefined;
    this.lastOnButtonDown = undefined;
    this.lastOnButtonUp = undefined;
  }

  /**
   * Mock class to be used by UnitTests.
   */
  constructor() {
    super();
    this.reset();
  }

  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  public getClassName(): string {
    return "StubCameraPointersInput";
  }

  /**
   * Called on pointer POINTERDOUBLETAP event.
   */
  protected onDoubleTap(type: string) {
    this.countOnDoubleTap++;
    this.valuesOnDoubleTap.push(type);
    this.lastOnDoubleTap = type;
  }

  /**
   * Called on pointer POINTERMOVE event if only a single touch is active.
   */
  protected onTouch(
    point: Nullable<PointerTouch>,
    offsetX: number,
    offsetY: number):
  void {
    this.countOnTouch++;
    this.lastOnTouch = {point, offsetX, offsetY};
    this.valuesOnTouch.push(this.lastOnTouch);
  }

  /**
   * Called on pointer POINTERMOVE event if multiple touches are active.
   */
  protected onMultiTouch(
    pointA: Nullable<PointerTouch>,
    pointB: Nullable<PointerTouch>,
    previousPinchSquaredDistance: number,
    pinchSquaredDistance: number,
    previousMultiTouchPanPosition: Nullable<PointerTouch>,
    multiTouchPanPosition: Nullable<PointerTouch>):
  void {
    this.countOnMultiTouch++;
    this.lastOnMultiTouch = {
      pointA,
      pointB,
      previousPinchSquaredDistance,
      pinchSquaredDistance,
      previousMultiTouchPanPosition,
      multiTouchPanPosition,
    };
    this.valuesOnMultiTouch.push(this.lastOnMultiTouch);
  }

  /**
   * Called on JS contextmenu event.
   */
  protected onContextMenu(evt: PointerEvent): void {
    evt.preventDefault();
    this.countOnContextMenu++;
    this.lastOnContextMenu = evt;
    this.valuesOnContextMenu.push(evt);
  }

  /**
   * Called each time a new POINTERDOWN event occurs. Ie, for each button
   * press.
   */
  protected onButtonDown(evt: PointerEvent, buttonCount: number): void {
    this.countOnButtonDown++;
    this.lastOnButtonDown = {evt, buttonCount};
    this.valuesOnButtonDown.push(this.lastOnButtonDown);
  }

  /**
   * Called each time a new POINTERUP event occurs. Ie, for each button
   * release.
   */
  protected onButtonUp(evt: PointerEvent, buttonCount: number): void {
    this.countOnButtonUp++;
    this.lastOnButtonUp = {evt, buttonCount};
    this.valuesOnButtonUp.push(this.lastOnButtonUp);
  }

  /**
   * Called when window becomes inactive.
   */
  protected onLostFocus(): void {
    this.countOnLostFocus++;
  }
}
(<any>CameraInputTypes)["StubCameraPointersInput"] = StubCameraPointersInput;
