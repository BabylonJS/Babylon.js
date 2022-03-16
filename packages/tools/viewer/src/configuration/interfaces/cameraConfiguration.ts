export interface ICameraConfiguration {
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number, w: number };
    fov?: number;
    fovMode?: number;
    minZ?: number;
    maxZ?: number;
    inertia?: number;
    exposure?: number;
    pinchPrecision?: number;
    behaviors?: {
        [name: string]: boolean | number | ICameraBehaviorConfiguration;
    };
    disableCameraControl?: boolean;
    disableCtrlForPanning?: boolean;
    disableAutoFocus?: boolean;

    [propName: string]: any;
}

export interface ICameraBehaviorConfiguration {
    type: number;
    [propName: string]: any;
}