declare module BABYLON {
    class Camera extends Node {
        public position: Vector3;
        static PERSPECTIVE_CAMERA: number;
        static ORTHOGRAPHIC_CAMERA: number;
        public upVector: Vector3;
        public orthoLeft: any;
        public orthoRight: any;
        public orthoBottom: any;
        public orthoTop: any;
        public fov: number;
        public minZ: number;
        public maxZ: number;
        public inertia: number;
        public mode: number;
        public isIntermediate: boolean;
        public viewport: Viewport;
        public subCameras: any[];
        public layerMask: number;
        private _computedViewMatrix;
        public _projectionMatrix: Matrix;
        private _worldMatrix;
        public _postProcesses: PostProcess[];
        public _postProcessesTakenIndices: any[];
        constructor(name: string, position: Vector3, scene: Scene);
        public _initCache(): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _updateFromScene(): void;
        public _isSynchronized(): boolean;
        public _isSynchronizedViewMatrix(): boolean;
        public _isSynchronizedProjectionMatrix(): boolean;
        public attachControl(element: HTMLElement): void;
        public detachControl(element: HTMLElement): void;
        public _update(): void;
        public attachPostProcess(postProcess: PostProcess, insertAt?: number): number;
        public detachPostProcess(postProcess: PostProcess, atIndices?: any): number[];
        public getWorldMatrix(): Matrix;
        public _getViewMatrix(): Matrix;
        public getViewMatrix(): Matrix;
        public _computeViewMatrix(force?: boolean): Matrix;
        public getProjectionMatrix(force?: boolean): Matrix;
        public dispose(): void;
    }
}
