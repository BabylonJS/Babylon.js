import type { float, int, DeepImmutable, Tuple } from "../types";

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
export interface IColor4Like extends IColor3Like {
    a: float;
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
export interface IVector3Like extends IVector2Like {
    z: float;
}

/**
 * @internal
 */
export interface IVector3LikeInternal {
    _x: number;
    _y: number;
    _z: number;
    _isDirty?: boolean;
}

/**
 * @internal
 */
export interface IVector4Like extends IVector3Like {
    w: float;
}

/**
 * @internal
 */
export interface IQuaternionLike extends IVector3Like {
    w: float;
}

/**
 * @internal
 */
export interface IPlaneLike {
    normal: IVector3Like;
    d: float;
    normalize(): void;
}

/**
 * @internal
 */
export interface IMatrixLike {
    asArray(): DeepImmutable<Tuple<number, 16>>;
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
