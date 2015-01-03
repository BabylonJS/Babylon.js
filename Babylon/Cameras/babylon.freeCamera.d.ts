declare module BABYLON {
    class FreeCamera extends TargetCamera {
        public ellipsoid: Vector3;
        public keysUp: number[];
        public keysDown: number[];
        public keysLeft: number[];
        public keysRight: number[];
        public checkCollisions: boolean;
        public applyGravity: boolean;
        public angularSensibility: number;
        public onCollide: (collidedMesh: AbstractMesh) => void;
        private _keys;
        private _collider;
        private _needMoveForGravity;
        private _oldPosition;
        private _diffPosition;
        private _newPosition;
        private _attachedElement;
        private _localDirection;
        private _transformedDirection;
        private _onMouseDown;
        private _onMouseUp;
        private _onMouseOut;
        private _onMouseMove;
        private _onKeyDown;
        private _onKeyUp;
        public _onLostFocus: (e: FocusEvent) => any;
        public _waitingLockedTargetId: string;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
        public _collideWithWorld(velocity: Vector3): void;
        public _checkInputs(): void;
        public _decideIfNeedsToMove(): boolean;
        public _updatePosition(): void;
        public _update(): void;
    }
}
