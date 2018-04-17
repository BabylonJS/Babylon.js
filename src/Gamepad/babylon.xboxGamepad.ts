module BABYLON {

    /**
     * Defines supported buttons for XBox360 compatible gamepads
     */
    export enum Xbox360Button {
        /** A */
        A,
        /** B */
        B,
        /** X */
        X,
        /** Y */
        Y,
        /** Start */
        Start,
        /** Back */
        Back,
        /** Left button */
        LB,
        /** Right button */
        RB,
        /** Left stick */
        LeftStick,
        /** Right stick */
        RightStick
    }

    /** Defines values for XBox360 DPad  */
    export enum Xbox360Dpad {
        /** Up */
        Up,
        /** Down */
        Down,
        /** Left */
        Left,
        /** Right */
        Right
    }

    /**
     * Defines a XBox360 gamepad
     */
    export class Xbox360Pad extends Gamepad {
        private _leftTrigger: number = 0;
        private _rightTrigger: number = 0;

        private _onlefttriggerchanged: (value: number) => void;
        private _onrighttriggerchanged: (value: number) => void;

        private _onbuttondown: (buttonPressed: Xbox360Button) => void;
        private _onbuttonup: (buttonReleased: Xbox360Button) => void;
        private _ondpaddown: (dPadPressed: Xbox360Dpad) => void;
        private _ondpadup: (dPadReleased: Xbox360Dpad) => void;

        /** Observable raised when a button is pressed */
        public onButtonDownObservable = new Observable<Xbox360Button>();
        /** Observable raised when a button is released */
        public onButtonUpObservable = new Observable<Xbox360Button>();        
        /** Observable raised when a pad is pressed */
        public onPadDownObservable = new Observable<Xbox360Dpad>();
        /** Observable raised when a pad is released */
        public onPadUpObservable = new Observable<Xbox360Dpad>();        

        private _buttonA: number = 0;
        private _buttonB: number = 0;
        private _buttonX: number = 0;
        private _buttonY: number = 0;
        private _buttonBack: number = 0;
        private _buttonStart: number = 0;
        private _buttonLB: number = 0;
        private _buttonRB: number = 0;

        private _buttonLeftStick: number = 0;
        private _buttonRightStick: number = 0;
        private _dPadUp: number = 0;
        private _dPadDown: number = 0;
        private _dPadLeft: number = 0;
        private _dPadRight: number = 0;

        private _isXboxOnePad: boolean = false;

        /**
         * Creates a new XBox360 gamepad object
         * @param id defines the id of this gamepad
         * @param index defines its index
         * @param gamepad defines the internal HTML gamepad object
         * @param xboxOne defines if it is a XBox One gamepad
         */
        constructor(id: string, index: number, gamepad: any, xboxOne: boolean = false) {
            super(id, index, gamepad, 0, 1, 2, 3);
            this.type = Gamepad.XBOX;
            this._isXboxOnePad = xboxOne;
        }

        /**
         * Defines the callback to call when left trigger is pressed
         * @param callback defines the callback to use
         */
        public onlefttriggerchanged(callback: (value: number) => void) {
            this._onlefttriggerchanged = callback;
        }

        /**
         * Defines the callback to call when right trigger is pressed
         * @param callback defines the callback to use
         */        
        public onrighttriggerchanged(callback: (value: number) => void) {
            this._onrighttriggerchanged = callback;
        }
 
        /**
         * Gets or sets left trigger value
         */
        public get leftTrigger(): number {
            return this._leftTrigger;
        }
        public set leftTrigger(newValue: number) {
            if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
                this._onlefttriggerchanged(newValue);
            }
            this._leftTrigger = newValue;
        }

        /**
         * Gets or sets right trigger value
         */        
        public get rightTrigger(): number {
            return this._rightTrigger;
        }
        public set rightTrigger(newValue: number) {
            if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
                this._onrighttriggerchanged(newValue);
            }
            this._rightTrigger = newValue;
        }

        /**
         * Defines the callback to call when a button is pressed
         * @param callback defines the callback to use
         */
        public onbuttondown(callback: (buttonPressed: Xbox360Button) => void) {
            this._onbuttondown = callback;
        }

        /**
         * Defines the callback to call when a button is released
         * @param callback defines the callback to use
         */        
        public onbuttonup(callback: (buttonReleased: Xbox360Button) => void) {
            this._onbuttonup = callback;
        }

        /**
         * Defines the callback to call when a pad is pressed
         * @param callback defines the callback to use
         */             
        public ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void) {
            this._ondpaddown = callback;
        }

        /**
         * Defines the callback to call when a pad is released
         * @param callback defines the callback to use
         */             
        public ondpadup(callback: (dPadReleased: Xbox360Dpad) => void) {
            this._ondpadup = callback;
        }

        private _setButtonValue(newValue: number, currentValue: number, buttonType: Xbox360Button): number {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._onbuttondown) {
                        this._onbuttondown(buttonType);
                    }

                    this.onButtonDownObservable.notifyObservers(buttonType);
                }
                if (newValue === 0) {

                    if (this._onbuttonup) {
                        this._onbuttonup(buttonType);
                    }
                    
                    this.onButtonUpObservable.notifyObservers(buttonType);
                }
            }
            return newValue;
        }

        private _setDPadValue(newValue: number, currentValue: number, buttonType: Xbox360Dpad): number {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._ondpaddown) {
                        this._ondpaddown(buttonType);
                    }
                    
                    this.onPadDownObservable.notifyObservers(buttonType);
                }
                if (newValue === 0) {
                    if (this._ondpadup) {
                        this._ondpadup(buttonType);
                    }

                    this.onPadUpObservable.notifyObservers(buttonType);
                }
            }
            return newValue;
        }

        /** Gets or sets value of A button */
        public get buttonA(): number {
            return this._buttonA;
        }
        public set buttonA(value) {
            this._buttonA = this._setButtonValue(value, this._buttonA, Xbox360Button.A);
        }

        /** Gets or sets value of B button */
        public get buttonB(): number {
            return this._buttonB;
        }
        public set buttonB(value) {
            this._buttonB = this._setButtonValue(value, this._buttonB, Xbox360Button.B);
        }

        /** Gets or sets value of X button */       
        public get buttonX(): number {
            return this._buttonX;
        }
        public set buttonX(value) {
            this._buttonX = this._setButtonValue(value, this._buttonX, Xbox360Button.X);
        }

        /** Gets or sets value of Y button */        
        public get buttonY(): number {
            return this._buttonY;
        }
        public set buttonY(value) {
            this._buttonY = this._setButtonValue(value, this._buttonY, Xbox360Button.Y);
        }        
        
        /** Gets or sets value of Start button  */
        public get buttonStart(): number {
            return this._buttonStart;
        }
        public set buttonStart(value) {
            this._buttonStart = this._setButtonValue(value, this._buttonStart, Xbox360Button.Start);
        }

        /** Gets or sets value of Back button  */        
        public get buttonBack(): number {
            return this._buttonBack;
        }
        public set buttonBack(value) {
            this._buttonBack = this._setButtonValue(value, this._buttonBack, Xbox360Button.Back);
        }

        /** Gets or sets value of Left button  */        
        public get buttonLB(): number {
            return this._buttonLB;
        }
        public set buttonLB(value) {
            this._buttonLB = this._setButtonValue(value, this._buttonLB, Xbox360Button.LB);
        }

        /** Gets or sets value of Right button  */        
        public get buttonRB(): number {
            return this._buttonRB;
        }
        public set buttonRB(value) {
            this._buttonRB = this._setButtonValue(value, this._buttonRB, Xbox360Button.RB);
        }

        /** Gets or sets value of left stick */  
        public get buttonLeftStick(): number {
            return this._buttonLeftStick;
        }
        public set buttonLeftStick(value) {
            this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, Xbox360Button.LeftStick);
        }

        /** Gets or sets value of right stick */  
        public get buttonRightStick(): number {
            return this._buttonRightStick;
        }
        public set buttonRightStick(value) {
            this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, Xbox360Button.RightStick);
        }

        /** Gets or sets value of DPad up */  
        public get dPadUp(): number {
            return this._dPadUp;
        }
        public set dPadUp(value) {
            this._dPadUp = this._setDPadValue(value, this._dPadUp, Xbox360Dpad.Up);
        }

        /** Gets or sets value of DPad down */  
        public get dPadDown(): number {
            return this._dPadDown;
        }
        public set dPadDown(value) {
            this._dPadDown = this._setDPadValue(value, this._dPadDown, Xbox360Dpad.Down);
        }

        /** Gets or sets value of DPad left */  
        public get dPadLeft(): number {
            return this._dPadLeft;
        }
        public set dPadLeft(value) {
            this._dPadLeft = this._setDPadValue(value, this._dPadLeft, Xbox360Dpad.Left);
        }

        /** Gets or sets value of DPad right */  
        public get dPadRight(): number {
            return this._dPadRight;
        }
        public set dPadRight(value) {
            this._dPadRight = this._setDPadValue(value, this._dPadRight, Xbox360Dpad.Right);
        }

        /**
         * Force the gamepad to synchronize with device values
         */
        public update() {
            super.update();
            if (this._isXboxOnePad) {
                this.buttonA = this.browserGamepad.buttons[0].value;
                this.buttonB = this.browserGamepad.buttons[1].value;
                this.buttonX = this.browserGamepad.buttons[2].value;
                this.buttonY = this.browserGamepad.buttons[3].value;
                this.buttonLB = this.browserGamepad.buttons[4].value;
                this.buttonRB = this.browserGamepad.buttons[5].value;
                this.leftTrigger = this.browserGamepad.axes[2];
                this.rightTrigger = this.browserGamepad.axes[5];
                this.buttonBack = this.browserGamepad.buttons[9].value;
                this.buttonStart = this.browserGamepad.buttons[8].value;
                this.buttonLeftStick = this.browserGamepad.buttons[6].value;
                this.buttonRightStick = this.browserGamepad.buttons[7].value;
                this.dPadUp = this.browserGamepad.buttons[11].value;
                this.dPadDown = this.browserGamepad.buttons[12].value;
                this.dPadLeft = this.browserGamepad.buttons[13].value;
                this.dPadRight = this.browserGamepad.buttons[14].value;
            } else {
                this.buttonA = this.browserGamepad.buttons[0].value;
                this.buttonB = this.browserGamepad.buttons[1].value;
                this.buttonX = this.browserGamepad.buttons[2].value;
                this.buttonY = this.browserGamepad.buttons[3].value;
                this.buttonLB = this.browserGamepad.buttons[4].value;
                this.buttonRB = this.browserGamepad.buttons[5].value;
                this.leftTrigger = this.browserGamepad.buttons[6].value;
                this.rightTrigger = this.browserGamepad.buttons[7].value;
                this.buttonBack = this.browserGamepad.buttons[8].value;
                this.buttonStart = this.browserGamepad.buttons[9].value;
                this.buttonLeftStick = this.browserGamepad.buttons[10].value;
                this.buttonRightStick = this.browserGamepad.buttons[11].value;
                this.dPadUp = this.browserGamepad.buttons[12].value;
                this.dPadDown = this.browserGamepad.buttons[13].value;
                this.dPadLeft = this.browserGamepad.buttons[14].value;
                this.dPadRight = this.browserGamepad.buttons[15].value;
            }
        }

        public dispose(){
            super.dispose();
            this.onButtonDownObservable.clear();
            this.onButtonUpObservable.clear();
            this.onPadDownObservable.clear();
            this.onPadUpObservable.clear();
        }
    }
}
