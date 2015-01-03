declare module BABYLON {
    class Gamepads {
        private babylonGamepads;
        private oneGamepadConnected;
        private isMonitoring;
        private gamepadEventSupported;
        private gamepadSupportAvailable;
        private _callbackGamepadConnected;
        private buttonADataURL;
        private static gamepadDOMInfo;
        constructor(ongamedpadconnected: (gamepad: Gamepad) => void);
        private _insertGamepadDOMInstructions();
        private _insertGamepadDOMNotSupported();
        public dispose(): void;
        private _onGamepadConnected(evt);
        private _addNewGamepad(gamepad);
        private _onGamepadDisconnected(evt);
        private _startMonitoringGamepads();
        private _stopMonitoringGamepads();
        private _checkGamepadsStatus();
        private _updateGamepadObjects();
    }
    class StickValues {
        public x: any;
        public y: any;
        constructor(x: any, y: any);
    }
    class Gamepad {
        public id: string;
        public index: number;
        public browserGamepad: any;
        private _leftStick;
        private _rightStick;
        private _onleftstickchanged;
        private _onrightstickchanged;
        constructor(id: string, index: number, browserGamepad: any);
        public onleftstickchanged(callback: (values: StickValues) => void): void;
        public onrightstickchanged(callback: (values: StickValues) => void): void;
        public leftStick : StickValues;
        public rightStick : StickValues;
        public update(): void;
    }
    class GenericPad extends Gamepad {
        public id: string;
        public index: number;
        public gamepad: any;
        private _buttons;
        private _onbuttondown;
        private _onbuttonup;
        public onbuttondown(callback: (buttonPressed: number) => void): void;
        public onbuttonup(callback: (buttonReleased: number) => void): void;
        constructor(id: string, index: number, gamepad: any);
        private _setButtonValue(newValue, currentValue, buttonIndex);
        public update(): void;
    }
    enum Xbox360Button {
        A = 0,
        B = 1,
        X = 2,
        Y = 3,
        Start = 4,
        Back = 5,
        LB = 6,
        RB = 7,
        LeftStick = 8,
        RightStick = 9,
    }
    enum Xbox360Dpad {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3,
    }
    class Xbox360Pad extends Gamepad {
        private _leftTrigger;
        private _rightTrigger;
        private _onlefttriggerchanged;
        private _onrighttriggerchanged;
        private _onbuttondown;
        private _onbuttonup;
        private _ondpaddown;
        private _ondpadup;
        private _buttonA;
        private _buttonB;
        private _buttonX;
        private _buttonY;
        private _buttonBack;
        private _buttonStart;
        private _buttonLB;
        private _buttonRB;
        private _buttonLeftStick;
        private _buttonRightStick;
        private _dPadUp;
        private _dPadDown;
        private _dPadLeft;
        private _dPadRight;
        public onlefttriggerchanged(callback: (value: number) => void): void;
        public onrighttriggerchanged(callback: (value: number) => void): void;
        public leftTrigger : number;
        public rightTrigger : number;
        public onbuttondown(callback: (buttonPressed: Xbox360Button) => void): void;
        public onbuttonup(callback: (buttonReleased: Xbox360Button) => void): void;
        public ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void): void;
        public ondpadup(callback: (dPadReleased: Xbox360Dpad) => void): void;
        private _setButtonValue(newValue, currentValue, buttonType);
        private _setDPadValue(newValue, currentValue, buttonType);
        public buttonA : number;
        public buttonB : number;
        public buttonX : number;
        public buttonY : number;
        public buttonStart : number;
        public buttonBack : number;
        public buttonLB : number;
        public buttonRB : number;
        public buttonLeftStick : number;
        public buttonRightStick : number;
        public dPadUp : number;
        public dPadDown : number;
        public dPadLeft : number;
        public dPadRight : number;
        public update(): void;
    }
}
interface Navigator {
    getGamepads(func?: any): any;
    webkitGetGamepads(func?: any): any;
    msGetGamepads(func?: any): any;
    webkitGamepads(func?: any): any;
}
