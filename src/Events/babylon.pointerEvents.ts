module BABYLON {
    export class PointerEventTypes {
        static _POINTERDOWN = 0x01;
        static _POINTERUP = 0x02;
        static _POINTERMOVE = 0x04;
        static _POINTERWHEEL = 0x08;
        static _POINTERPICK = 0x10;
        static _POINTERTAP = 0x20;
        static _POINTERDOUBLETAP = 0x40;

        public static get POINTERDOWN(): number {
            return PointerEventTypes._POINTERDOWN;
        }

        public static get POINTERUP(): number {
            return PointerEventTypes._POINTERUP;
        }

        public static get POINTERMOVE(): number {
            return PointerEventTypes._POINTERMOVE;
        }

        public static get POINTERWHEEL(): number {
            return PointerEventTypes._POINTERWHEEL;
        }

        public static get POINTERPICK(): number {
            return PointerEventTypes._POINTERPICK;
        }

        public static get POINTERTAP(): number {
            return PointerEventTypes._POINTERTAP;
        }

        public static get POINTERDOUBLETAP(): number {
            return PointerEventTypes._POINTERDOUBLETAP;
        }
    }

    export class PointerInfoBase {
        constructor(public type: number, public event: PointerEvent | MouseWheelEvent) {
        }
    }

    /**
     * This class is used to store pointer related info for the onPrePointerObservable event.
     * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
     */
    export class PointerInfoPre extends PointerInfoBase {
        constructor(type: number, event: PointerEvent | MouseWheelEvent, localX: number, localY: number) {
            super(type, event);
            this.skipOnPointerObservable = false;
            this.localPosition = new Vector2(localX, localY);
        }

        public localPosition: Vector2;
        public skipOnPointerObservable: boolean;
    }

    /**
     * This type contains all the data related to a pointer event in Babylon.js.
     * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
     */
    export class PointerInfo extends PointerInfoBase {
        constructor(type: number, event: PointerEvent | MouseWheelEvent, public pickInfo: Nullable<PickingInfo>) {
            super(type, event);
        }
    }    
}