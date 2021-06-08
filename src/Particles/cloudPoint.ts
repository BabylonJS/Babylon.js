import { Nullable } from "../types";
import { Color4, Vector2, Vector3, TmpVectors, Matrix, Quaternion } from "../Maths/math";
import { Mesh } from "../Meshes/mesh";
import { BoundingInfo } from "../Culling/boundingInfo";
import { PointsCloudSystem } from "./pointsCloudSystem";
/**
 * Represents one particle of a points cloud system.
 */
export class CloudPoint {
    /**
     * particle global index
     */
    public idx: number = 0;
    /**
     * The color of the particle
     */
    public color: Nullable<Color4> = new Color4(1.0, 1.0, 1.0, 1.0);
    /**
     * The world space position of the particle.
     */
    public position: Vector3 = Vector3.Zero();
    /**
     * The world space rotation of the particle. (Not use if rotationQuaternion is set)
     */
    public rotation: Vector3 = Vector3.Zero();
    /**
     * The world space rotation quaternion of the particle.
     */
    public rotationQuaternion: Nullable<Quaternion>;
    /**
     * The uv of the particle.
     */
    public uv: Nullable<Vector2> = new Vector2(0.0, 0.0);
    /**
     * The current speed of the particle.
     */
    public velocity: Vector3 = Vector3.Zero();
    /**
     * The pivot point in the particle local space.
     */
    public pivot: Vector3 = Vector3.Zero();
    /**
     * Must the particle be translated from its pivot point in its local space ?
     * In this case, the pivot point is set at the origin of the particle local space and the particle is translated.
     * Default : false
     */
    public translateFromPivot: boolean = false;
    /**
     * Index of this particle in the global "positions" array (Internal use)
     * @hidden
     */
    public _pos: number = 0;
    /**
     * @hidden Index of this particle in the global "indices" array (Internal use)
     */
    public _ind: number = 0;
    /**
     * Group this particle belongs to
     */
    public _group: PointsGroup;
    /**
     * Group id of this particle
     */
    public groupId: number = 0;
    /**
     * Index of the particle in its group id (Internal use)
     */
    public idxInGroup: number = 0;
    /**
     * @hidden Particle BoundingInfo object (Internal use)
     */
    public _boundingInfo: BoundingInfo;
    /**
     * @hidden Reference to the PCS that the particle belongs to (Internal use)
     */
    public _pcs: PointsCloudSystem;
    /**
     * @hidden Still set as invisible in order to skip useless computations (Internal use)
     */
    public _stillInvisible: boolean = false;
    /**
     * @hidden Last computed particle rotation matrix
     */
    public _rotationMatrix: number[] = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
    /**
     * Parent particle Id, if any.
     * Default null.
     */
    public parentId: Nullable<number> = null;
    /**
     * @hidden Internal global position in the PCS.
     */
    public _globalPosition: Vector3 = Vector3.Zero();

    /**
     * Creates a Point Cloud object.
     * Don't create particles manually, use instead the PCS internal tools like _addParticle()
     * @param particleIndex (integer) is the particle index in the PCS pool. It's also the particle identifier.
     * @param group (PointsGroup) is the group the particle belongs to
     * @param groupId (integer) is the group identifier in the PCS.
     * @param idxInGroup (integer) is the index of the particle in the current point group (ex: the 10th point of addPoints(30))
     * @param pcs defines the PCS it is associated to
     */
    constructor(particleIndex: number, group: PointsGroup, groupId: number, idxInGroup: number, pcs: PointsCloudSystem) {
        this.idx = particleIndex;
        this._group = group;
        this.groupId = groupId;
        this.idxInGroup = idxInGroup;
        this._pcs = pcs;
    }

    /**
     * get point size
     */
    public get size(): Vector3 {
        return this.size;
    }

    /**
     * Set point size
     */
    public set size(scale: Vector3) {
        this.size = scale;
    }

    /**
     * Legacy support, changed quaternion to rotationQuaternion
     */
    public get quaternion(): Nullable<Quaternion> {
        return this.rotationQuaternion;
    }

    /**
     * Legacy support, changed quaternion to rotationQuaternion
     */
    public set quaternion(q: Nullable<Quaternion>) {
        this.rotationQuaternion = q;
    }

    /**
     * Returns a boolean. True if the particle intersects a mesh, else false
     * The intersection is computed on the particle position and Axis Aligned Bounding Box (AABB) or Sphere
     * @param target is the object (point or mesh) what the intersection is computed against
     * @param isSphere is boolean flag when false (default) bounding box of mesh is used, when true the bounding sphere is used
     * @returns true if it intersects
     */
    public intersectsMesh(target: Mesh, isSphere: boolean): boolean {
        if (!target._boundingInfo) {
            return false;
        }
        isSphere = isSphere ? isSphere : false;

        if (isSphere) {
            return target.getBoundingInfo().boundingSphere.intersectsPoint(this.position.add(this._pcs.mesh.position));
        }
        else {
            let maxX = 0;
            let minX = 0;
            let maxY = 0;
            let minY = 0;
            let maxZ = 0;
            let minZ = 0;
            maxX = target.getBoundingInfo().boundingBox.maximumWorld.x;
            minX = target.getBoundingInfo().boundingBox.minimumWorld.x;
            maxY = target.getBoundingInfo().boundingBox.maximumWorld.y;
            minY = target.getBoundingInfo().boundingBox.minimumWorld.y;
            maxZ = target.getBoundingInfo().boundingBox.maximumWorld.z;
            minZ = target.getBoundingInfo().boundingBox.minimumWorld.z;

            let x = this.position.x + this._pcs.mesh.position.x;
            let y = this.position.y + this._pcs.mesh.position.y;
            let z = this.position.z + this._pcs.mesh.position.z;
            return minX <= x  &&  x <= maxX && minY <= y && y <= maxY && minZ <= z && z <= maxZ;
        }
    }

    /**
     * get the rotation matrix of the particle
     * @hidden
     */
    public getRotationMatrix(m: Matrix) {
        let quaternion: Quaternion;
        if (this.rotationQuaternion) {
            quaternion = this.rotationQuaternion;
        }
        else {
            quaternion = TmpVectors.Quaternion[0];
            const rotation = this.rotation;
            Quaternion.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, quaternion);
        }

        quaternion.toRotationMatrix(m);
    }
}

/**
 * Represents a group of points in a points cloud system
 *  * PCS internal tool, don't use it manually.
 */
export class PointsGroup {
    /**
     * Get or set the groupId
     * @deprecated Please use groupId instead
     */
    public get groupID(): number {
        return this.groupId;
    }
    public set groupID(groupID: number) {
        this.groupId = groupID;
    }
    /**
     * The group id
     * @hidden
     */
    public groupId: number;
    /**
     * image data for group (internal use)
     * @hidden
     */
    public _groupImageData: Nullable<ArrayBufferView>;
    /**
     * Image Width (internal use)
     * @hidden
     */
    public _groupImgWidth: number;
    /**
     * Image Height (internal use)
     * @hidden
     */
    public _groupImgHeight: number;
    /**
     * Custom position function (internal use)
     * @hidden
     */
    public _positionFunction: Nullable<(particle: CloudPoint, i?: number, s?: number) => void>;
    /**
     * density per facet for surface points
     * @hidden
     */
    public _groupDensity: number[];
    /**
     * Only when points are colored by texture carries pointer to texture list array
     * @hidden
     */
    public _textureNb: number;

    /**
     * Creates a points group object. This is an internal reference to produce particles for the PCS.
     * PCS internal tool, don't use it manually.
     * @hidden
     */
    constructor(id: number, posFunction: Nullable<(particle: CloudPoint, i?: number, s?: number) => void>) {
        this.groupId = id;
        this._positionFunction = posFunction;
    }
}
