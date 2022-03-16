import { IModelAnimationConfiguration } from "./modelAnimationConfiguration";

export interface IModelConfiguration {
    id?: string;
    url?: string;
    root?: string; //optional
    file?: string | File; // is a file being loaded? root and url ignored
    loader?: string; // obj, gltf?
    position?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number, w?: number };
    scaling?: { x: number, y: number, z: number };
    parentObjectIndex?: number; // the index of the parent object of the model in the loaded meshes array.

    castShadow?: boolean;
    receiveShadows?: boolean;
    normalize?: boolean | {
        center?: boolean;
        unitSize?: boolean;
        parentIndex?: number;
    }; // should the model be scaled to unit-size

    title?: string;
    subtitle?: string;
    thumbnail?: string; // URL or data-url

    animation?: {
        autoStart?: boolean | string;
        playOnce?: boolean;
        autoStartIndex?: number;
    };

    entryAnimation?: IModelAnimationConfiguration;
    exitAnimation?: IModelAnimationConfiguration;

    material?: {
        directEnabled?: boolean;
        directIntensity?: number;
        emissiveIntensity?: number;
        environmentIntensity?: number;
        [propName: string]: any;
    };

    /**
     * Rotation offset axis definition
     */
    rotationOffsetAxis?: {
        x: number;
        y: number;
        z: number;
    };

    /**
     * the offset angle
     */
    rotationOffsetAngle?: number;

    loaderConfiguration?: {
        maxLODsToLoad?: number;
        progressiveLoading?: boolean;
    };

    // [propName: string]: any; // further configuration, like title and creator
}