import type { float, int, DeepImmutable } from "../types";

/**
 * @internal
 */
export interface Color4Like {
    r: float;
    g: float;
    b: float;
    a: float;
}

/**
 * @internal
 */
export interface Color3Like {
    r: float;
    g: float;
    b: float;
}

export interface QuaternionLike {
    x: float;
    y: float;
    z: float;
    w: float;
}

/**
 * @internal
 */
export interface Vector4Like {
    x: float;
    y: float;
    z: float;
    w: float;
}

/**
 * @internal
 */
export interface Vector3Like {
    x: float;
    y: float;
    z: float;
}

/**
 * @internal
 */
export interface Vector2Like {
    x: float;
    y: float;
}

/**
 * @internal
 */
export interface MatrixLike {
    toArray(): DeepImmutable<Float32Array | Array<number>>;
    updateFlag: int;
}

/**
 * @internal
 */
export interface ViewportLike {
    x: float;
    y: float;
    width: float;
    height: float;
}

/**
 * @internal
 */
export interface PlaneLike {
    normal: Vector3Like;
    d: float;
    normalize(): void;
}
