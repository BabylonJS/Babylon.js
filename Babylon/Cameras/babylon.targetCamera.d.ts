declare module BABYLON {
    class TargetCamera extends Camera {
        public cameraDirection: Vector3;
        public cameraRotation: Vector2;
        public rotation: Vector3;
        public speed: number;
        public noRotationConstraint: boolean;
        public lockedTarget: any;
        public _currentTarget: Vector3;
        public _viewMatrix: Matrix;
        public _camMatrix: Matrix;
        public _cameraTransformMatrix: Matrix;
        public _cameraRotationMatrix: Matrix;
        public _referencePoint: Vector3;
        public _transformedReferencePoint: Vector3;
        public _lookAtTemp: Matrix;
        public _tempMatrix: Matrix;
        public _reset: () => void;
        public _waitingLockedTargetId: string;
        constructor(name: string, position: Vector3, scene: Scene);
        public _getLockedTargetPosition(): Vector3;
        public _initCache(): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _isSynchronizedViewMatrix(): boolean;
        public _computeLocalCameraSpeed(): number;
        public setTarget(target: Vector3): void;
        public getTarget(): Vector3;
        public _decideIfNeedsToMove(): boolean;
        public _updatePosition(): void;
        public _update(): void;
        public _getViewMatrix(): Matrix;
    }
}
