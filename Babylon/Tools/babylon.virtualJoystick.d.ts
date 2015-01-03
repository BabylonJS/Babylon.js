declare module BABYLON {
    enum JoystickAxis {
        X = 0,
        Y = 1,
        Z = 2,
    }
    class VirtualJoystick {
        public reverseLeftRight: boolean;
        public reverseUpDown: boolean;
        public deltaPosition: Vector3;
        public pressed: boolean;
        private static _globalJoystickIndex;
        private static vjCanvas;
        private static vjCanvasContext;
        private static vjCanvasWidth;
        private static vjCanvasHeight;
        private static halfWidth;
        private static halfHeight;
        private _action;
        private _axisTargetedByLeftAndRight;
        private _axisTargetedByUpAndDown;
        private _joystickSensibility;
        private _inversedSensibility;
        private _rotationSpeed;
        private _inverseRotationSpeed;
        private _rotateOnAxisRelativeToMesh;
        private _joystickPointerID;
        private _joystickColor;
        private _joystickPointerPos;
        private _joystickPointerStartPos;
        private _deltaJoystickVector;
        private _leftJoystick;
        private _joystickIndex;
        private _touches;
        constructor(leftJoystick?: boolean);
        public setJoystickSensibility(newJoystickSensibility: number): void;
        private _onPointerDown(e);
        private _onPointerMove(e);
        private _onPointerUp(e);
        /**
        * Change the color of the virtual joystick
        * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
        */
        public setJoystickColor(newColor: string): void;
        public setActionOnTouch(action: () => any): void;
        public setAxisForLeftRight(axis: JoystickAxis): void;
        public setAxisForUpDown(axis: JoystickAxis): void;
        private _clearCanvas();
        private _drawVirtualJoystick();
        public releaseCanvas(): void;
    }
}
declare module BABYLON.VirtualJoystick {
    class Collection<T> {
        private _count;
        private _collection;
        constructor();
        public Count(): number;
        public add<T>(key: string, item: T): number;
        public remove(key: string): number;
        public item(key: string): any;
        public forEach<T>(block: (item: T) => void): void;
    }
}
