import { Nullable } from "../types";
import { Vector2 } from "../Maths/math.vector";
import { PickingInfo } from "../Collisions/pickingInfo";

declare type Ray = import("../Culling/ray").Ray;

/**
 * Gather the list of pointer event types as constants.
 */
export class PointerEventTypes {
    /**
     * The pointerdown event is fired when a pointer becomes active. For mouse, it is fired when the device transitions from no buttons depressed to at least one button depressed. For touch, it is fired when physical contact is made with the digitizer. For pen, it is fired when the stylus makes physical contact with the digitizer.
     */
    public static readonly POINTERDOWN = 0x01;
    /**
     * The pointerup event is fired when a pointer is no longer active.
     */
    public static readonly POINTERUP = 0x02;
    /**
     * The pointermove event is fired when a pointer changes coordinates.
     */
    public static readonly POINTERMOVE = 0x04;
    /**
     * The pointerwheel event is fired when a mouse wheel has been rotated.
     */
    public static readonly POINTERWHEEL = 0x08;
    /**
     * The pointerpick event is fired when a mesh or sprite has been picked by the pointer.
     */
    public static readonly POINTERPICK = 0x10;
    /**
     * The pointertap event is fired when a the object has been touched and released without drag.
     */
    public static readonly POINTERTAP = 0x20;
    /**
     * The pointerdoubletap event is fired when a the object has been touched and released twice without drag.
     */
    public static readonly POINTERDOUBLETAP = 0x40;
}

/**
 * Base class of pointer info types.
 */
export class PointerInfoBase {
    /**
     * Instantiates the base class of pointers info.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
        /**
         * Defines the type of event (PointerEventTypes)
         */
        public type: number,
        /**
         * Defines the related dom event
         */
        public event: PointerEvent | MouseWheelEvent) {
    }
}

/**
 * This class is used to store pointer related info for the onPrePointerObservable event.
 * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
 */
export class PointerInfoPre extends PointerInfoBase {
    /**
     * Ray from a pointer if availible (eg. 6dof controller)
     */
    public ray: Nullable<Ray> = null;

    /**
     * Defines the local position of the pointer on the canvas.
     */
    public localPosition: Vector2;

    /**
     * Defines whether the engine should skip the next OnPointerObservable associated to this pre.
     */
    public skipOnPointerObservable: boolean;

    /**
     * Instantiates a PointerInfoPre to store pointer related info to the onPrePointerObservable event.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     * @param localX Defines the local x coordinates of the pointer when the event occured
     * @param localY Defines the local y coordinates of the pointer when the event occured
     */
    constructor(type: number, event: PointerEvent | MouseWheelEvent, localX: number, localY: number) {
        super(type, event);
        this.skipOnPointerObservable = false;
        this.localPosition = new Vector2(localX, localY);
    }
}

/**
 * This type contains all the data related to a pointer event in Babylon.js.
 * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
 */
export class PointerInfo extends PointerInfoBase {
    /**
     * Instantiates a PointerInfo to store pointer related info to the onPointerObservable event.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     * @param pickInfo Defines the picking info associated to the info (if any)\
     */
    constructor(type: number,
        event: PointerEvent | MouseWheelEvent,
        /**
         * Defines the picking info associated to the info (if any)\
         */
        public pickInfo: Nullable<PickingInfo>) {
        super(type, event);
    }
}

/**
 * Data relating to a touch event on the screen.
 */
export interface PointerTouch {
    /**
     * X coordinate of touch.
     */
    x: number;
    /**
     * Y coordinate of touch.
     */
    y: number;
    /**
     * Id of touch. Unique for each finger.
     */
    pointerId: number;
    /**
     * Event type passed from DOM.
     */
    type: any;
}
