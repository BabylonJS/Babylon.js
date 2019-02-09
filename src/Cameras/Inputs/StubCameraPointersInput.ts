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
   * Count how many times callback methods are called.
   */
  public countOnDoubleTap: number;
  public countOnTouch: number;
  public countOnMultiTouch: number;
  public countOnContextMenu: number;
  public countOnButtonDown: number;
  public countOnButtonUp: number;
  public countOnLostFocus: number;

  /**
   * Store arguments of last callback methods.
   */
  public lastOnDoubleTap: any;
  public lastOnTouch: any;
  public lastOnMultiTouch: any;
  public lastOnContextMenu: any;
  public lastOnButtonDown: any;
  public lastOnButtonUp: any;

  /**
   * Store arguments when callback methods are called.
   */
  public valuesOnDoubleTap: any[];
  public valuesOnTouch: any[];
  public valuesOnMultiTouch: any[];
  public valuesOnContextMenu: any[];
  public valuesOnButtonDown: any[];
  public valuesOnButtonUp: any[];

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

  constructor() {
    super();
    this.reset();
  }

  /**
   * The class name of the current input.
   */
  protected _className = "StubCameraPointersInput";

  /**
   * Called on pointer POINTERDOUBLETAP event.
   * Override this method to provide functionality on POINTERDOUBLETAP event.
   */
  protected onDoubleTap(type: string) {
    this.countOnDoubleTap++;
    this.valuesOnDoubleTap.push(type);
    this.lastOnDoubleTap = type;
  }

  /**
   * Called on pointer POINTERMOVE event if only a single touch is active.
   * Override this method to provide functionality.
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
   * Override this method to provide functionality.
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
   * Override this method to provide functionality.
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
   * Override this method to provide functionality.
   */
  protected onButtonDown(evt: PointerEvent, buttonCount: number): void {
    this.countOnButtonDown++;
    this.lastOnButtonDown = {evt, buttonCount};
    this.valuesOnButtonDown.push(this.lastOnButtonDown);
  }

  /**
   * Called each time a new POINTERUP event occurs. Ie, for each button
   * release.
   * Override this method to provide functionality.
   */
  protected onButtonUp(evt: PointerEvent, buttonCount: number): void {
    this.countOnButtonUp++;
    this.lastOnButtonUp = {evt, buttonCount};
    this.valuesOnButtonUp.push(this.lastOnButtonUp);
  }

  /**
   * Called when window becomes inactive.
   * Override this method to provide functionality.
   */
  protected onLostFocus(): void {
    this.countOnLostFocus++;
  }
}
(<any>CameraInputTypes)["StubCameraPointersInput"] = StubCameraPointersInput;
