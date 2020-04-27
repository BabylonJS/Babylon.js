import { Nullable } from "../types";
import { Vector3, Matrix, TmpVectors, Quaternion, Vector4, Vector2 } from "../Maths/math.vector";
import { Color4 } from '../Maths/math.color';
import { Mesh } from "../Meshes/mesh";
import { BoundingInfo } from "../Culling/boundingInfo";
import { BoundingSphere } from "../Culling/boundingSphere";
import { SolidParticleSystem } from "./solidParticleSystem";
import { AbstractMesh } from '../Meshes/abstractMesh';
import { Plane } from '../Maths/math.plane';
import { Material } from '../Materials/material';
/**
 * Represents one particle of a solid particle system.
 */
export class SolidParticle {
    /**
     * particle global index
     */
    public idx: number = 0;
    /**
     * particle identifier
     */
    public id: number = 0;
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
     * The scaling of the particle.
     */
    public scaling: Vector3 = Vector3.One();
    /**
     * The uvs of the particle.
     */
    public uvs: Vector4 = new Vector4(0.0, 0.0, 1.0, 1.0);
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
     * Is the particle active or not ?
     */
    public alive: boolean = true;
    /**
     * Is the particle visible or not ?
     */
    public isVisible: boolean = true;
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
     * @hidden ModelShape of this particle (Internal use)
     */
    public _model: ModelShape;
    /**
     * ModelShape id of this particle
     */
    public shapeId: number = 0;
    /**
     * Index of the particle in its shape id
     */
    public idxInShape: number = 0;
    /**
     * @hidden Reference to the shape model BoundingInfo object (Internal use)
     */
    public _modelBoundingInfo: BoundingInfo;
    /**
     * @hidden Particle BoundingInfo object (Internal use)
     */
    public _boundingInfo: BoundingInfo;
    /**
     * @hidden Reference to the SPS what the particle belongs to (Internal use)
     */
    public _sps: SolidParticleSystem;
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
     * The particle material identifier (integer) when MultiMaterials are enabled in the SPS.
     */
    public materialIndex: Nullable<number> = null;
    /**
     * Custom object or properties.
     */
    public props: Nullable<any> = null;
    /**
     * The culling strategy to use to check whether the solid particle must be culled or not when using isInFrustum().
     * The possible values are :
     * - AbstractMesh.CULLINGSTRATEGY_STANDARD
     * - AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
     * - AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION
     * - AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY
     * The default value for solid particles is AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
     * Please read each static variable documentation in the class AbstractMesh to get details about the culling process.
     * */
    public cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;

    /**
     * @hidden Internal global position in the SPS.
     */
    public _globalPosition: Vector3 = Vector3.Zero();

    /**
     * Creates a Solid Particle object.
     * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
     * @param particleIndex (integer) is the particle index in the Solid Particle System pool.
     * @param particleId (integer) is the particle identifier. Unless some particles are removed from the SPS, it's the same value than the particle idx.
     * @param positionIndex (integer) is the starting index of the particle vertices in the SPS "positions" array.
     * @param indiceIndex (integer) is the starting index of the particle indices in the SPS "indices" array.
     * @param model (ModelShape) is a reference to the model shape on what the particle is designed.
     * @param shapeId (integer) is the model shape identifier in the SPS.
     * @param idxInShape (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
     * @param sps defines the sps it is associated to
     * @param modelBoundingInfo is the reference to the model BoundingInfo used for intersection computations.
     * @param materialIndex is the particle material identifier (integer) when the MultiMaterials are enabled in the SPS.
     */
    constructor(particleIndex: number, particleId: number, positionIndex: number, indiceIndex: number, model: Nullable<ModelShape>, shapeId: number, idxInShape: number, sps: SolidParticleSystem, modelBoundingInfo: Nullable<BoundingInfo> = null, materialIndex: Nullable<number> = null) {
        this.idx = particleIndex;
        this.id = particleId;
        this._pos = positionIndex;
        this._ind = indiceIndex;
        this._model = <ModelShape>model;
        this.shapeId = shapeId;
        this.idxInShape = idxInShape;
        this._sps = sps;
        if (modelBoundingInfo) {
            this._modelBoundingInfo = modelBoundingInfo;
            this._boundingInfo = new BoundingInfo(modelBoundingInfo.minimum, modelBoundingInfo.maximum);
        }
        if (materialIndex !== null) {
            this.materialIndex = materialIndex;
        }
    }
    /**
     * Copies the particle property values into the existing target : position, rotation, scaling, uvs, colors, pivot, parent, visibility, alive
     * @param target the particle target
     * @returns the current particle
     */
    public copyToRef(target: SolidParticle): SolidParticle {
        target.position.copyFrom(this.position);
        target.rotation.copyFrom(this.rotation);
        if (this.rotationQuaternion) {
            if (target.rotationQuaternion) {
                target.rotationQuaternion!.copyFrom(this.rotationQuaternion!);
            }
            else {
                target.rotationQuaternion = this.rotationQuaternion.clone();
            }
        }
        target.scaling.copyFrom(this.scaling);
        if (this.color) {
            if (target.color) {
                target.color!.copyFrom(this.color!);
            }
            else {
                target.color = this.color.clone();
            }
        }
        target.uvs.copyFrom(this.uvs);
        target.velocity.copyFrom(this.velocity);
        target.pivot.copyFrom(this.pivot);
        target.translateFromPivot = this.translateFromPivot;
        target.alive = this.alive;
        target.isVisible = this.isVisible;
        target.parentId = this.parentId;
        target.cullingStrategy = this.cullingStrategy;
        if (this.materialIndex !== null) {
            target.materialIndex = this.materialIndex;
        }
        return this;
    }
    /**
     * Legacy support, changed scale to scaling
     */
    public get scale(): Vector3 {
        return this.scaling;
    }

    /**
     * Legacy support, changed scale to scaling
     */
    public set scale(scale: Vector3) {
        this.scaling = scale;
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
     * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
     * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
     * @param target is the object (solid particle or mesh) what the intersection is computed against.
     * @returns true if it intersects
     */
    public intersectsMesh(target: Mesh | SolidParticle): boolean {
        if (!this._boundingInfo || !target._boundingInfo) {
            return false;
        }
        if (this._sps._bSphereOnly) {
            return BoundingSphere.Intersects(this._boundingInfo.boundingSphere, target._boundingInfo.boundingSphere);
        }
        return this._boundingInfo.intersects(target._boundingInfo, false);
    }

    /**
     * Returns `true` if the solid particle is within the frustum defined by the passed array of planes.
     * A particle is in the frustum if its bounding box intersects the frustum
     * @param frustumPlanes defines the frustum to test
     * @returns true if the particle is in the frustum planes
     */
    public isInFrustum(frustumPlanes: Plane[]): boolean {
        return this._boundingInfo !== null && this._boundingInfo.isInFrustum(frustumPlanes, this.cullingStrategy);
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
 * Represents the shape of the model used by one particle of a solid particle system.
 * SPS internal tool, don't use it manually.
 */
export class ModelShape {
    /**
     * The shape id
     * @hidden
     */
    public shapeID: number;
    /**
     * flat array of model positions (internal use)
     * @hidden
     */
    public _shape: Vector3[];
    /**
     * flat array of model UVs (internal use)
     * @hidden
     */
    public _shapeUV: number[];
    /**
     * color array of the model
     * @hidden
     */
    public _shapeColors: number[];
    /**
     * indices array of the model
     * @hidden
     */
    public _indices: number[];
    /**
     * normals array of the model
     * @hidden
     */
    public _normals: number[];
    /**
     * length of the shape in the model indices array (internal use)
     * @hidden
     */
    public _indicesLength: number = 0;
    /**
     * Custom position function (internal use)
     * @hidden
     */
    public _positionFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>;
    /**
     * Custom vertex function (internal use)
     * @hidden
     */
    public _vertexFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>;
    /**
     * Model material (internal use)
     * @hidden
     */
    public _material: Nullable<Material>;

    /**
     * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
     * SPS internal tool, don't use it manually.
     * @hidden
     */
    constructor(id: number, shape: Vector3[], indices: number[], normals: number[], colors: number[], shapeUV: number[],
        posFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>, vtxFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>,
        material: Nullable<Material>) {
        this.shapeID = id;
        this._shape = shape;
        this._indices = indices;
        this._indicesLength = indices.length;
        this._shapeUV = shapeUV;
        this._shapeColors = colors;
        this._normals = normals;
        this._positionFunction = posFunction;
        this._vertexFunction = vtxFunction;
        this._material = material;
    }
}

/**
 * Represents a Depth Sorted Particle in the solid particle system.
 * @hidden
 */
export class DepthSortedParticle {
    /**
     * Particle index
     */
    public idx: number = 0;
    /**
     * Index of the particle in the "indices" array
     */
    public ind: number = 0;
    /**
     * Length of the particle shape in the "indices" array
     */
    public indicesLength: number = 0;
    /**
     * Squared distance from the particle to the camera
     */
    public sqDistance: number = 0.0;
    /**
     * Material index when used with MultiMaterials
     */
    public materialIndex: number = 0;

    /**
     * Creates a new sorted particle
     * @param materialIndex
     */
    constructor(idx: number, ind: number, indLength: number, materialIndex: number) {
        this.idx = idx;
        this.ind = ind;
        this.indicesLength = indLength;
        this.materialIndex = materialIndex;
    }
}

/**
 * Represents a solid particle vertex
 */
export class SolidParticleVertex {
    /**
     * Vertex position
     */
    public position: Vector3;
    /**
     * Vertex color
     */
    public color: Color4;
    /**
     * Vertex UV
     */
    public uv: Vector2;
    /**
     * Creates a new solid particle vertex
     */
    constructor() {
        this.position = Vector3.Zero();
        this.color = new Color4(1.0, 1.0, 1.0, 1.0);
        this.uv = Vector2.Zero();
    }
    // Getters and Setters for back-compatibility
    /** Vertex x coordinate */
    public get x(): number {
        return this.position.x;
    }
    public set x(val: number) {
        this.position.x = val;
    }
    /** Vertex y coordinate */
    public get y(): number {
        return this.position.y;
    }
    public set y(val: number) {
        this.position.y = val;
    }
    /** Vertex z coordinate */
    public get z(): number {
        return this.position.z;
    }
    public set z(val: number) {
        this.position.z = val;
    }
}