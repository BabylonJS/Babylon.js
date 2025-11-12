import type { float, int, Tuple } from "../types";

/**
 * Interface representing a color with RGB components
 */
export interface IColor3Like {
    /** Red component */
    r: float;
    /** Green component */
    g: float;
    /** Blue component */
    b: float;
}

/**
 * Interface representing a color with RGBA components
 */
export interface IColor4Like extends IColor3Like {
    /** Alpha component */
    a: float;
}

/**
 * Interface representing a 2D vector
 */
export interface IVector2Like {
    /** X coordinate */
    x: float;
    /** Y coordinate */
    y: float;
}

/**
 * Interface representing a 3D vector
 */
export interface IVector3Like extends IVector2Like {
    /** Z coordinate */
    z: float;

    /** @internal */
    _x: number;

    /** @internal */
    _y: number;

    /** @internal */
    _z: number;

    /** @internal */
    _isDirty?: boolean;
}

/**
 * Interface representing a 4D vector
 */
export interface IVector4Like extends IVector3Like {
    /** W coordinate */
    w: float;

    /** @internal */
    _w: number;
}

/**
 * Interface representing a quaternion
 */
export interface IQuaternionLike extends IVector3Like {
    /** W component */
    w: float;

    /** @internal */
    _x: number;

    /** @internal */
    _y: number;

    /** @internal */
    _z: number;

    /** @internal */
    _w: number;

    /** @internal */
    _isDirty?: boolean;
}

/**
 * Interface representing a plane
 */
export interface IPlaneLike {
    /** The normal vector of the plane */
    normal: IVector3Like;
    /** The distance from the origin */
    d: float;
    /** Normalizes the plane */
    normalize(): void;
}

/**
 * Interface representing a matrix
 */
export interface IMatrixLike {
    /** Converts the matrix to an array */
    asArray(): Tuple<number, 16>;
    /** Update flag for the matrix */
    updateFlag: int;
}

/**
 * Interface representing a viewport
 */
export interface IViewportLike {
    /** X position of the viewport */
    x: float;
    /** Y position of the viewport */
    y: float;
    /** Width of the viewport */
    width: float;
    /** Height of the viewport */
    height: float;
}
