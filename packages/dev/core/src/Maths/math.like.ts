import type { float, int, DeepImmutable } from "../types";

/**
 * @internal
 */
export interface IColor4Like {
    r: float;
    g: float;
    b: float;
    a: float;
}

/**
 * @internal
 */
export interface IColor3Like {
    r: float;
    g: float;
    b: float;
}

/**
 * @internal
 */
export interface IQuaternionLike {
    x: float;
    y: float;
    z: float;
    w: float;
}

/**
 * @internal
 */
export interface IVector4Like {
    x: float;
    y: float;
    z: float;
    w: float;
}

/**
 * @internal
 */
export interface IVector3Like {
    x: float;
    y: float;
    z: float;
}

/**
 * @internal
 */
export interface IVector2Like {
    x: float;
    y: float;
}

/**
 * @internal
 */
export interface IMatrixLike {
    toArray(): DeepImmutable<Float32Array | Array<number>>;
    updateFlag: int;
}

/**
 * @internal
 */
export interface IViewportLike {
    x: float;
    y: float;
    width: float;
    height: float;
}

/**
 * @internal
 */
export interface IPlaneLike {
    normal: IVector3Like;
    d: float;
    normalize(): void;
}
