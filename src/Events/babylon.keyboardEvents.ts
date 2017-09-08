module BABYLON {
    
    export class KeyboardEventTypes {
        static _KEYDOWN = 0x01;
        static _KEYUP = 0x02;

        public static get KEYDOWN(): number {
            return KeyboardEventTypes._KEYDOWN;
        }

        public static get KEYUP(): number {
            return KeyboardEventTypes._KEYUP;
        }
    }

    export class KeyboardInfo {
        constructor(public type: number, public event: KeyboardEvent) {
        }
    }

    /**
     * This class is used to store keyboard related info for the onPreKeyboardObservable event.
     * Set the skipOnKeyboardObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onKeyboardObservable
     */
    export class KeyboardInfoPre extends KeyboardInfo {
        constructor(type: number, event: KeyboardEvent) {
            super(type, event);
            this.skipOnPointerObservable = false;
        }

        public skipOnPointerObservable: boolean;
    }   
}