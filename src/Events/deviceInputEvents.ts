/**
 * Event Types
 */
export enum DeviceInputEventType {
    // Pointers
    /** PointerMove */
    PointerMove,
    /** PointerDown */
    PointerDown,
    /** PointerUp */
    PointerUp
}

/**
 * Native friendly interface for Event Object
 */
export interface IEvent {
    // Properties
    /**
     * Current target for an event
     */
    currentTarget?: any;

    /**
     * Alias for target
     * @deprecated
     */
    srcElement?: any;

    /**
     * Type of event
     */
    type: string;

    /**
     * Reference to object where object was dispatched
     */
    target: any;

    // Methods
    /**
     * Tells user agent what to do when not explicitly handled
     */
    preventDefault: () => void;
}

/**
 * Native friendly interface for UIEvent Object
 */
export interface IUIEvent extends IEvent {
    // Properties
    /**
     * Provides current click count
     */
    detail: number;

    /**
     * Horizontal coordinate of event
     */
    pageX: number;

    /**
     * Vertical coordinate of event
     */
    pageY: number;
}

/**
 * Native friendly interface for KeyboardEvent Object
 */
export interface IKeyboardEvent extends IUIEvent {
    // Properties
    /**
     * Status of Alt key being pressed
     */
    altKey: boolean;

    /**
     * Unicode value of character pressed
     * @deprecated
     */
    charCode?: number;

    /**
     * Code for key based on layout
     */
    code: string;

    /**
     * Status of Ctrl key being pressed
     */
    ctrlKey: boolean;

    /**
     * String representation of key
     */
    key: string;
    /**
     * ASCII value of key
     * @deprecated
     */
    keyCode: number;

    /**
     * Status of Meta key (eg. Windows key) being pressed
     */
    metaKey: boolean;

    /**
     * Status of Shift key being pressed
     */
    shiftKey: boolean;
}

/**
 * Native friendly interface for MouseEvent Object
 */
export interface IMouseEvent extends IUIEvent{
    // Properties
    /**
     * Status of Alt key being pressed
     */
    altKey: boolean;

    /**
     * Value of single mouse button pressed
     */
    button: number;

    /**
     * Value of all mouse buttons pressed
     */
    buttons: number;

    /**
     * Current X coordinate
     */
    clientX: number;

    /**
     * Current Y coordinate
     */
    clientY: number;

    /**
     * Status of Ctrl key being pressed
     */
    ctrlKey: boolean;

    /**
     * Status of Meta key (eg. Windows key) being pressed
     */
    metaKey: boolean;

    /**
     * Delta of movement on X axis
     */
    movementX: number;

    /**
     * Delta of movement on Y axis
     */
    movementY: number;

    /**
     * Delta of movement on X axis
     */
    mozMovementX?: number;

    /**
     * Delta of movement on Y axis
     */
    mozMovementY?: number;

    /**
     * Delta of movement on X axis
     */
    msMovementX?: any;

    /**
     * Delta of movement on Y axis
     */
    msMovementY?: any;

    /**
     * Current coordinate of X within container
     */
    offsetX: number;

    /**
     * Current coordinate of Y within container
     */
    offsetY: number;

    /**
     * Status of Shift key being pressed
     */
    shiftKey: boolean;

    /**
     * Delta of movement on X axis
     */
    webkitMovementX?: any;

    /**
     * Delta of movement on Y axis
     */
    webkitMovementY?: any;

    /**
     * Alias of clientX
     */
    x: number;

    /**
     * Alias of clientY
     */
    y: number;
}

/**
 * Native friendly interface for PointerEvent Object
 */
export interface IPointerEvent extends IMouseEvent {
    // Properties
    /**
     * Pointer Event ID
     */
    pointerId: number;

    /**
     * Type of pointer
     */
    pointerType: string;
}

/**
 * Native friendly interface for WheelEvent Object
 */
export interface IWheelEvent extends IMouseEvent {
    // Properties
    /**
     * Units for delta value
     */
    deltaMode: number;

    /**
     * Horizontal scroll delta
     */
    deltaX: number;

    /**
     * Vertical scroll delta
     */
    deltaY: number;

    /**
     * Z-Axis scroll delta
     */
    deltaZ: number;

    /**
     * WheelDelta (From MouseWheel Event)
     */
    wheelDelta?: number;
}

/**
 * Constants used for Events
 */
export class EventConstants {
    /**
     * Pixel delta for Wheel Events (Default)
     */
    public static DOM_DELTA_PIXEL = 0x00;

    /**
     * Line delta for Wheel Events
     */
    public static DOM_DELTA_LINE = 0x01;

    /**
     * Page delta for Wheel Events
     */
    public static DOM_DELTA_PAGE = 0x02;
}