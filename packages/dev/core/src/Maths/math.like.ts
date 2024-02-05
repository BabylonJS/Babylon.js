import type { DeepImmutable } from "../types";

/**
 * @internal
 */
export interface IColor3Like {
    r: number;
    g: number;
    b: number;
}

/**
 * @internal
 */
export interface IColor4Like extends IColor3Like {
    a: number;
}

/**
 * @internal
 */
export interface IVector2Like {
    x: number;
    y: number;
}

/**
 * @internal
 */
export interface IVector3Like extends IVector2Like {
    z: number;
}

/**
 * @internal
 */
export interface IVector4Like extends IVector3Like {
    w: number;
}

/**
 * @internal
 */
export interface IQuaternionLike extends IVector3Like {
    w: number;
}

/**
 * @internal
 */
export interface IPlaneLike {
    normal: IVector3Like;
    d: number;
    normalize(): void;
}

/**
 * @internal
 */
export interface IMatrixLike {
    asArray(): DeepImmutable<Float32Array | Array<number>>;
    updateFlag: number;
}
