import { IKeyboardEvent } from "./deviceInputEvents";

/**
 * Gather the list of keyboard event types as constants.
 */
export class KeyboardEventTypes {
    /**
     * The keydown event is fired when a key becomes active (pressed).
     */
    public static readonly KEYDOWN = 0x01;
    /**
     * The keyup event is fired when a key has been released.
     */
    public static readonly KEYUP = 0x02;
}

/**
 * This class is used to store keyboard related info for the onKeyboardObservable event.
 */
export class KeyboardInfo {
    /**
     * Instantiates a new keyboard info.
     * This class is used to store keyboard related info for the onKeyboardObservable event.
     * @param type Defines the type of event (KeyboardEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
        /**
         * Defines the type of event (KeyboardEventTypes)
         */
        public type: number,
        /**
         * Defines the related dom event
         */
        public event: IKeyboardEvent) {
    }
}

/**
 * This class is used to store keyboard related info for the onPreKeyboardObservable event.
 * Set the skipOnKeyboardObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onKeyboardObservable
 */
export class KeyboardInfoPre extends KeyboardInfo {
    /**
     * Defines whether the engine should skip the next onKeyboardObservable associated to this pre.
     */
    public skipOnPointerObservable: boolean;

    /**
     * Instantiates a new keyboard pre info.
     * This class is used to store keyboard related info for the onPreKeyboardObservable event.
     * @param type Defines the type of event (KeyboardEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
        /**
         * Defines the type of event (KeyboardEventTypes)
         */
        public type: number,
        /**
         * Defines the related dom event
         */
        public event: IKeyboardEvent) {
        super(type, event);
        this.skipOnPointerObservable = false;
    }
}
