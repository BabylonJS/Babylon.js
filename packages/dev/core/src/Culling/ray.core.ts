import { Epsilon } from "core/Maths/math.constants";
import { Matrix, TmpVectors, Vector3 } from "core/Maths/math.vector";
import { BuildArray } from "core/Misc/arrayTools";
import { IntersectionInfo } from "../Collisions/intersectionInfo";
import type { BoundingBox } from "./boundingBox";
import type { BoundingSphere } from "./boundingSphere";
import type { DeepImmutable, float, Nullable } from "core/types";
import type { Plane } from "core/Maths/math.plane";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { PickingInfo } from "core/Collisions/pickingInfo";
import { EngineStore } from "core/Engines/engineStore";
import type { Scene } from "core/scene";
import type { Camera } from "core/Cameras/camera";
import type { Mesh } from "core/Meshes/mesh";
import { _ImportHelper } from "core/import.helper";

/**
 * Type used to define predicate for selecting meshes and instances (if exist)
 */
export type MeshPredicate = (mesh: AbstractMesh, thinInstanceIndex: number) => boolean;

/**
 * Type used to define predicate used to select faces when a mesh intersection is detected
 */
export type TrianglePickingPredicate = (p0: Vector3, p1: Vector3, p2: Vector3, ray: Ray, i0: number, i1: number, i2: number) => boolean;

/**
 * This class allows user to customize internal picking mechanism
 */
export interface IPickingCustomization {
    /**
     * Predicate to select faces when a mesh intersection is detected
     */
    internalPickerForMesh?: (
        pickingInfo: Nullable<PickingInfo>,
        rayFunction: (world: Matrix, enableDistantPicking: boolean) => Ray,
        mesh: AbstractMesh,
        world: Matrix,
        fastCheck?: boolean,
        onlyBoundingInfo?: boolean,
        trianglePredicate?: TrianglePickingPredicate,
        skipBoundingInfo?: boolean
    ) => PickingInfo;
}

/**
 * Use this object to customize mesh picking behavior
 */
export const PickingCustomization: IPickingCustomization = {
    internalPickerForMesh: undefined,
};

/**
 * Class representing a ray with position and direction
 */
export class Ray {
    private static readonly _TmpVector3 = BuildArray(6, Vector3.Zero);
    private static _RayDistant = Ray.Zero();
    private _tmpRay: Ray;

    /**
     * Creates a new ray
     * @param origin origin point
     * @param direction direction
     * @param length length of the ray
     * @param epsilon The epsilon value to use when calculating the ray/triangle intersection (default: Epsilon from math constants)
     */
    constructor(
        /** origin point */
        public origin: Vector3,
        /** direction */
        public direction: Vector3,
        /** [Number.MAX_VALUE] length of the ray */
        public length: number = Number.MAX_VALUE,
        /** [Epsilon] The epsilon value to use when calculating the ray/triangle intersection (default: Epsilon from math constants) */
        public epsilon: number = Epsilon
    ) {}

    // Methods

    /**
     * Clone the current ray
     * @returns a new ray
     */
    public clone(): Ray {
        return new Ray(this.origin.clone(), this.direction.clone(), this.length);
    }

    /**
     * Checks if the ray intersects a box
     * This does not account for the ray length by design to improve perfs.
     * @param minimum bound of the box
     * @param maximum bound of the box
     * @param intersectionTreshold extra extend to be added to the box in all direction
     * @returns if the box was hit
     */
    public intersectsBoxMinMax(minimum: DeepImmutable<Vector3>, maximum: DeepImmutable<Vector3>, intersectionTreshold: number = 0): boolean {
        const newMinimum = Ray._TmpVector3[0].copyFromFloats(minimum.x - intersectionTreshold, minimum.y - intersectionTreshold, minimum.z - intersectionTreshold);
        const newMaximum = Ray._TmpVector3[1].copyFromFloats(maximum.x + intersectionTreshold, maximum.y + intersectionTreshold, maximum.z + intersectionTreshold);
        let d = 0.0;
        let maxValue = Number.MAX_VALUE;
        let inv: number;
        let min: number;
        let max: number;
        let temp: number;
        if (Math.abs(this.direction.x) < 0.0000001) {
            if (this.origin.x < newMinimum.x || this.origin.x > newMaximum.x) {
                return false;
            }
        } else {
            inv = 1.0 / this.direction.x;
            min = (newMinimum.x - this.origin.x) * inv;
            max = (newMaximum.x - this.origin.x) * inv;
            if (max === -Infinity) {
                max = Infinity;
            }

            if (min > max) {
                temp = min;
                min = max;
                max = temp;
            }

            d = Math.max(min, d);
            maxValue = Math.min(max, maxValue);

            if (d > maxValue) {
                return false;
            }
        }

        if (Math.abs(this.direction.y) < 0.0000001) {
            if (this.origin.y < newMinimum.y || this.origin.y > newMaximum.y) {
                return false;
            }
        } else {
            inv = 1.0 / this.direction.y;
            min = (newMinimum.y - this.origin.y) * inv;
            max = (newMaximum.y - this.origin.y) * inv;

            if (max === -Infinity) {
                max = Infinity;
            }

            if (min > max) {
                temp = min;
                min = max;
                max = temp;
            }

            d = Math.max(min, d);
            maxValue = Math.min(max, maxValue);

            if (d > maxValue) {
                return false;
            }
        }

        if (Math.abs(this.direction.z) < 0.0000001) {
            if (this.origin.z < newMinimum.z || this.origin.z > newMaximum.z) {
                return false;
            }
        } else {
            inv = 1.0 / this.direction.z;
            min = (newMinimum.z - this.origin.z) * inv;
            max = (newMaximum.z - this.origin.z) * inv;

            if (max === -Infinity) {
                max = Infinity;
            }

            if (min > max) {
                temp = min;
                min = max;
                max = temp;
            }

            d = Math.max(min, d);
            maxValue = Math.min(max, maxValue);

            if (d > maxValue) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if the ray intersects a box
     * This does not account for the ray length by design to improve perfs.
     * @param box the bounding box to check
     * @param intersectionTreshold extra extend to be added to the BoundingBox in all direction
     * @returns if the box was hit
     */
    public intersectsBox(box: DeepImmutable<BoundingBox>, intersectionTreshold: number = 0): boolean {
        return this.intersectsBoxMinMax(box.minimum, box.maximum, intersectionTreshold);
    }

    /**
     * If the ray hits a sphere
     * @param sphere the bounding sphere to check
     * @param intersectionTreshold extra extend to be added to the BoundingSphere in all direction
     * @returns true if it hits the sphere
     */
    public intersectsSphere(sphere: DeepImmutable<BoundingSphere>, intersectionTreshold: number = 0): boolean {
        const x = sphere.center.x - this.origin.x;
        const y = sphere.center.y - this.origin.y;
        const z = sphere.center.z - this.origin.z;
        const pyth = x * x + y * y + z * z;
        const radius = sphere.radius + intersectionTreshold;
        const rr = radius * radius;

        if (pyth <= rr) {
            return true;
        }

        const dot = x * this.direction.x + y * this.direction.y + z * this.direction.z;
        if (dot < 0.0) {
            return false;
        }

        const temp = pyth - dot * dot;

        return temp <= rr;
    }

    /**
     * If the ray hits a triange
     * @param vertex0 triangle vertex
     * @param vertex1 triangle vertex
     * @param vertex2 triangle vertex
     * @returns intersection information if hit
     */
    public intersectsTriangle(vertex0: DeepImmutable<Vector3>, vertex1: DeepImmutable<Vector3>, vertex2: DeepImmutable<Vector3>): Nullable<IntersectionInfo> {
        const edge1 = Ray._TmpVector3[0];
        const edge2 = Ray._TmpVector3[1];
        const pvec = Ray._TmpVector3[2];
        const tvec = Ray._TmpVector3[3];
        const qvec = Ray._TmpVector3[4];

        vertex1.subtractToRef(vertex0, edge1);
        vertex2.subtractToRef(vertex0, edge2);
        Vector3.CrossToRef(this.direction, edge2, pvec);
        const det = Vector3.Dot(edge1, pvec);

        if (det === 0) {
            return null;
        }

        const invdet = 1 / det;

        this.origin.subtractToRef(vertex0, tvec);

        const bv = Vector3.Dot(tvec, pvec) * invdet;

        if (bv < -this.epsilon || bv > 1.0 + this.epsilon) {
            return null;
        }

        Vector3.CrossToRef(tvec, edge1, qvec);

        const bw = Vector3.Dot(this.direction, qvec) * invdet;

        if (bw < -this.epsilon || bv + bw > 1.0 + this.epsilon) {
            return null;
        }

        //check if the distance is longer than the predefined length.
        const distance = Vector3.Dot(edge2, qvec) * invdet;
        if (distance > this.length) {
            return null;
        }

        return new IntersectionInfo(1 - bv - bw, bv, distance);
    }

    /**
     * Checks if ray intersects a plane
     * @param plane the plane to check
     * @returns the distance away it was hit
     */
    public intersectsPlane(plane: DeepImmutable<Plane>): Nullable<number> {
        let distance: number;
        const result1 = Vector3.Dot(plane.normal, this.direction);
        if (Math.abs(result1) < 9.99999997475243e-7) {
            return null;
        } else {
            const result2 = Vector3.Dot(plane.normal, this.origin);
            distance = (-plane.d - result2) / result1;
            if (distance < 0.0) {
                if (distance < -9.99999997475243e-7) {
                    return null;
                } else {
                    return 0;
                }
            }

            return distance;
        }
    }
    /**
     * Calculate the intercept of a ray on a given axis
     * @param axis to check 'x' | 'y' | 'z'
     * @param offset from axis interception (i.e. an offset of 1y is intercepted above ground)
     * @returns a vector containing the coordinates where 'axis' is equal to zero (else offset), or null if there is no intercept.
     */
    public intersectsAxis(axis: string, offset: number = 0): Nullable<Vector3> {
        switch (axis) {
            case "y": {
                const t = (this.origin.y - offset) / this.direction.y;
                if (t > 0) {
                    return null;
                }
                return new Vector3(this.origin.x + this.direction.x * -t, offset, this.origin.z + this.direction.z * -t);
            }
            case "x": {
                const t = (this.origin.x - offset) / this.direction.x;
                if (t > 0) {
                    return null;
                }
                return new Vector3(offset, this.origin.y + this.direction.y * -t, this.origin.z + this.direction.z * -t);
            }
            case "z": {
                const t = (this.origin.z - offset) / this.direction.z;
                if (t > 0) {
                    return null;
                }
                return new Vector3(this.origin.x + this.direction.x * -t, this.origin.y + this.direction.y * -t, offset);
            }
            default:
                return null;
        }
    }

    /**
     * Checks if ray intersects a mesh. The ray is defined in WORLD space. A mesh triangle can be picked both from its front and back sides,
     * irrespective of orientation.
     * @param mesh the mesh to check
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
     * @param worldToUse defines the world matrix to use to get the world coordinate of the intersection point
     * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
     * @returns picking info of the intersection
     */
    public intersectsMesh(
        mesh: DeepImmutable<AbstractMesh>,
        fastCheck?: boolean,
        trianglePredicate?: TrianglePickingPredicate,
        onlyBoundingInfo = false,
        worldToUse?: Matrix,
        skipBoundingInfo = false
    ): PickingInfo {
        const tm = TmpVectors.Matrix[0];

        mesh.getWorldMatrix().invertToRef(tm);

        if (this._tmpRay) {
            Ray.TransformToRef(this, tm, this._tmpRay);
        } else {
            this._tmpRay = Ray.Transform(this, tm);
        }

        return mesh.intersects(this._tmpRay, fastCheck, trianglePredicate, onlyBoundingInfo, worldToUse, skipBoundingInfo);
    }

    /**
     * Checks if ray intersects a mesh
     * @param meshes the meshes to check
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param results array to store result in
     * @returns Array of picking infos
     */
    public intersectsMeshes(meshes: Array<DeepImmutable<AbstractMesh>>, fastCheck?: boolean, results?: Array<PickingInfo>): Array<PickingInfo> {
        if (results) {
            results.length = 0;
        } else {
            results = [];
        }

        for (let i = 0; i < meshes.length; i++) {
            const pickInfo = this.intersectsMesh(meshes[i], fastCheck);

            if (pickInfo.hit) {
                results.push(pickInfo);
            }
        }

        results.sort(this._comparePickingInfo);

        return results;
    }

    private _comparePickingInfo(pickingInfoA: DeepImmutable<PickingInfo>, pickingInfoB: DeepImmutable<PickingInfo>): number {
        if (pickingInfoA.distance < pickingInfoB.distance) {
            return -1;
        } else if (pickingInfoA.distance > pickingInfoB.distance) {
            return 1;
        } else {
            return 0;
        }
    }

    private static _Smallnum = 0.00000001;
    private static _Rayl = 10e8;

    /**
     * Intersection test between the ray and a given segment within a given tolerance (threshold)
     * @param sega the first point of the segment to test the intersection against
     * @param segb the second point of the segment to test the intersection against
     * @param threshold the tolerance margin, if the ray doesn't intersect the segment but is close to the given threshold, the intersection is successful
     * @returns the distance from the ray origin to the intersection point if there's intersection, or -1 if there's no intersection
     */
    intersectionSegment(sega: DeepImmutable<Vector3>, segb: DeepImmutable<Vector3>, threshold: number): number {
        const o = this.origin;
        const u = TmpVectors.Vector3[0];
        const rsegb = TmpVectors.Vector3[1];
        const v = TmpVectors.Vector3[2];
        const w = TmpVectors.Vector3[3];

        segb.subtractToRef(sega, u);

        this.direction.scaleToRef(Ray._Rayl, v);
        o.addToRef(v, rsegb);

        sega.subtractToRef(o, w);

        const a = Vector3.Dot(u, u); // always >= 0
        const b = Vector3.Dot(u, v);
        const c = Vector3.Dot(v, v); // always >= 0
        const d = Vector3.Dot(u, w);
        const e = Vector3.Dot(v, w);
        const discriminant = a * c - b * b; // always >= 0
        let sN: number,
            sD = discriminant; // sc = sN / sD, default sD = D >= 0
        let tN: number,
            tD = discriminant; // tc = tN / tD, default tD = D >= 0

        // compute the line parameters of the two closest points
        if (discriminant < Ray._Smallnum) {
            // the lines are almost parallel
            sN = 0.0; // force using point P0 on segment S1
            sD = 1.0; // to prevent possible division by 0.0 later
            tN = e;
            tD = c;
        } else {
            // get the closest points on the infinite lines
            sN = b * e - c * d;
            tN = a * e - b * d;
            if (sN < 0.0) {
                // sc < 0 => the s=0 edge is visible
                sN = 0.0;
                tN = e;
                tD = c;
            } else if (sN > sD) {
                // sc > 1 => the s=1 edge is visible
                sN = sD;
                tN = e + b;
                tD = c;
            }
        }

        if (tN < 0.0) {
            // tc < 0 => the t=0 edge is visible
            tN = 0.0;
            // recompute sc for this edge
            if (-d < 0.0) {
                sN = 0.0;
            } else if (-d > a) {
                sN = sD;
            } else {
                sN = -d;
                sD = a;
            }
        } else if (tN > tD) {
            // tc > 1 => the t=1 edge is visible
            tN = tD;
            // recompute sc for this edge
            if (-d + b < 0.0) {
                sN = 0;
            } else if (-d + b > a) {
                sN = sD;
            } else {
                sN = -d + b;
                sD = a;
            }
        }
        // finally do the division to get sc and tc
        const sc = Math.abs(sN) < Ray._Smallnum ? 0.0 : sN / sD;
        const tc = Math.abs(tN) < Ray._Smallnum ? 0.0 : tN / tD;

        // get the difference of the two closest points
        const qtc = TmpVectors.Vector3[4];
        v.scaleToRef(tc, qtc);
        const qsc = TmpVectors.Vector3[5];
        u.scaleToRef(sc, qsc);
        qsc.addInPlace(w);
        const dP = TmpVectors.Vector3[6];
        qsc.subtractToRef(qtc, dP); // = S1(sc) - S2(tc)

        const isIntersected = tc > 0 && tc <= this.length && dP.lengthSquared() < threshold * threshold; // return intersection result

        if (isIntersected) {
            return qsc.length();
        }
        return -1;
    }

    /**
     * Update the ray from viewport position
     * @param x position
     * @param y y position
     * @param viewportWidth viewport width
     * @param viewportHeight viewport height
     * @param world world matrix
     * @param view view matrix
     * @param projection projection matrix
     * @param enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
     * @returns this ray updated
     */
    public update(
        x: number,
        y: number,
        viewportWidth: number,
        viewportHeight: number,
        world: DeepImmutable<Matrix>,
        view: DeepImmutable<Matrix>,
        projection: DeepImmutable<Matrix>,
        enableDistantPicking: boolean = false
    ): Ray {
        if (enableDistantPicking) {
            // With world matrices having great values (like 8000000000 on 1 or more scaling or position axis),
            // multiplying view/projection/world and doing invert will result in loss of float precision in the matrix.
            // One way to fix it is to compute the ray with world at identity then transform the ray in object space.
            // This is slower (2 matrix inverts instead of 1) but precision is preserved.
            // This is hidden behind `EnableDistantPicking` flag (default is false)
            if (!Ray._RayDistant) {
                Ray._RayDistant = Ray.Zero();
            }

            Ray._RayDistant.unprojectRayToRef(x, y, viewportWidth, viewportHeight, Matrix.IdentityReadOnly, view, projection);

            const tm = TmpVectors.Matrix[0];
            world.invertToRef(tm);
            Ray.TransformToRef(Ray._RayDistant, tm, this);
        } else {
            this.unprojectRayToRef(x, y, viewportWidth, viewportHeight, world, view, projection);
        }

        return this;
    }

    // Statics
    /**
     * Creates a ray with origin and direction of 0,0,0
     * @returns the new ray
     */
    public static Zero(): Ray {
        return new Ray(Vector3.Zero(), Vector3.Zero());
    }

    /**
     * Creates a new ray from screen space and viewport
     * @param x position
     * @param y y position
     * @param viewportWidth viewport width
     * @param viewportHeight viewport height
     * @param world world matrix
     * @param view view matrix
     * @param projection projection matrix
     * @returns new ray
     */
    public static CreateNew(
        x: number,
        y: number,
        viewportWidth: number,
        viewportHeight: number,
        world: DeepImmutable<Matrix>,
        view: DeepImmutable<Matrix>,
        projection: DeepImmutable<Matrix>
    ): Ray {
        const result = Ray.Zero();

        return result.update(x, y, viewportWidth, viewportHeight, world, view, projection);
    }

    /**
     * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
     * transformed to the given world matrix.
     * @param origin The origin point
     * @param end The end point
     * @param world a matrix to transform the ray to. Default is the identity matrix.
     * @returns the new ray
     */
    public static CreateNewFromTo(origin: Vector3, end: Vector3, world: DeepImmutable<Matrix> = Matrix.IdentityReadOnly): Ray {
        const result = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        return Ray.CreateFromToToRef(origin, end, result, world);
    }

    /**
     * Function will update a transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
     * transformed to the given world matrix.
     * @param origin The origin point
     * @param end The end point
     * @param result the object to store the result
     * @param world a matrix to transform the ray to. Default is the identity matrix.
     * @returns the ref ray
     */
    public static CreateFromToToRef(origin: Vector3, end: Vector3, result: Ray, world: DeepImmutable<Matrix> = Matrix.IdentityReadOnly): Ray {
        result.origin.copyFrom(origin);
        const direction = end.subtractToRef(origin, result.direction);
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        result.length = length;
        result.direction.normalize();

        return Ray.TransformToRef(result, world, result);
    }

    /**
     * Transforms a ray by a matrix
     * @param ray ray to transform
     * @param matrix matrix to apply
     * @returns the resulting new ray
     */
    public static Transform(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>): Ray {
        const result = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        Ray.TransformToRef(ray, matrix, result);

        return result;
    }

    /**
     * Transforms a ray by a matrix
     * @param ray ray to transform
     * @param matrix matrix to apply
     * @param result ray to store result in
     * @returns the updated result ray
     */
    public static TransformToRef(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>, result: Ray): Ray {
        Vector3.TransformCoordinatesToRef(ray.origin, matrix, result.origin);
        Vector3.TransformNormalToRef(ray.direction, matrix, result.direction);
        result.length = ray.length;
        result.epsilon = ray.epsilon;

        const dir = result.direction;
        const len = dir.length();

        if (!(len === 0 || len === 1)) {
            const num = 1.0 / len;
            dir.x *= num;
            dir.y *= num;
            dir.z *= num;
            result.length *= len;
        }

        return result;
    }

    /**
     * Unproject a ray from screen space to object space
     * @param sourceX defines the screen space x coordinate to use
     * @param sourceY defines the screen space y coordinate to use
     * @param viewportWidth defines the current width of the viewport
     * @param viewportHeight defines the current height of the viewport
     * @param world defines the world matrix to use (can be set to Identity to go to world space)
     * @param view defines the view matrix to use
     * @param projection defines the projection matrix to use
     */
    public unprojectRayToRef(
        sourceX: float,
        sourceY: float,
        viewportWidth: number,
        viewportHeight: number,
        world: DeepImmutable<Matrix>,
        view: DeepImmutable<Matrix>,
        projection: DeepImmutable<Matrix>
    ): void {
        const matrix = TmpVectors.Matrix[0];
        world.multiplyToRef(view, matrix);
        matrix.multiplyToRef(projection, matrix);
        matrix.invert();

        const engine = EngineStore.LastCreatedEngine;
        const nearScreenSource = TmpVectors.Vector3[0];
        nearScreenSource.x = (sourceX / viewportWidth) * 2 - 1;
        nearScreenSource.y = -((sourceY / viewportHeight) * 2 - 1);
        nearScreenSource.z = engine?.useReverseDepthBuffer ? 1 : engine?.isNDCHalfZRange ? 0 : -1;

        // far Z need to be close but < to 1 or camera projection matrix with maxZ = 0 will NaN
        const farScreenSource = TmpVectors.Vector3[1].copyFromFloats(nearScreenSource.x, nearScreenSource.y, 1.0 - 1e-8);
        const nearVec3 = TmpVectors.Vector3[2];
        const farVec3 = TmpVectors.Vector3[3];
        Vector3.TransformCoordinatesToRef(nearScreenSource, matrix, nearVec3);
        Vector3.TransformCoordinatesToRef(farScreenSource, matrix, farVec3);

        this.origin.copyFrom(nearVec3);
        farVec3.subtractToRef(nearVec3, this.direction);
        this.direction.normalize();
    }
}

/**
 * Creates a ray that can be used to pick in the scene
 * @param scene defines the scene to use for the picking
 * @param x defines the x coordinate of the origin (on-screen)
 * @param y defines the y coordinate of the origin (on-screen)
 * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
 * @param camera defines the camera to use for the picking
 * @param cameraViewSpace defines if picking will be done in view space (false by default)
 * @returns a Ray
 */
export function CreatePickingRay(scene: Scene, x: number, y: number, world: Nullable<Matrix>, camera: Nullable<Camera>, cameraViewSpace = false): Ray {
    const result = Ray.Zero();

    CreatePickingRayToRef(scene, x, y, world, result, camera, cameraViewSpace);

    return result;
}

/**
 * Creates a ray that can be used to pick in the scene
 * @param scene defines the scene to use for the picking
 * @param x defines the x coordinate of the origin (on-screen)
 * @param y defines the y coordinate of the origin (on-screen)
 * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
 * @param result defines the ray where to store the picking ray
 * @param camera defines the camera to use for the picking
 * @param cameraViewSpace defines if picking will be done in view space (false by default)
 * @param enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
 * @returns the current scene
 */
export function CreatePickingRayToRef(
    scene: Scene,
    x: number,
    y: number,
    world: Nullable<Matrix>,
    result: Ray,
    camera: Nullable<Camera>,
    cameraViewSpace = false,
    enableDistantPicking = false
): Scene {
    const engine = scene.getEngine();

    if (!camera && !(camera = scene.activeCamera!)) {
        return scene;
    }

    const cameraViewport = camera.viewport;
    const renderHeight = engine.getRenderHeight();
    const { x: vx, y: vy, width, height } = cameraViewport.toGlobal(engine.getRenderWidth(), renderHeight);

    // Moving coordinates to local viewport world
    const levelInv = 1 / engine.getHardwareScalingLevel();
    x = x * levelInv - vx;
    y = y * levelInv - (renderHeight - vy - height);

    result.update(
        x,
        y,
        width,
        height,
        world ? world : Matrix.IdentityReadOnly,
        cameraViewSpace ? Matrix.IdentityReadOnly : camera.getViewMatrix(),
        camera.getProjectionMatrix(),
        enableDistantPicking
    );
    return scene;
}

/**
 * Creates a ray that can be used to pick in the scene
 * @param scene defines the scene to use for the picking
 * @param x defines the x coordinate of the origin (on-screen)
 * @param y defines the y coordinate of the origin (on-screen)
 * @param camera defines the camera to use for the picking
 * @returns a Ray
 */
export function CreatePickingRayInCameraSpace(scene: Scene, x: number, y: number, camera?: Camera): Ray {
    const result = Ray.Zero();

    CreatePickingRayInCameraSpaceToRef(scene, x, y, result, camera);

    return result;
}

/**
 * Creates a ray that can be used to pick in the scene
 * @param scene defines the scene to use for the picking
 * @param x defines the x coordinate of the origin (on-screen)
 * @param y defines the y coordinate of the origin (on-screen)
 * @param result defines the ray where to store the picking ray
 * @param camera defines the camera to use for the picking
 * @returns the current scene
 */
export function CreatePickingRayInCameraSpaceToRef(scene: Scene, x: number, y: number, result: Ray, camera?: Camera): Scene {
    if (!PickingInfo) {
        return scene;
    }

    const engine = scene.getEngine();

    if (!camera && !(camera = scene.activeCamera!)) {
        throw new Error("Active camera not set");
    }

    const cameraViewport = camera.viewport;
    const renderHeight = engine.getRenderHeight();
    const { x: vx, y: vy, width, height } = cameraViewport.toGlobal(engine.getRenderWidth(), renderHeight);
    const identity = Matrix.Identity();

    // Moving coordinates to local viewport world
    const levelInv = 1 / engine.getHardwareScalingLevel();
    x = x * levelInv - vx;
    y = y * levelInv - (renderHeight - vy - height);
    result.update(x, y, width, height, identity, identity, camera.getProjectionMatrix());
    return scene;
}

function InternalPickForMesh(
    pickingInfo: Nullable<PickingInfo>,
    rayFunction: (world: Matrix, enableDistantPicking: boolean) => Ray,
    mesh: AbstractMesh,
    world: Matrix,
    fastCheck?: boolean,
    onlyBoundingInfo?: boolean,
    trianglePredicate?: TrianglePickingPredicate,
    skipBoundingInfo?: boolean
) {
    const ray = rayFunction(world, mesh.enableDistantPicking);

    const result = mesh.intersects(ray, fastCheck, trianglePredicate, onlyBoundingInfo, world, skipBoundingInfo);
    if (!result || !result.hit) {
        return null;
    }

    if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance) {
        return null;
    }

    return result;
}

function InternalPick(
    scene: Scene,
    rayFunction: (world: Matrix, enableDistantPicking: boolean) => Ray,
    predicate?: MeshPredicate,
    fastCheck?: boolean,
    onlyBoundingInfo?: boolean,
    trianglePredicate?: TrianglePickingPredicate
): PickingInfo {
    let pickingInfo = null;

    const computeWorldMatrixForCamera = !!(scene.activeCameras && scene.activeCameras.length > 1 && scene.cameraToUseForPointers !== scene.activeCamera);
    const currentCamera = scene.cameraToUseForPointers || scene.activeCamera;
    const picker = PickingCustomization.internalPickerForMesh || InternalPickForMesh;

    for (let meshIndex = 0; meshIndex < scene.meshes.length; meshIndex++) {
        const mesh = scene.meshes[meshIndex];

        if (predicate) {
            if (!predicate(mesh, -1)) {
                continue;
            }
        } else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
            continue;
        }

        const forceCompute = computeWorldMatrixForCamera && mesh.isWorldMatrixCameraDependent();
        const world = mesh.computeWorldMatrix(forceCompute, currentCamera);

        if (mesh.hasThinInstances && (mesh as Mesh).thinInstanceEnablePicking) {
            // first check if the ray intersects the whole bounding box/sphere of the mesh
            const result = picker(pickingInfo, rayFunction, mesh, world, true, true, trianglePredicate);
            if (result) {
                if (onlyBoundingInfo) {
                    // the user only asked for a bounding info check so we can return
                    return result;
                }
                const tmpMatrix = TmpVectors.Matrix[1];
                const thinMatrices = (mesh as Mesh).thinInstanceGetWorldMatrices();
                for (let index = 0; index < thinMatrices.length; index++) {
                    if (predicate && !predicate(mesh, index)) {
                        continue;
                    }
                    const thinMatrix = thinMatrices[index];
                    thinMatrix.multiplyToRef(world, tmpMatrix);
                    const result = picker(pickingInfo, rayFunction, mesh, tmpMatrix, fastCheck, onlyBoundingInfo, trianglePredicate, true);

                    if (result) {
                        pickingInfo = result;
                        pickingInfo.thinInstanceIndex = index;

                        if (fastCheck) {
                            return pickingInfo;
                        }
                    }
                }
            }
        } else {
            const result = picker(pickingInfo, rayFunction, mesh, world, fastCheck, onlyBoundingInfo, trianglePredicate);

            if (result) {
                pickingInfo = result;

                if (fastCheck) {
                    return pickingInfo;
                }
            }
        }
    }

    return pickingInfo || new PickingInfo();
}

function InternalMultiPick(
    scene: Scene,
    rayFunction: (world: Matrix, enableDistantPicking: boolean) => Ray,
    predicate?: MeshPredicate,
    trianglePredicate?: TrianglePickingPredicate
): Nullable<PickingInfo[]> {
    if (!PickingInfo) {
        return null;
    }
    const pickingInfos: PickingInfo[] = [];
    const computeWorldMatrixForCamera = !!(scene.activeCameras && scene.activeCameras.length > 1 && scene.cameraToUseForPointers !== scene.activeCamera);
    const currentCamera = scene.cameraToUseForPointers || scene.activeCamera;
    const picker = PickingCustomization.internalPickerForMesh || InternalPickForMesh;

    for (let meshIndex = 0; meshIndex < scene.meshes.length; meshIndex++) {
        const mesh = scene.meshes[meshIndex];

        if (predicate) {
            if (!predicate(mesh, -1)) {
                continue;
            }
        } else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
            continue;
        }

        const forceCompute = computeWorldMatrixForCamera && mesh.isWorldMatrixCameraDependent();
        const world = mesh.computeWorldMatrix(forceCompute, currentCamera);

        if (mesh.hasThinInstances && (mesh as Mesh).thinInstanceEnablePicking) {
            const result = picker(null, rayFunction, mesh, world, true, true, trianglePredicate);
            if (result) {
                const tmpMatrix = TmpVectors.Matrix[1];
                const thinMatrices = (mesh as Mesh).thinInstanceGetWorldMatrices();
                for (let index = 0; index < thinMatrices.length; index++) {
                    if (predicate && !predicate(mesh, index)) {
                        continue;
                    }
                    const thinMatrix = thinMatrices[index];
                    thinMatrix.multiplyToRef(world, tmpMatrix);
                    const result = picker(null, rayFunction, mesh, tmpMatrix, false, false, trianglePredicate, true);

                    if (result) {
                        result.thinInstanceIndex = index;
                        pickingInfos.push(result);
                    }
                }
            }
        } else {
            const result = picker(null, rayFunction, mesh, world, false, false, trianglePredicate);

            if (result) {
                pickingInfos.push(result);
            }
        }
    }

    return pickingInfos;
}

/** Launch a ray to try to pick a mesh in the scene using only bounding information of the main mesh (not using submeshes)
 * @param scene defines the scene to use for the picking
 * @param x position on screen
 * @param y position on screen
 * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
 * @param fastCheck defines if the first intersection will be used (and not the closest)
 * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
 * @returns a PickingInfo (Please note that some info will not be set like distance, bv, bu and everything that cannot be capture by only using bounding infos)
 */
export function PickWithBoundingInfo(scene: Scene, x: number, y: number, predicate?: MeshPredicate, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
    if (!PickingInfo) {
        return null;
    }
    const result = InternalPick(
        scene,
        (world) => {
            if (!scene._tempPickingRay) {
                scene._tempPickingRay = Ray.Zero();
            }

            CreatePickingRayToRef(scene, x, y, world, scene._tempPickingRay, camera || null);
            return scene._tempPickingRay;
        },
        predicate,
        fastCheck,
        true
    );
    if (result) {
        result.ray = CreatePickingRay(scene, x, y, Matrix.Identity(), camera || null);
    }
    return result;
}

/** Launch a ray to try to pick a mesh in the scene
 * @param scene defines the scene to use for the picking
 * @param x position on screen
 * @param y position on screen
 * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
 * @param fastCheck defines if the first intersection will be used (and not the closest)
 * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
 * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
 * @param _enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
 * @returns a PickingInfo
 */
export function Pick(
    scene: Scene,
    x: number,
    y: number,
    predicate?: MeshPredicate,
    fastCheck?: boolean,
    camera?: Nullable<Camera>,
    trianglePredicate?: TrianglePickingPredicate,
    _enableDistantPicking = false
): PickingInfo {
    const result = InternalPick(
        scene,
        (world, enableDistantPicking) => {
            if (!scene._tempPickingRay) {
                scene._tempPickingRay = Ray.Zero();
            }

            CreatePickingRayToRef(scene, x, y, world, scene._tempPickingRay, camera || null, false, enableDistantPicking);
            return scene._tempPickingRay;
        },
        predicate,
        fastCheck,
        false,
        trianglePredicate
    );
    if (result) {
        result.ray = CreatePickingRay(scene, x, y, Matrix.Identity(), camera || null);
    }
    return result;
}

/**
 * Use the given ray to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
 * irrespective of orientation.
 * @param scene defines the scene to use for the picking
 * @param ray The ray to use to pick meshes
 * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must have isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
 * @param fastCheck defines if the first intersection will be used (and not the closest)
 * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
 * @returns a PickingInfo
 */
export function PickWithRay(scene: Scene, ray: Ray, predicate?: MeshPredicate, fastCheck?: boolean, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo> {
    const result = InternalPick(
        scene,
        (world) => {
            if (!scene._pickWithRayInverseMatrix) {
                scene._pickWithRayInverseMatrix = Matrix.Identity();
            }
            world.invertToRef(scene._pickWithRayInverseMatrix);

            if (!scene._cachedRayForTransform) {
                scene._cachedRayForTransform = Ray.Zero();
            }

            Ray.TransformToRef(ray, scene._pickWithRayInverseMatrix, scene._cachedRayForTransform);
            return scene._cachedRayForTransform;
        },
        predicate,
        fastCheck,
        false,
        trianglePredicate
    );
    if (result) {
        result.ray = ray;
    }
    return result;
}

/**
 * Launch a ray to try to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
 * irrespective of orientation.
 * @param scene defines the scene to use for the picking
 * @param x X position on screen
 * @param y Y position on screen
 * @param predicate Predicate function used to determine eligible meshes and instances. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
 * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
 * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
 * @returns an array of PickingInfo
 */
export function MultiPick(scene: Scene, x: number, y: number, predicate?: MeshPredicate, camera?: Camera, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
    return InternalMultiPick(scene, (world) => CreatePickingRay(scene, x, y, world, camera || null), predicate, trianglePredicate);
}

/**
 * Launch a ray to try to pick a mesh in the scene
 * @param scene defines the scene to use for the picking
 * @param ray Ray to use
 * @param predicate Predicate function used to determine eligible meshes and instances. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
 * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
 * @returns an array of PickingInfo
 */
export function MultiPickWithRay(scene: Scene, ray: Ray, predicate?: MeshPredicate, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
    return InternalMultiPick(
        scene,
        (world) => {
            if (!scene._pickWithRayInverseMatrix) {
                scene._pickWithRayInverseMatrix = Matrix.Identity();
            }
            world.invertToRef(scene._pickWithRayInverseMatrix);

            if (!scene._cachedRayForTransform) {
                scene._cachedRayForTransform = Ray.Zero();
            }

            Ray.TransformToRef(ray, scene._pickWithRayInverseMatrix, scene._cachedRayForTransform);
            return scene._cachedRayForTransform;
        },
        predicate,
        trianglePredicate
    );
}

/**
 * Gets a ray in the forward direction from the camera.
 * @param camera Defines the camera to use to get the ray from
 * @param length Defines the length of the ray to create
 * @param transform Defines the transform to apply to the ray, by default the world matrix is used to create a workd space ray
 * @param origin Defines the start point of the ray which defaults to the camera position
 * @returns the forward ray
 */
export function GetForwardRay(camera: Camera, length = 100, transform?: Matrix, origin?: Vector3): Ray {
    return GetForwardRayToRef(camera, new Ray(Vector3.Zero(), Vector3.Zero(), length), length, transform, origin);
}

/**
 * Gets a ray in the forward direction from the camera.
 * @param camera Defines the camera to use to get the ray from
 * @param refRay the ray to (re)use when setting the values
 * @param length Defines the length of the ray to create
 * @param transform Defines the transform to apply to the ray, by default the world matrx is used to create a workd space ray
 * @param origin Defines the start point of the ray which defaults to the camera position
 * @returns the forward ray
 */
export function GetForwardRayToRef(camera: Camera, refRay: Ray, length = 100, transform?: Matrix, origin?: Vector3): Ray {
    if (!transform) {
        transform = camera.getWorldMatrix();
    }
    refRay.length = length;

    if (origin) {
        refRay.origin.copyFrom(origin);
    } else {
        refRay.origin.copyFrom(camera.position);
    }
    const forward = TmpVectors.Vector3[2];
    forward.set(0, 0, camera._scene.useRightHandedSystem ? -1 : 1);
    const worldForward = TmpVectors.Vector3[3];
    Vector3.TransformNormalToRef(forward, transform, worldForward);
    Vector3.NormalizeToRef(worldForward, refRay.direction);

    return refRay;
}

/**
 * Initialize the minimal interdependecies between the Ray and Scene and Camera
 * @param sceneClass defines the scene prototype to use
 * @param cameraClass defines the camera prototype to use
 */
export function AddRayExtensions(sceneClass: typeof Scene, cameraClass: typeof Camera): void {
    if (cameraClass) {
        cameraClass.prototype.getForwardRay = function (length = 100, transform?: Matrix, origin?: Vector3): Ray {
            return GetForwardRayToRef(this, new Ray(Vector3.Zero(), Vector3.Zero(), length), length, transform, origin);
        };

        cameraClass.prototype.getForwardRayToRef = function (refRay: Ray, length = 100, transform?: Matrix, origin?: Vector3): Ray {
            return GetForwardRayToRef(this, refRay, length, transform, origin);
        };
    }

    if (!sceneClass) {
        return;
    }

    _ImportHelper._IsPickingAvailable = true;

    sceneClass.prototype.createPickingRay = function (x: number, y: number, world: Nullable<Matrix>, camera: Nullable<Camera>, cameraViewSpace = false): Ray {
        return CreatePickingRay(this, x, y, world, camera, cameraViewSpace);
    };
}
