import { float, int, DeepImmutable } from '../types';

/**
 * @hidden
 */
export interface IColor4Like {
    r: float;
    g: float;
    b: float;
    a: float;
}

/**
 * @hidden
 */
export interface IColor3Like {
    r: float;
    g: float;
    b: float;
}

/**
 * @hidden
 */
export interface IVector4Like {
    x: float;
    y: float;
    z: float;
    w: float;
}

/**
 * @hidden
 */
export interface IVector3Like {
    x: float;
    y: float;
    z: float;
}

/**
 * @hidden
 */
export interface IVector2Like {
    x: float;
    y: float;
}

/**
 * @hidden
 */
export interface IMatrixLike {
    toArray(): DeepImmutable<Float32Array | Array<number>>;
    updateFlag: int;
}

/**
 * @hidden
 */
export interface IViewportLike {
    x: float;
    y: float;
    width: float;
    height: float;
}

/**
 * @hidden
 */
export interface IPlaneLike {
    normal: IVector3Like;
    d: float;
    normalize(): void;
}