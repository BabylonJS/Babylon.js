import { Nullable, IndicesArray, FloatArray } from "../types";
import { Vector3, Matrix, TmpVectors, Quaternion } from "../Maths/math.vector";
import { Color4 } from '../Maths/math.color';
import { VertexBuffer } from "../Meshes/buffer";
import { VertexData } from "../Meshes/mesh.vertexData";
import { Mesh } from "../Meshes/mesh";
import { DiscBuilder } from "../Meshes/Builders/discBuilder";
import { EngineStore } from "../Engines/engineStore";
import { Scene, IDisposable } from "../scene";
import { DepthSortedParticle, SolidParticle, ModelShape, SolidParticleVertex } from "./solidParticle";
import { TargetCamera } from "../Cameras/targetCamera";
import { BoundingInfo } from "../Culling/boundingInfo";
import { Axis } from '../Maths/math.axis';
import { SubMesh } from '../Meshes/subMesh';
import { Material } from '../Materials/material';
import { StandardMaterial } from '../Materials/standardMaterial';
import { MultiMaterial } from '../Materials/multiMaterial';
import { PickingInfo } from '../Collisions/pickingInfo';

/**
 * The SPS is a single updatable mesh. The solid particles are simply separate parts or faces fo this big mesh.
 *As it is just a mesh, the SPS has all the same properties than any other BJS mesh : not more, not less. It can be scaled, rotated, translated, enlighted, textured, moved, etc.

 * The SPS is also a particle system. It provides some methods to manage the particles.
 * However it is behavior agnostic. This means it has no emitter, no particle physics, no particle recycler. You have to implement your own behavior.
 *
 * Full documentation here : http://doc.babylonjs.com/how_to/Solid_Particle_System
 */
export class SolidParticleSystem implements IDisposable {
    /**
     *  The SPS array of Solid Particle objects. Just access each particle as with any classic array.
     *  Example : var p = SPS.particles[i];
     */
    public particles: SolidParticle[] = new Array<SolidParticle>();
    /**
     * The SPS total number of particles. Read only. Use SPS.counter instead if you need to set your own value.
     */
    public nbParticles: number = 0;
    /**
     * If the particles must ever face the camera (default false). Useful for planar particles.
     */
    public billboard: boolean = false;
    /**
     * Recompute normals when adding a shape
     */
    public recomputeNormals: boolean = false;
    /**
     * This a counter ofr your own usage. It's not set by any SPS functions.
     */
    public counter: number = 0;
    /**
     * The SPS name. This name is also given to the underlying mesh.
     */
    public name: string;
    /**
     * The SPS mesh. It's a standard BJS Mesh, so all the methods from the Mesh class are avalaible.
     */
    public mesh: Mesh;
    /**
     * This empty object is intended to store some SPS specific or temporary values in order to lower the Garbage Collector activity.
     * Please read : http://doc.babylonjs.com/how_to/Solid_Particle_System#garbage-collector-concerns
     */
    public vars: any = {};
    /**
     * This array is populated when the SPS is set as 'pickable'.
     * Each key of this array is a `faceId` value that you can get from a pickResult object.
     * Each element of this array is an object `{idx: int, faceId: int}`.
     * `idx` is the picked particle index in the `SPS.particles` array
     * `faceId` is the picked face index counted within this particle.
     * This array is the first element of the pickedBySubMesh array : sps.pickBySubMesh[0].
     * It's not pertinent to use it when using a SPS with the support for MultiMaterial enabled.
     * Use the method SPS.pickedParticle(pickingInfo) instead.
     * Please read : http://doc.babylonjs.com/how_to/Solid_Particle_System#pickable-particles
     */
    public pickedParticles: { idx: number; faceId: number }[];
    /**
     * This array is populated when the SPS is set as 'pickable'
     * Each key of this array is a submesh index.
     * Each element of this array is a second array defined like this :
     * Each key of this second array is a `faceId` value that you can get from a pickResult object.
     * Each element of this second array is an object `{idx: int, faceId: int}`.
     * `idx` is the picked particle index in the `SPS.particles` array
     * `faceId` is the picked face index counted within this particle.
     * It's better to use the method SPS.pickedParticle(pickingInfo) rather than using directly this array.
     * Please read : http://doc.babylonjs.com/how_to/Solid_Particle_System#pickable-particles
     */
    public pickedBySubMesh: { idx: number; faceId: number}[][];
    /**
     * This array is populated when `enableDepthSort` is set to true.
     * Each element of this array is an instance of the class DepthSortedParticle.
     */
    public depthSortedParticles: DepthSortedParticle[];

    /**
     * If the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster). (Internal use only)
     * @hidden
     */
    public _bSphereOnly: boolean = false;
    /**
     * A number to multiply the boundind sphere radius by in order to reduce it for instance. (Internal use only)
     * @hidden
     */
    public _bSphereRadiusFactor: number = 1.0;

    private _scene: Scene;
    private _positions: number[] = new Array<number>();
    private _indices: number[] = new Array<number>();
    private _normals: number[] = new Array<number>();
    private _colors: number[] = new Array<number>();
    private _uvs: number[] = new Array<number>();
    private _indices32: IndicesArray;           // used as depth sorted array if depth sort enabled, else used as typed indices
    private _positions32: Float32Array;         // updated positions for the VBO
    private _normals32: Float32Array;           // updated normals for the VBO
    private _fixedNormal32: Float32Array;       // initial normal references
    private _colors32: Float32Array;
    private _uvs32: Float32Array;
    private _index: number = 0;  // indices index
    private _updatable: boolean = true;
    private _pickable: boolean = false;
    private _isVisibilityBoxLocked = false;
    private _alwaysVisible: boolean = false;
    private _depthSort: boolean = false;
    private _expandable: boolean = false;
    private _shapeCounter: number = 0;
    private _copy: SolidParticle = new SolidParticle(0, 0, 0, 0, null, 0, 0, this);
    private _color: Color4 = new Color4(0, 0, 0, 0);
    private _computeParticleColor: boolean = true;
    private _computeParticleTexture: boolean = true;
    private _computeParticleRotation: boolean = true;
    private _computeParticleVertex: boolean = false;
    private _computeBoundingBox: boolean = false;
    private _depthSortParticles: boolean = true;
    private _camera: TargetCamera;
    private _mustUnrotateFixedNormals = false;
    private _particlesIntersect: boolean = false;
    private _needs32Bits: boolean = false;
    private _isNotBuilt: boolean = true;
    private _lastParticleId: number = 0;
    private _idxOfId: number[] = [];            // array : key = particle.id / value = particle.idx
    private _multimaterialEnabled: boolean = false;
    private _useModelMaterial: boolean = false;
    private _indicesByMaterial: number[];
    private _materialIndexes: number[];
    private _depthSortFunction = (p1: DepthSortedParticle, p2: DepthSortedParticle) => p2.sqDistance - p1.sqDistance;
    private _materialSortFunction = (p1: DepthSortedParticle, p2: DepthSortedParticle) => p1.materialIndex - p2.materialIndex;
    private _materials: Material[];
    private _multimaterial: MultiMaterial;
    private _materialIndexesById: any;
    private _defaultMaterial: Material;
    private _autoUpdateSubMeshes: boolean = false;
    private _tmpVertex: SolidParticleVertex;

    /**
     * Creates a SPS (Solid Particle System) object.
     * @param name (String) is the SPS name, this will be the underlying mesh name.
     * @param scene (Scene) is the scene in which the SPS is added.
     * @param options defines the options of the sps e.g.
     * * updatable (optional boolean, default true) : if the SPS must be updatable or immutable.
     * * isPickable (optional boolean, default false) : if the solid particles must be pickable.
     * * enableDepthSort (optional boolean, default false) : if the solid particles must be sorted in the geometry according to their distance to the camera.
     * * useModelMaterial (optional boolean, defaut false) : if the model materials must be used to create the SPS multimaterial. This enables the multimaterial supports of the SPS.
     * * enableMultiMaterial (optional boolean, default false) : if the solid particles can be given different materials.
     * * expandable (optional boolean, default false) : if particles can still be added after the initial SPS mesh creation.
     * * particleIntersection (optional boolean, default false) : if the solid particle intersections must be computed.
     * * boundingSphereOnly (optional boolean, default false) : if the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster).
     * * bSphereRadiusFactor (optional float, default 1.0) : a number to multiply the boundind sphere radius by in order to reduce it for instance.
     * @example bSphereRadiusFactor = 1.0 / Math.sqrt(3.0) => the bounding sphere exactly matches a spherical mesh.
     */
    constructor(name: string, scene: Scene, options?: { updatable?: boolean; isPickable?: boolean; enableDepthSort?: boolean; particleIntersection?: boolean; boundingSphereOnly?: boolean; bSphereRadiusFactor?: number; expandable?: boolean; useModelMaterial?: boolean; enableMultiMaterial?: boolean; }) {

        this.name = name;
        this._scene = scene || EngineStore.LastCreatedScene;
        this._camera = <TargetCamera>scene.activeCamera;
        this._pickable = options ? <boolean>options.isPickable : false;
        this._depthSort = options ? <boolean>options.enableDepthSort : false;
        this._multimaterialEnabled = options ? <boolean>options.enableMultiMaterial : false;
        this._useModelMaterial = options ? <boolean>options.useModelMaterial : false;
        this._multimaterialEnabled = (this._useModelMaterial) ? true : this._multimaterialEnabled;
        this._expandable = options ? <boolean>options.expandable : false;
        this._particlesIntersect = options ? <boolean>options.particleIntersection : false;
        this._bSphereOnly = options ? <boolean>options.boundingSphereOnly : false;
        this._bSphereRadiusFactor = (options && options.bSphereRadiusFactor) ? options.bSphereRadiusFactor : 1.0;
        if (options && options.updatable !== undefined) {
            this._updatable = options.updatable;
        } else {
            this._updatable = true;
        }
        if (this._pickable) {
            this.pickedBySubMesh = [[]];
            this.pickedParticles = this.pickedBySubMesh[0];
        }
        if (this._depthSort || this._multimaterialEnabled) {
            this.depthSortedParticles = [];
        }
        if (this._multimaterialEnabled) {
            this._multimaterial = new MultiMaterial(this.name + "MultiMaterial", this._scene);
            this._materials = [];
            this._materialIndexesById = {};
        }
        this._tmpVertex = new SolidParticleVertex();
    }

    /**
     * Builds the SPS underlying mesh. Returns a standard Mesh.
     * If no model shape was added to the SPS, the returned mesh is just a single triangular plane.
     * @returns the created mesh
     */
    public buildMesh(): Mesh {
        if (!this._isNotBuilt && this.mesh) {
            return this.mesh;
        }
        if (this.nbParticles === 0 && !this.mesh) {
            var triangle = DiscBuilder.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
            this.addShape(triangle, 1);
            triangle.dispose();
        }
        this._indices32 = (this._needs32Bits) ? new Uint32Array(this._indices) : new Uint16Array(this._indices);
        this._positions32 = new Float32Array(this._positions);
        this._uvs32 = new Float32Array(this._uvs);
        this._colors32 = new Float32Array(this._colors);

        if (!this.mesh) {       // in case it's already expanded
            var mesh = new Mesh(this.name, this._scene);
            this.mesh = mesh;
        }
        if (!this._updatable && this._multimaterialEnabled) {
            this._sortParticlesByMaterial();    // this may reorder the indices32
        }
        if (this.recomputeNormals) {
            VertexData.ComputeNormals(this._positions32, this._indices32, this._normals);
        }

        this._normals32 = new Float32Array(this._normals);
        this._fixedNormal32 = new Float32Array(this._normals);
        if (this._mustUnrotateFixedNormals) {  // the particles could be created already rotated in the mesh with a positionFunction
            this._unrotateFixedNormals();
        }
        var vertexData = new VertexData();
        vertexData.indices = (this._depthSort) ? this._indices : this._indices32;
        vertexData.set(this._positions32, VertexBuffer.PositionKind);
        vertexData.set(this._normals32, VertexBuffer.NormalKind);

        if (this._uvs32.length > 0) {
            vertexData.set(this._uvs32, VertexBuffer.UVKind);
        }
        if (this._colors32.length > 0) {
            vertexData.set(this._colors32, VertexBuffer.ColorKind);
        }

        vertexData.applyToMesh(this.mesh, this._updatable);
        this.mesh.isPickable = this._pickable;

        if (this._pickable) {
            let faceId = 0;
            for (let p = 0; p < this.nbParticles; p++) {
                let part = this.particles[p];
                let lind = part._model._indicesLength;
                for (let i = 0; i < lind; i++) {
                    let f = i % 3;
                    if (f == 0) {
                        const pickedData = {idx: part.idx, faceId: faceId};
                        this.pickedParticles[faceId] = pickedData;
                        faceId++;
                    }
                }
            }
        }

        if (this._multimaterialEnabled) {
            this.setMultiMaterial(this._materials);
        }

        if (!this._expandable) {
            // free memory
            if (!this._depthSort && !this._multimaterialEnabled) {
                (<any>this._indices) = null;
            }
            (<any>this._positions) = null;
            (<any>this._normals) = null;
            (<any>this._uvs) = null;
            (<any>this._colors) = null;

            if (!this._updatable) {
                this.particles.length = 0;
            }
        }
        this._isNotBuilt = false;
        this.recomputeNormals = false;
        return this.mesh;
    }

    /**
     * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.
     * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
     * Thus the particles generated from `digest()` have their property `position` set yet.
     * @param mesh ( Mesh ) is the mesh to be digested
     * @param options {facetNb} (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
     * {delta} (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
     * {number} (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
     * {storage} (optional existing array) is an array where the particles will be stored for a further use instead of being inserted in the SPS.
     * @returns the current SPS
     */
    public digest(mesh: Mesh, options?: { facetNb?: number; number?: number; delta?: number; storage?: [] }): SolidParticleSystem {
        var size: number = (options && options.facetNb) || 1;
        var number: number = (options && options.number) || 0;
        var delta: number = (options && options.delta) || 0;
        var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
        var meshInd = <IndicesArray>mesh.getIndices();
        var meshUV = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind);
        var meshCol = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);
        var meshNor = <FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind);
        var storage = (options && options.storage) ? options.storage : null;

        var f: number = 0;                              // facet counter
        var totalFacets: number = meshInd.length / 3;   // a facet is a triangle, so 3 indices
        // compute size from number
        if (number) {
            number = (number > totalFacets) ? totalFacets : number;
            size = Math.round(totalFacets / number);
            delta = 0;
        } else {
            size = (size > totalFacets) ? totalFacets : size;
        }

        var facetPos: number[] = [];      // submesh positions
        var facetNor: number[] = [];
        var facetInd: number[] = [];      // submesh indices
        var facetUV: number[] = [];       // submesh UV
        var facetCol: number[] = [];      // submesh colors
        var barycenter: Vector3 = Vector3.Zero();
        var sizeO: number = size;

        while (f < totalFacets) {
            size = sizeO + Math.floor((1 + delta) * Math.random());
            if (f > totalFacets - size) {
                size = totalFacets - f;
            }
            // reset temp arrays
            facetPos.length = 0;
            facetNor.length = 0;
            facetInd.length = 0;
            facetUV.length = 0;
            facetCol.length = 0;

            // iterate over "size" facets
            var fi: number = 0;
            for (var j = f * 3; j < (f + size) * 3; j++) {
                facetInd.push(fi);
                var i: number = meshInd[j];
                var i3: number = i * 3;
                facetPos.push(meshPos[i3], meshPos[i3 + 1], meshPos[i3 + 2]);
                facetNor.push(meshNor[i3], meshNor[i3 + 1], meshNor[i3 + 2]);
                if (meshUV) {
                    var i2: number = i * 2;
                    facetUV.push(meshUV[i2], meshUV[i2 + 1]);
                }
                if (meshCol) {
                    var i4: number = i * 4;
                    facetCol.push(meshCol[i4], meshCol[i4 + 1], meshCol[i4 + 2], meshCol[i4 + 3]);
                }
                fi++;
            }

            // create a model shape for each single particle
            var idx: number = this.nbParticles;
            var shape: Vector3[] = this._posToShape(facetPos);
            var shapeUV: number[] = this._uvsToShapeUV(facetUV);
            var shapeInd = Array.from(facetInd);
            var shapeCol = Array.from(facetCol);
            var shapeNor = Array.from(facetNor);

            // compute the barycenter of the shape
            barycenter.copyFromFloats(0, 0, 0);
            var v: number;
            for (v = 0; v < shape.length; v++) {
                barycenter.addInPlace(shape[v]);
            }
            barycenter.scaleInPlace(1 / shape.length);

            // shift the shape from its barycenter to the origin
            // and compute the BBox required for intersection.
            var minimum: Vector3 = new Vector3(Infinity, Infinity, Infinity);
            var maximum: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity);
            for (v = 0; v < shape.length; v++) {
                shape[v].subtractInPlace(barycenter);
                minimum.minimizeInPlaceFromFloats(shape[v].x, shape[v].y, shape[v].z);
                maximum.maximizeInPlaceFromFloats(shape[v].x, shape[v].y, shape[v].z);
            }
            var bInfo;
            if (this._particlesIntersect) {
                bInfo = new BoundingInfo(minimum, maximum);
            }
            var material = null;
            if (this._useModelMaterial) {
                material = (mesh.material) ? mesh.material : this._setDefaultMaterial();
            }
            var modelShape = new ModelShape(this._shapeCounter, shape, shapeInd, shapeNor, shapeCol, shapeUV, null, null, material);

            // add the particle in the SPS
            var currentPos = this._positions.length;
            var currentInd = this._indices.length;
            this._meshBuilder(this._index, currentInd, shape, this._positions, shapeInd, this._indices, facetUV, this._uvs, shapeCol, this._colors, shapeNor, this._normals, idx, 0, null, modelShape);
            this._addParticle(idx, this._lastParticleId, currentPos, currentInd, modelShape, this._shapeCounter, 0, bInfo, storage);
            // initialize the particle position
            this.particles[this.nbParticles].position.addInPlace(barycenter);

            if (!storage) {
                this._index += shape.length;
                idx++;
                this.nbParticles++;
                this._lastParticleId++;
            }
            this._shapeCounter++;
            f += size;
        }
        this._isNotBuilt = true;        // buildMesh() is now expected for setParticles() to work
        return this;
    }

    /**
     * Unrotate the fixed normals in case the mesh was built with pre-rotated particles, ex : use of positionFunction in addShape()
     * @hidden
     */
    private _unrotateFixedNormals() {
        var index = 0;
        var idx = 0;
        const tmpNormal = TmpVectors.Vector3[0];
        const quaternion = TmpVectors.Quaternion[0];
        const invertedRotMatrix = TmpVectors.Matrix[0];
        for (var p = 0; p < this.particles.length; p++) {
            const particle = this.particles[p];
            const shape = particle._model._shape;

            // computing the inverse of the rotation matrix from the quaternion
            // is equivalent to computing the matrix of the inverse quaternion, i.e of the conjugate quaternion
            if (particle.rotationQuaternion) {
                particle.rotationQuaternion.conjugateToRef(quaternion);
            }
            else {
                const rotation = particle.rotation;
                Quaternion.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, quaternion);
                quaternion.conjugateInPlace();
            }
            quaternion.toRotationMatrix(invertedRotMatrix);

            for (var pt = 0; pt < shape.length; pt++) {
                idx = index + pt * 3;
                Vector3.TransformNormalFromFloatsToRef(this._normals32[idx], this._normals32[idx + 1], this._normals32[idx + 2], invertedRotMatrix, tmpNormal);
                tmpNormal.toArray(this._fixedNormal32, idx);
            }
            index = idx + 3;
        }
    }

    /**
     * Resets the temporary working copy particle
     * @hidden
     */
    private _resetCopy() {
        const copy = this._copy;
        copy.position.setAll(0);
        copy.rotation.setAll(0);
        copy.rotationQuaternion = null;
        copy.scaling.setAll(1);
        copy.uvs.copyFromFloats(0.0, 0.0, 1.0, 1.0);
        copy.color = null;
        copy.translateFromPivot = false;
        copy.shapeId = 0;
        copy.materialIndex = null;
    }

    /**
     * Inserts the shape model geometry in the global SPS mesh by updating the positions, indices, normals, colors, uvs arrays
     * @param p the current index in the positions array to be updated
     * @param ind the current index in the indices array
     * @param shape a Vector3 array, the shape geometry
     * @param positions the positions array to be updated
     * @param meshInd the shape indices array
     * @param indices the indices array to be updated
     * @param meshUV the shape uv array
     * @param uvs the uv array to be updated
     * @param meshCol the shape color array
     * @param colors the color array to be updated
     * @param meshNor the shape normals array
     * @param normals the normals array to be updated
     * @param idx the particle index
     * @param idxInShape the particle index in its shape
     * @param options the addShape() method  passed options
     * @model the particle model
     * @hidden
     */
    private _meshBuilder(p: number, ind: number, shape: Vector3[], positions: number[], meshInd: IndicesArray, indices: number[], meshUV: number[] | Float32Array, uvs: number[], meshCol: number[] | Float32Array, colors: number[], meshNor: number[] | Float32Array, normals: number[], idx: number, idxInShape: number, options: any, model: ModelShape): SolidParticle {
        var i;
        var u = 0;
        var c = 0;
        var n = 0;

        this._resetCopy();
        const copy = this._copy;
        const storeApart = (options && options.storage) ? true : false;
        copy.idx = idx;
        copy.idxInShape = idxInShape;
        copy.shapeId = model.shapeID;
        if (this._useModelMaterial) {
            var materialId = model._material!.uniqueId;
            const materialIndexesById = this._materialIndexesById;
            if (!materialIndexesById.hasOwnProperty(materialId)) {
                materialIndexesById[materialId] = this._materials.length;
                this._materials.push(model._material!);
            }
            var matIdx = materialIndexesById[materialId];
            copy.materialIndex = matIdx;
        }

        if (options && options.positionFunction) {        // call to custom positionFunction
            options.positionFunction(copy, idx, idxInShape);
            this._mustUnrotateFixedNormals = true;
        }

        // in case the particle geometry must NOT be inserted in the SPS mesh geometry
        if (storeApart) {
            return copy;
        }

        const rotMatrix = TmpVectors.Matrix[0];
        const tmpVertex = this._tmpVertex;
        const tmpVector = tmpVertex.position;
        const tmpColor = tmpVertex.color;
        const tmpUV = tmpVertex.uv;
        const tmpRotated = TmpVectors.Vector3[1];
        const pivotBackTranslation = TmpVectors.Vector3[2];
        const scaledPivot = TmpVectors.Vector3[3];
        Matrix.IdentityToRef(rotMatrix);
        copy.getRotationMatrix(rotMatrix);

        copy.pivot.multiplyToRef(copy.scaling, scaledPivot);

        if (copy.translateFromPivot) {
            pivotBackTranslation.setAll(0.0);
        }
        else {
            pivotBackTranslation.copyFrom(scaledPivot);
        }

        var someVertexFunction = (options && options.vertexFunction);
        for (i = 0; i < shape.length; i++) {
            tmpVector.copyFrom(shape[i]);
            if (copy.color) {
                tmpColor.copyFrom(copy.color);
            }
            if (meshUV) {
                tmpUV.copyFromFloats(meshUV[u], meshUV[u + 1]);
            }
            if (someVertexFunction) {
                options.vertexFunction(copy, tmpVertex, i);
            }

            tmpVector.multiplyInPlace(copy.scaling).subtractInPlace(scaledPivot);
            Vector3.TransformCoordinatesToRef(tmpVector, rotMatrix, tmpRotated);
            tmpRotated.addInPlace(pivotBackTranslation).addInPlace(copy.position);
            positions.push(tmpRotated.x, tmpRotated.y, tmpRotated.z);

            if (meshUV) {
                const copyUvs = copy.uvs;
                uvs.push((copyUvs.z - copyUvs.x) * tmpUV.x + copyUvs.x, (copyUvs.w - copyUvs.y) * tmpUV.y + copyUvs.y);
                u += 2;
            }

            if (copy.color) {
                this._color.copyFrom(tmpColor);
            } else {
                const color = this._color;
                if (meshCol && meshCol[c] !== undefined) {
                    color.r = meshCol[c];
                    color.g = meshCol[c + 1];
                    color.b = meshCol[c + 2];
                    color.a = meshCol[c + 3];
                } else {
                    color.r = 1.0;
                    color.g = 1.0;
                    color.b = 1.0;
                    color.a = 1.0;
                }
            }
            colors.push(this._color.r, this._color.g, this._color.b, this._color.a);
            c += 4;

            if (!this.recomputeNormals && meshNor) {
                Vector3.TransformNormalFromFloatsToRef(meshNor[n], meshNor[n + 1], meshNor[n + 2], rotMatrix, tmpVector);
                normals.push(tmpVector.x, tmpVector.y, tmpVector.z);
                n += 3;
            }
        }

        for (i = 0; i < meshInd.length; i++) {
            var current_ind = p + meshInd[i];
            indices.push(current_ind);
            if (current_ind > 65535) {
                this._needs32Bits = true;
            }
        }

        if (this._depthSort || this._multimaterialEnabled) {
            var matIndex = (copy.materialIndex !== null) ? copy.materialIndex : 0;
            this.depthSortedParticles.push(new DepthSortedParticle(idx, ind, meshInd.length, matIndex));
        }

        return copy;
    }

    /**
     * Returns a shape Vector3 array from positions float array
     * @param positions float array
     * @returns a vector3 array
     * @hidden
     */
    private _posToShape(positions: number[] | Float32Array): Vector3[] {
        var shape = [];
        for (var i = 0; i < positions.length; i += 3) {
            shape.push(Vector3.FromArray(positions, i));
        }
        return shape;
    }

    /**
     * Returns a shapeUV array from a float uvs (array deep copy)
     * @param uvs as a float array
     * @returns a shapeUV array
     * @hidden
     */
    private _uvsToShapeUV(uvs: number[] | Float32Array): number[] {
        var shapeUV = [];
        if (uvs) {
            for (var i = 0; i < uvs.length; i++) {
                shapeUV.push(uvs[i]);
            }
        }
        return shapeUV;
    }

    /**
     * Adds a new particle object in the particles array
     * @param idx particle index in particles array
     * @param id particle id
     * @param idxpos positionIndex : the starting index of the particle vertices in the SPS "positions" array
     * @param idxind indiceIndex : he starting index of the particle indices in the SPS "indices" array
     * @param model particle ModelShape object
     * @param shapeId model shape identifier
     * @param idxInShape index of the particle in the current model
     * @param bInfo model bounding info object
     * @param storage target storage array, if any
     * @hidden
     */
    private _addParticle(idx: number, id: number, idxpos: number, idxind: number, model: ModelShape, shapeId: number, idxInShape: number, bInfo: Nullable<BoundingInfo> = null, storage: Nullable<[]> = null): SolidParticle {
        var sp = new SolidParticle(idx, id, idxpos, idxind, model, shapeId, idxInShape, this, bInfo);
        var target = (storage) ? storage : this.particles;
        target.push(sp);
        return sp;
    }

    /**
     * Adds some particles to the SPS from the model shape. Returns the shape id.
     * Please read the doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#create-an-immutable-sps
     * @param mesh is any Mesh object that will be used as a model for the solid particles.
     * @param nb (positive integer) the number of particles to be created from this model
     * @param options {positionFunction} is an optional javascript function to called for each particle on SPS creation.
     * {vertexFunction} is an optional javascript function to called for each vertex of each particle on SPS creation
     * {storage} (optional existing array) is an array where the particles will be stored for a further use instead of being inserted in the SPS.
     * @returns the number of shapes in the system
     */
    public addShape(mesh: Mesh, nb: number, options?: { positionFunction?: any; vertexFunction?: any; storage?: [] }): number {
        var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
        var meshInd = <IndicesArray>mesh.getIndices();
        var meshUV = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind);
        var meshCol = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);
        var meshNor = <FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind);
        this.recomputeNormals = (meshNor) ? false : true;
        var indices = Array.from(meshInd);
        var shapeNormals = Array.from(meshNor);
        var shapeColors = (meshCol) ? Array.from(meshCol) : [];
        var storage = (options && options.storage) ? options.storage : null;
        var bbInfo: Nullable<BoundingInfo> = null;
        if (this._particlesIntersect) {
            bbInfo = mesh.getBoundingInfo();
        }

        var shape = this._posToShape(meshPos);
        var shapeUV = this._uvsToShapeUV(meshUV);

        var posfunc = options ? options.positionFunction : null;
        var vtxfunc = options ? options.vertexFunction : null;
        var material = null;
        if (this._useModelMaterial) {
            material = (mesh.material) ? mesh.material : this._setDefaultMaterial();
        }
        var modelShape = new ModelShape(this._shapeCounter, shape, indices, shapeNormals, shapeColors, shapeUV, posfunc, vtxfunc, material);

        // particles
        for (var i = 0; i < nb; i++) {
            this._insertNewParticle(this.nbParticles, i, modelShape, shape, meshInd, meshUV, meshCol, meshNor, bbInfo, storage, options);
        }
        this._shapeCounter++;
        this._isNotBuilt = true;        // buildMesh() call is now expected for setParticles() to work
        return this._shapeCounter - 1;
    }

    /**
     * Rebuilds a particle back to its just built status : if needed, recomputes the custom positions and vertices
     * @hidden
     */
    private _rebuildParticle(particle: SolidParticle, reset: boolean = false): void {
        this._resetCopy();
        const copy = this._copy;
        if (particle._model._positionFunction) {        // recall to stored custom positionFunction
            particle._model._positionFunction(copy, particle.idx, particle.idxInShape);
        }

        const rotMatrix = TmpVectors.Matrix[0];
        const tmpVertex = TmpVectors.Vector3[0];
        const tmpRotated = TmpVectors.Vector3[1];
        const pivotBackTranslation = TmpVectors.Vector3[2];
        const scaledPivot = TmpVectors.Vector3[3];

        copy.getRotationMatrix(rotMatrix);

        particle.pivot.multiplyToRef(particle.scaling, scaledPivot);

        if (copy.translateFromPivot) {
            pivotBackTranslation.copyFromFloats(0.0, 0.0, 0.0);
        }
        else {
            pivotBackTranslation.copyFrom(scaledPivot);
        }

        const shape = particle._model._shape;

        for (var pt = 0; pt < shape.length; pt++) {
            tmpVertex.copyFrom(shape[pt]);
            if (particle._model._vertexFunction) {
                particle._model._vertexFunction(copy, tmpVertex, pt); // recall to stored vertexFunction
            }

            tmpVertex.multiplyInPlace(copy.scaling).subtractInPlace(scaledPivot);
            Vector3.TransformCoordinatesToRef(tmpVertex, rotMatrix, tmpRotated);
            tmpRotated.addInPlace(pivotBackTranslation).addInPlace(copy.position).toArray(this._positions32, particle._pos + pt * 3);
        }
        if (reset) {
            particle.position.setAll(0.0);
            particle.rotation.setAll(0.0);
            particle.rotationQuaternion = null;
            particle.scaling.setAll(1.0);
            particle.uvs.setAll(0.0);
            particle.pivot.setAll(0.0);
            particle.translateFromPivot = false;
            particle.parentId = null;
        }
    }

    /**
     * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
     * @param reset boolean, default false : if the particles must be reset at position and rotation zero, scaling 1, color white, initial UVs and not parented.
     * @returns the SPS.
     */
    public rebuildMesh(reset: boolean = false): SolidParticleSystem {
        for (var p = 0; p < this.particles.length; p++) {
            this._rebuildParticle(this.particles[p], reset);
        }
        this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions32, false, false);
        return this;
    }

    /** Removes the particles from the start-th to the end-th included from an expandable SPS (required).
     *  Returns an array with the removed particles.
     *  If the number of particles to remove is lower than zero or greater than the global remaining particle number, then an empty array is returned.
     *  The SPS can't be empty so at least one particle needs to remain in place.
     *  Under the hood, the VertexData array, so the VBO buffer, is recreated each call.
     * @param start index of the first particle to remove
     * @param end index of the last particle to remove (included)
     * @returns an array populated with the removed particles
     */
    public removeParticles(start: number, end: number): SolidParticle[] {
        var nb = end - start + 1;
        if (!this._expandable || nb <= 0 || nb >= this.nbParticles || !this._updatable) {
            return [];
        }
        const particles = this.particles;
        const currentNb = this.nbParticles;
        if (end < currentNb - 1) {              // update the particle indexes in the positions array in case they're remaining particles after the last removed
            var firstRemaining = end + 1;
            var shiftPos = particles[firstRemaining]._pos - particles[start]._pos;
            var shifInd = particles[firstRemaining]._ind - particles[start]._ind;
            for (var i = firstRemaining; i < currentNb; i++) {
                var part = particles[i];
                part._pos -= shiftPos;
                part._ind -= shifInd;
            }
        }
        var removed = particles.splice(start, nb);
        this._positions.length = 0;
        this._indices.length = 0;
        this._colors.length = 0;
        this._uvs.length = 0;
        this._normals.length = 0;
        this._index = 0;
        this._idxOfId.length = 0;
        if (this._depthSort || this._multimaterialEnabled) {
            this.depthSortedParticles = [];
        }
        var ind = 0;
        const particlesLength = particles.length;
        for (var p = 0; p < particlesLength; p++) {
            var particle = particles[p];
            var model = particle._model;
            var shape = model._shape;
            var modelIndices = model._indices;
            var modelNormals = model._normals;
            var modelColors = model._shapeColors;
            var modelUVs = model._shapeUV;
            particle.idx = p;
            this._idxOfId[particle.id] = p;
            this._meshBuilder(this._index, ind, shape, this._positions, modelIndices, this._indices, modelUVs, this._uvs, modelColors, this._colors, modelNormals, this._normals, particle.idx, particle.idxInShape, null, model);
            this._index += shape.length;
            ind += modelIndices.length;
        }
        this.nbParticles -= nb;
        this._isNotBuilt = true;        // buildMesh() call is now expected for setParticles() to work
        return removed;
    }

    /**
     * Inserts some pre-created particles in the solid particle system so that they can be managed by setParticles().
     * @param solidParticleArray an array populated with Solid Particles objects
     * @returns the SPS
     */
    public insertParticlesFromArray(solidParticleArray: SolidParticle[]): SolidParticleSystem {
        if (!this._expandable) {
            return this;
        }
        var idxInShape = 0;
        var  currentShapeId = solidParticleArray[0].shapeId;
        const nb = solidParticleArray.length;
        for (var i = 0; i < nb; i++) {
            var sp = solidParticleArray[i];
            var model = sp._model;
            var shape = model._shape;
            var meshInd = model._indices;
            var meshUV = model._shapeUV;
            var meshCol = model._shapeColors;
            var meshNor = model._normals;
            var noNor = (meshNor) ? false : true;
            this.recomputeNormals = (noNor || this.recomputeNormals);
            var bbInfo = sp._boundingInfo;
            var newPart = this._insertNewParticle(this.nbParticles, idxInShape, model, shape, meshInd, meshUV, meshCol, meshNor, bbInfo, null, null);
            sp.copyToRef(newPart!);
            idxInShape++;
            if (currentShapeId != sp.shapeId) {
                currentShapeId = sp.shapeId;
                idxInShape = 0;
            }
        }
        this._isNotBuilt = true;        // buildMesh() call is now expected for setParticles() to work
        return this;
    }

    /**
     * Creates a new particle and modifies the SPS mesh geometry :
     * - calls _meshBuilder() to increase the SPS mesh geometry step by step
     * - calls _addParticle() to populate the particle array
     * factorized code from addShape() and insertParticlesFromArray()
     * @param idx particle index in the particles array
     * @param i particle index in its shape
     * @param modelShape particle ModelShape object
     * @param shape shape vertex array
     * @param meshInd shape indices array
     * @param meshUV shape uv array
     * @param meshCol shape color array
     * @param meshNor shape normals array
     * @param bbInfo shape bounding info
     * @param storage target particle storage
     * @options addShape() passed options
     * @hidden
     */
    private _insertNewParticle(idx: number, i: number, modelShape: ModelShape, shape: Vector3[], meshInd: IndicesArray, meshUV: number[] | Float32Array, meshCol: number[] | Float32Array, meshNor: number[] | Float32Array, bbInfo: Nullable<BoundingInfo>, storage: Nullable<[]> , options: any): Nullable<SolidParticle> {
        var currentPos = this._positions.length;
        var currentInd = this._indices.length;
        var currentCopy = this._meshBuilder(this._index, currentInd, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors, meshNor, this._normals, idx, i, options, modelShape);
        var sp: Nullable<SolidParticle> = null;
        if (this._updatable) {
            sp = this._addParticle(this.nbParticles, this._lastParticleId, currentPos, currentInd, modelShape, this._shapeCounter, i, bbInfo, storage);
            sp.position.copyFrom(currentCopy.position);
            sp.rotation.copyFrom(currentCopy.rotation);
            if (currentCopy.rotationQuaternion) {
                if (sp.rotationQuaternion) {
                    sp.rotationQuaternion.copyFrom(currentCopy.rotationQuaternion);
                }
                else {
                    sp.rotationQuaternion = currentCopy.rotationQuaternion.clone();
                }
            }
            if (currentCopy.color) {
                if (sp.color) {
                    sp.color.copyFrom(currentCopy.color);
                }
                else {
                    sp.color = currentCopy.color.clone();
                }
            }
            sp.scaling.copyFrom(currentCopy.scaling);
            sp.uvs.copyFrom(currentCopy.uvs);
            if (currentCopy.materialIndex !== null) {
                sp.materialIndex = currentCopy.materialIndex;
            }
            if (this.expandable) {
                this._idxOfId[sp.id] = sp.idx;
            }
        }
        if (!storage) {
            this._index += shape.length;
            this.nbParticles++;
            this._lastParticleId++;
        }
        return sp;
    }

    /**
     *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
     *  This method calls `updateParticle()` for each particle of the SPS.
     *  For an animated SPS, it is usually called within the render loop.
     * This methods does nothing if called on a non updatable or not yet built SPS. Example : buildMesh() not called after having added or removed particles from an expandable SPS.
     * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
     * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
     * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
     * @returns the SPS.
     */
    public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): SolidParticleSystem {
        if (!this._updatable || this._isNotBuilt) {
            return this;
        }

        // custom beforeUpdate
        this.beforeUpdateParticles(start, end, update);

        const rotMatrix = TmpVectors.Matrix[0];
        const invertedMatrix = TmpVectors.Matrix[1];
        const mesh = this.mesh;
        const colors32 = this._colors32;
        const positions32 = this._positions32;
        const normals32 = this._normals32;
        const uvs32 = this._uvs32;
        const indices32 = this._indices32;
        const indices = this._indices;
        const fixedNormal32 = this._fixedNormal32;

        const tempVectors = TmpVectors.Vector3;
        const camAxisX = tempVectors[5].copyFromFloats(1.0, 0.0, 0.0);
        const camAxisY = tempVectors[6].copyFromFloats(0.0, 1.0, 0.0);
        const camAxisZ = tempVectors[7].copyFromFloats(0.0, 0.0, 1.0);
        const minimum = tempVectors[8].setAll(Number.MAX_VALUE);
        const maximum = tempVectors[9].setAll(-Number.MAX_VALUE);
        const camInvertedPosition = tempVectors[10].setAll(0);

        const tmpVertex = this._tmpVertex;
        const tmpVector = tmpVertex.position;
        const tmpColor = tmpVertex.color;
        const tmpUV = tmpVertex.uv;

        // cases when the World Matrix is to be computed first
        if (this.billboard || this._depthSort) {
            this.mesh.computeWorldMatrix(true);
            this.mesh._worldMatrix.invertToRef(invertedMatrix);
        }
        // if the particles will always face the camera
        if (this.billboard) {
            // compute the camera position and un-rotate it by the current mesh rotation
            const tmpVector0 = tempVectors[0];
            this._camera.getDirectionToRef(Axis.Z, tmpVector0);
            Vector3.TransformNormalToRef(tmpVector0, invertedMatrix, camAxisZ);
            camAxisZ.normalize();
            // same for camera up vector extracted from the cam view matrix
            var view = this._camera.getViewMatrix(true);
            Vector3.TransformNormalFromFloatsToRef(view.m[1], view.m[5], view.m[9], invertedMatrix, camAxisY);
            Vector3.CrossToRef(camAxisY, camAxisZ, camAxisX);
            camAxisY.normalize();
            camAxisX.normalize();
        }

        // if depthSort, compute the camera global position in the mesh local system
        if (this._depthSort) {
            Vector3.TransformCoordinatesToRef(this._camera.globalPosition, invertedMatrix, camInvertedPosition); // then un-rotate the camera
        }

        Matrix.IdentityToRef(rotMatrix);
        var idx = 0;            // current position index in the global array positions32
        var index = 0;          // position start index in the global array positions32 of the current particle
        var colidx = 0;         // current color index in the global array colors32
        var colorIndex = 0;     // color start index in the global array colors32 of the current particle
        var uvidx = 0;          // current uv index in the global array uvs32
        var uvIndex = 0;        // uv start index in the global array uvs32 of the current particle
        var pt = 0;             // current index in the particle model shape

        if (this.mesh.isFacetDataEnabled) {
            this._computeBoundingBox = true;
        }

        end = (end >= this.nbParticles) ? this.nbParticles - 1 : end;
        if (this._computeBoundingBox) {
            if (start != 0 || end != this.nbParticles - 1) { // only some particles are updated, then use the current existing BBox basis. Note : it can only increase.
                const boundingInfo = this.mesh._boundingInfo;
                if (boundingInfo) {
                    minimum.copyFrom(boundingInfo.minimum);
                    maximum.copyFrom(boundingInfo.maximum);
                }
            }
        }

        // particle loop
        index = this.particles[start]._pos;
        const vpos = (index / 3) | 0;
        colorIndex = vpos * 4;
        uvIndex = vpos * 2;

        for (var p = start; p <= end; p++) {
            const particle = this.particles[p];

            // call to custom user function to update the particle properties
            this.updateParticle(particle);

            const shape = particle._model._shape;
            const shapeUV = particle._model._shapeUV;
            const particleRotationMatrix = particle._rotationMatrix;
            const particlePosition = particle.position;
            const particleRotation = particle.rotation;
            const particleScaling = particle.scaling;
            const particleGlobalPosition = particle._globalPosition;

            // camera-particle distance for depth sorting
            if (this._depthSort && this._depthSortParticles) {
                var dsp = this.depthSortedParticles[p];
                dsp.idx = particle.idx;
                dsp.ind = particle._ind;
                dsp.indicesLength = particle._model._indicesLength;
                dsp.sqDistance = Vector3.DistanceSquared(particle.position, camInvertedPosition);
            }

            // skip the computations for inactive or already invisible particles
            if (!particle.alive || (particle._stillInvisible && !particle.isVisible)) {
                // increment indexes for the next particle
                pt = shape.length;
                index += pt * 3;
                colorIndex += pt * 4;
                uvIndex += pt * 2;
                continue;
            }

            if (particle.isVisible) {
                particle._stillInvisible = false; // un-mark permanent invisibility

                const scaledPivot = tempVectors[12];
                particle.pivot.multiplyToRef(particleScaling, scaledPivot);

                // particle rotation matrix
                if (this.billboard) {
                    particleRotation.x = 0.0;
                    particleRotation.y = 0.0;
                }
                if (this._computeParticleRotation || this.billboard) {
                    particle.getRotationMatrix(rotMatrix);
                }

                const particleHasParent = (particle.parentId !== null);
                if (particleHasParent) {
                    const parent = this.getParticleById(particle.parentId!);
                    if (parent) {
                        const parentRotationMatrix = parent._rotationMatrix;
                        const parentGlobalPosition = parent._globalPosition;

                        const rotatedY = particlePosition.x * parentRotationMatrix[1] + particlePosition.y * parentRotationMatrix[4] + particlePosition.z * parentRotationMatrix[7];
                        const rotatedX = particlePosition.x * parentRotationMatrix[0] + particlePosition.y * parentRotationMatrix[3] + particlePosition.z * parentRotationMatrix[6];
                        const rotatedZ = particlePosition.x * parentRotationMatrix[2] + particlePosition.y * parentRotationMatrix[5] + particlePosition.z * parentRotationMatrix[8];

                        particleGlobalPosition.x = parentGlobalPosition.x + rotatedX;
                        particleGlobalPosition.y = parentGlobalPosition.y + rotatedY;
                        particleGlobalPosition.z = parentGlobalPosition.z + rotatedZ;

                        if (this._computeParticleRotation || this.billboard) {
                            const rotMatrixValues = rotMatrix.m;
                            particleRotationMatrix[0] = rotMatrixValues[0] * parentRotationMatrix[0] + rotMatrixValues[1] * parentRotationMatrix[3] + rotMatrixValues[2] * parentRotationMatrix[6];
                            particleRotationMatrix[1] = rotMatrixValues[0] * parentRotationMatrix[1] + rotMatrixValues[1] * parentRotationMatrix[4] + rotMatrixValues[2] * parentRotationMatrix[7];
                            particleRotationMatrix[2] = rotMatrixValues[0] * parentRotationMatrix[2] + rotMatrixValues[1] * parentRotationMatrix[5] + rotMatrixValues[2] * parentRotationMatrix[8];
                            particleRotationMatrix[3] = rotMatrixValues[4] * parentRotationMatrix[0] + rotMatrixValues[5] * parentRotationMatrix[3] + rotMatrixValues[6] * parentRotationMatrix[6];
                            particleRotationMatrix[4] = rotMatrixValues[4] * parentRotationMatrix[1] + rotMatrixValues[5] * parentRotationMatrix[4] + rotMatrixValues[6] * parentRotationMatrix[7];
                            particleRotationMatrix[5] = rotMatrixValues[4] * parentRotationMatrix[2] + rotMatrixValues[5] * parentRotationMatrix[5] + rotMatrixValues[6] * parentRotationMatrix[8];
                            particleRotationMatrix[6] = rotMatrixValues[8] * parentRotationMatrix[0] + rotMatrixValues[9] * parentRotationMatrix[3] + rotMatrixValues[10] * parentRotationMatrix[6];
                            particleRotationMatrix[7] = rotMatrixValues[8] * parentRotationMatrix[1] + rotMatrixValues[9] * parentRotationMatrix[4] + rotMatrixValues[10] * parentRotationMatrix[7];
                            particleRotationMatrix[8] = rotMatrixValues[8] * parentRotationMatrix[2] + rotMatrixValues[9] * parentRotationMatrix[5] + rotMatrixValues[10] * parentRotationMatrix[8];
                        }
                    }
                    else {      // in case the parent were removed at some moment
                        particle.parentId = null;
                    }
                }
                else {
                    particleGlobalPosition.x = particlePosition.x;
                    particleGlobalPosition.y = particlePosition.y;
                    particleGlobalPosition.z = particlePosition.z;

                    if (this._computeParticleRotation || this.billboard) {
                        const rotMatrixValues = rotMatrix.m;
                        particleRotationMatrix[0] = rotMatrixValues[0];
                        particleRotationMatrix[1] = rotMatrixValues[1];
                        particleRotationMatrix[2] = rotMatrixValues[2];
                        particleRotationMatrix[3] = rotMatrixValues[4];
                        particleRotationMatrix[4] = rotMatrixValues[5];
                        particleRotationMatrix[5] = rotMatrixValues[6];
                        particleRotationMatrix[6] = rotMatrixValues[8];
                        particleRotationMatrix[7] = rotMatrixValues[9];
                        particleRotationMatrix[8] = rotMatrixValues[10];
                    }
                }

                const pivotBackTranslation = tempVectors[11];
                if (particle.translateFromPivot) {
                    pivotBackTranslation.setAll(0.0);
                }
                else {
                    pivotBackTranslation.copyFrom(scaledPivot);
                }

                // particle vertex loop
                for (pt = 0; pt < shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;
                    const iu  = 2 * pt;
                    const iv = iu + 1;

                    tmpVector.copyFrom(shape[pt]);
                    if (this._computeParticleColor && particle.color) {
                        tmpColor.copyFrom(particle.color);
                    }
                    if (this._computeParticleTexture) {
                        tmpUV.copyFromFloats(shapeUV[iu], shapeUV[iv]);
                    }
                    if (this._computeParticleVertex) {
                        this.updateParticleVertex(particle, tmpVertex, pt);
                    }

                    // positions
                    const vertexX = tmpVector.x * particleScaling.x - scaledPivot.x;
                    const vertexY = tmpVector.y * particleScaling.y - scaledPivot.y;
                    const vertexZ = tmpVector.z * particleScaling.z - scaledPivot.z;

                    let rotatedX = vertexX * particleRotationMatrix[0] + vertexY * particleRotationMatrix[3] + vertexZ * particleRotationMatrix[6];
                    let rotatedY = vertexX * particleRotationMatrix[1] + vertexY * particleRotationMatrix[4] + vertexZ * particleRotationMatrix[7];
                    let rotatedZ = vertexX * particleRotationMatrix[2] + vertexY * particleRotationMatrix[5] + vertexZ * particleRotationMatrix[8];

                    rotatedX += pivotBackTranslation.x;
                    rotatedY += pivotBackTranslation.y;
                    rotatedZ += pivotBackTranslation.z;

                    const px = positions32[idx] = particleGlobalPosition.x + camAxisX.x * rotatedX + camAxisY.x * rotatedY + camAxisZ.x * rotatedZ;
                    const py = positions32[idx + 1] = particleGlobalPosition.y + camAxisX.y * rotatedX + camAxisY.y * rotatedY + camAxisZ.y * rotatedZ;
                    const pz = positions32[idx + 2] = particleGlobalPosition.z + camAxisX.z * rotatedX + camAxisY.z * rotatedY + camAxisZ.z * rotatedZ;

                    if (this._computeBoundingBox) {
                        minimum.minimizeInPlaceFromFloats(px, py, pz);
                        maximum.maximizeInPlaceFromFloats(px, py, pz);
                    }

                    // normals : if the particles can't be morphed then just rotate the normals, what is much more faster than ComputeNormals()
                    if (!this._computeParticleVertex) {
                        const normalx = fixedNormal32[idx];
                        const normaly = fixedNormal32[idx + 1];
                        const normalz = fixedNormal32[idx + 2];

                        const rotatedx = normalx * particleRotationMatrix[0] + normaly * particleRotationMatrix[3] + normalz * particleRotationMatrix[6];
                        const rotatedy = normalx * particleRotationMatrix[1] + normaly * particleRotationMatrix[4] + normalz * particleRotationMatrix[7];
                        const rotatedz = normalx * particleRotationMatrix[2] + normaly * particleRotationMatrix[5] + normalz * particleRotationMatrix[8];

                        normals32[idx] = camAxisX.x * rotatedx + camAxisY.x * rotatedy + camAxisZ.x * rotatedz;
                        normals32[idx + 1] = camAxisX.y * rotatedx + camAxisY.y * rotatedy + camAxisZ.y * rotatedz;
                        normals32[idx + 2] = camAxisX.z * rotatedx + camAxisY.z * rotatedy + camAxisZ.z * rotatedz;
                    }

                    if (this._computeParticleColor && particle.color) {
                        const colors32 = this._colors32;
                        colors32[colidx] = tmpColor.r;
                        colors32[colidx + 1] = tmpColor.g;
                        colors32[colidx + 2] = tmpColor.b;
                        colors32[colidx + 3] = tmpColor.a;
                    }

                    if (this._computeParticleTexture) {
                        const uvs = particle.uvs;
                        uvs32[uvidx] = tmpUV.x * (uvs.z - uvs.x) + uvs.x;
                        uvs32[uvidx + 1] = tmpUV.y * (uvs.w - uvs.y) + uvs.y;
                    }
                }
            }
            // particle just set invisible : scaled to zero and positioned at the origin
            else {
                particle._stillInvisible = true;      // mark the particle as invisible
                for (pt = 0; pt < shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;

                    positions32[idx] = positions32[idx + 1] = positions32[idx + 2] = 0;
                    normals32[idx] = normals32[idx + 1] = normals32[idx + 2] = 0;
                    if (this._computeParticleColor && particle.color) {
                        const color = particle.color;
                        colors32[colidx] = color.r;
                        colors32[colidx + 1] = color.g;
                        colors32[colidx + 2] = color.b;
                        colors32[colidx + 3] = color.a;
                    }
                    if (this._computeParticleTexture) {
                        const uvs = particle.uvs;
                        uvs32[uvidx] = shapeUV[pt * 2] * (uvs.z - uvs.x) + uvs.x;
                        uvs32[uvidx + 1] = shapeUV[pt * 2 + 1] * (uvs.w - uvs.y) + uvs.y;
                    }
                }
            }

            // if the particle intersections must be computed : update the bbInfo
            if (this._particlesIntersect) {
                const bInfo = particle._boundingInfo;
                const bBox = bInfo.boundingBox;
                const bSphere = bInfo.boundingSphere;
                const modelBoundingInfo = particle._modelBoundingInfo;
                if (!this._bSphereOnly) {
                    // place, scale and rotate the particle bbox within the SPS local system, then update it
                    const modelBoundingInfoVectors = modelBoundingInfo.boundingBox.vectors;

                    const tempMin = tempVectors[1];
                    const tempMax = tempVectors[2];
                    tempMin.setAll(Number.MAX_VALUE);
                    tempMax.setAll(-Number.MAX_VALUE);
                    for (var b = 0; b < 8; b++) {
                        const scaledX = modelBoundingInfoVectors[b].x * particleScaling.x;
                        const scaledY = modelBoundingInfoVectors[b].y * particleScaling.y;
                        const scaledZ = modelBoundingInfoVectors[b].z * particleScaling.z;
                        const rotatedX = scaledX * particleRotationMatrix[0] + scaledY * particleRotationMatrix[3] + scaledZ * particleRotationMatrix[6];
                        const rotatedY = scaledX * particleRotationMatrix[1] + scaledY * particleRotationMatrix[4] + scaledZ * particleRotationMatrix[7];
                        const rotatedZ = scaledX * particleRotationMatrix[2] + scaledY * particleRotationMatrix[5] + scaledZ * particleRotationMatrix[8];
                        const x = particlePosition.x + camAxisX.x * rotatedX + camAxisY.x * rotatedY + camAxisZ.x * rotatedZ;
                        const y = particlePosition.y + camAxisX.y * rotatedX + camAxisY.y * rotatedY + camAxisZ.y * rotatedZ;
                        const z = particlePosition.z + camAxisX.z * rotatedX + camAxisY.z * rotatedY + camAxisZ.z * rotatedZ;
                        tempMin.minimizeInPlaceFromFloats(x, y, z);
                        tempMax.maximizeInPlaceFromFloats(x, y, z);
                    }

                    bBox.reConstruct(tempMin, tempMax, mesh._worldMatrix);
                }

                // place and scale the particle bouding sphere in the SPS local system, then update it
                const minBbox = modelBoundingInfo.minimum.multiplyToRef(particleScaling, tempVectors[1]);
                const maxBbox = modelBoundingInfo.maximum.multiplyToRef(particleScaling, tempVectors[2]);

                const bSphereCenter = maxBbox.addToRef(minBbox, tempVectors[3]).scaleInPlace(0.5).addInPlace(particleGlobalPosition);
                const halfDiag = maxBbox.subtractToRef(minBbox, tempVectors[4]).scaleInPlace(0.5 * this._bSphereRadiusFactor);
                const bSphereMinBbox = bSphereCenter.subtractToRef(halfDiag, tempVectors[1]);
                const bSphereMaxBbox = bSphereCenter.addToRef(halfDiag, tempVectors[2]);
                bSphere.reConstruct(bSphereMinBbox, bSphereMaxBbox, mesh._worldMatrix);
            }

            // increment indexes for the next particle
            index = idx + 3;
            colorIndex = colidx + 4;
            uvIndex = uvidx + 2;
        }

        // if the VBO must be updated
        if (update) {
            if (this._computeParticleColor) {
                mesh.updateVerticesData(VertexBuffer.ColorKind, colors32, false, false);
            }
            if (this._computeParticleTexture) {
                mesh.updateVerticesData(VertexBuffer.UVKind, uvs32, false, false);
            }
            mesh.updateVerticesData(VertexBuffer.PositionKind, positions32, false, false);
            if (!mesh.areNormalsFrozen || mesh.isFacetDataEnabled) {
                if (this._computeParticleVertex || mesh.isFacetDataEnabled) {
                    // recompute the normals only if the particles can be morphed, update then also the normal reference array _fixedNormal32[]
                    var params = mesh.isFacetDataEnabled ? mesh.getFacetDataParameters() : null;
                    VertexData.ComputeNormals(positions32, indices32, normals32, params);
                    for (var i = 0; i < normals32.length; i++) {
                        fixedNormal32[i] = normals32[i];
                    }
                }
                if (!mesh.areNormalsFrozen) {
                    mesh.updateVerticesData(VertexBuffer.NormalKind, normals32, false, false);
                }
            }
            if (this._depthSort && this._depthSortParticles) {
                const depthSortedParticles = this.depthSortedParticles;
                depthSortedParticles.sort(this._depthSortFunction);
                const dspl = depthSortedParticles.length;
                let sid = 0;
                let faceId = 0;
                for (let sorted = 0; sorted < dspl; sorted++) {
                    const sortedParticle = depthSortedParticles[sorted];
                    const lind = sortedParticle.indicesLength;
                    const sind = sortedParticle.ind;
                    for (var i = 0; i < lind; i++) {
                        indices32[sid] = indices[sind + i];
                        sid++;
                        if (this._pickable) {
                            let f = i % 3;
                            if (f == 0) {
                                let pickedData = this.pickedParticles[faceId];
                                pickedData.idx = sortedParticle.idx;
                                pickedData.faceId = faceId;
                                faceId++;
                            }
                        }
                    }
                }
                mesh.updateIndices(indices32);
            }
        }
        if (this._computeBoundingBox) {
            if (mesh._boundingInfo) {
                mesh._boundingInfo.reConstruct(minimum, maximum, mesh._worldMatrix);
            }
            else {
                mesh._boundingInfo = new BoundingInfo(minimum, maximum, mesh._worldMatrix);
            }
        }
        if (this._autoUpdateSubMeshes) {
            this.computeSubMeshes();
        }
        this.afterUpdateParticles(start, end, update);
        return this;
    }

    /**
    * Disposes the SPS.
    */
    public dispose(): void {
        this.mesh.dispose();
        this.vars = null;
        // drop references to internal big arrays for the GC
        (<any>this._positions) = null;
        (<any>this._indices) = null;
        (<any>this._normals) = null;
        (<any>this._uvs) = null;
        (<any>this._colors) = null;
        (<any>this._indices32) = null;
        (<any>this._positions32) = null;
        (<any>this._normals32) = null;
        (<any>this._fixedNormal32) = null;
        (<any>this._uvs32) = null;
        (<any>this._colors32) = null;
        (<any>this.pickedParticles) = null;
        (<any>this.pickedBySubMesh) = null;
        (<any>this._materials) = null;
        (<any>this._materialIndexes) = null;
        (<any>this._indicesByMaterial) = null;
        (<any>this._idxOfId) = null;
    }
    /** Returns an object {idx: numbern faceId: number} for the picked particle from the passed pickingInfo object.
     * idx is the particle index in the SPS
     * faceId is the picked face index counted within this particle.
     * Returns null if the pickInfo can't identify a picked particle.
     * @param pickingInfo (PickingInfo object)
     * @returns {idx: number, faceId: number} or null
     */
    public pickedParticle(pickingInfo: PickingInfo): Nullable<{idx: number, faceId: number}> {
        if (pickingInfo.hit) {
            const subMesh = pickingInfo.subMeshId;
            const faceId = pickingInfo.faceId;
            const picked = this.pickedBySubMesh;
            if (picked[subMesh] && picked[subMesh][faceId]) {
                return picked[subMesh][faceId];
            }
        }
        return null;
    }

    /**
     * Returns a SolidParticle object from its identifier : particle.id
     * @param id (integer) the particle Id
     * @returns the searched particle or null if not found in the SPS.
     */
    public getParticleById(id: number): Nullable<SolidParticle> {
        const p = this.particles[id];
        if (p && p.id == id) {
            return p;
        }
        const particles = this.particles;
        const idx = this._idxOfId[id];
        if (idx !== undefined) {
            return particles[idx];
        }
        var i = 0;
        const nb = this.nbParticles;
        while (i < nb) {
            var particle = particles[i];
            if (particle.id == id) {
                return particle;
            }
            i++;
        }
        return null;
    }

    /**
     * Returns a new array populated with the particles having the passed shapeId.
     * @param shapeId (integer) the shape identifier
     * @returns a new solid particle array
     */
    public getParticlesByShapeId(shapeId: number): SolidParticle[] {
        var ref: SolidParticle[] = [];
        this.getParticlesByShapeIdToRef(shapeId, ref);
        return ref;
    }

    /**
     * Populates the passed array "ref" with the particles having the passed shapeId.
     * @param shapeId the shape identifier
     * @returns the SPS
     * @param ref
     */
    public getParticlesByShapeIdToRef(shapeId: number, ref: SolidParticle[]): SolidParticleSystem {
        ref.length = 0;
        for (var i = 0; i < this.nbParticles; i++) {
            var p = this.particles[i];
            if (p.shapeId == shapeId) {
                ref.push(p);
            }
        }
        return this;
    }
    /**
     * Computes the required SubMeshes according the materials assigned to the particles.
     * @returns the solid particle system.
     * Does nothing if called before the SPS mesh is built.
     */
    public computeSubMeshes(): SolidParticleSystem {
        if (!this.mesh || !this._multimaterialEnabled) {
            return this;
        }
        const depthSortedParticles = this.depthSortedParticles;
        if (this.particles.length > 0) {
            for (let p = 0; p < this.particles.length; p++) {
                let part = this.particles[p];
                if (!part.materialIndex) {
                    part.materialIndex = 0;
                }
                let sortedPart = depthSortedParticles[p];
                sortedPart.materialIndex = part.materialIndex;
                sortedPart.ind = part._ind;
                sortedPart.indicesLength = part._model._indicesLength;
                sortedPart.idx = part.idx;
            }
        }
        this._sortParticlesByMaterial();
        const indicesByMaterial = this._indicesByMaterial;
        const materialIndexes = this._materialIndexes;
        const mesh = this.mesh;
        mesh.subMeshes = [];
        const vcount = mesh.getTotalVertices();
        for (let m = 0; m < materialIndexes.length; m++) {
            let start = indicesByMaterial[m];
            let count = indicesByMaterial[m + 1] - start;
            let matIndex = materialIndexes[m];
            new SubMesh(matIndex, 0, vcount, start, count, mesh);
        }
        return this;
    }
    /**
     * Sorts the solid particles by material when MultiMaterial is enabled.
     * Updates the indices32 array.
     * Updates the indicesByMaterial array.
     * Updates the mesh indices array.
     * @returns the SPS
     * @hidden
     */
    private _sortParticlesByMaterial(): SolidParticleSystem {
        const indicesByMaterial = [0];
        this._indicesByMaterial = indicesByMaterial;
        const materialIndexes: number[] = [];
        this._materialIndexes = materialIndexes;
        const depthSortedParticles = this.depthSortedParticles;
        depthSortedParticles.sort(this._materialSortFunction);
        const length = depthSortedParticles.length;
        const indices32 = this._indices32;
        const indices = this._indices;

        let subMeshIndex = 0;
        let subMeshFaceId = 0;
        let sid = 0;
        let lastMatIndex = depthSortedParticles[0].materialIndex;
        materialIndexes.push(lastMatIndex);
        if (this._pickable) {
            this.pickedBySubMesh = [[]];
            this.pickedParticles = this.pickedBySubMesh[0];
        }
        for (let sorted = 0; sorted < length; sorted++) {
            let sortedPart = depthSortedParticles[sorted];
            let lind = sortedPart.indicesLength;
            let sind = sortedPart.ind;
            if (sortedPart.materialIndex !== lastMatIndex) {
                lastMatIndex = sortedPart.materialIndex;
                indicesByMaterial.push(sid);
                materialIndexes.push(lastMatIndex);
                if (this._pickable) {
                    subMeshIndex++;
                    this.pickedBySubMesh[subMeshIndex] = [];
                    subMeshFaceId = 0;
                }
            }
            let faceId = 0;
            for (let i = 0; i < lind; i++) {
                indices32[sid] = indices[sind + i];
                if (this._pickable) {
                    let f = i % 3;
                    if (f == 0) {
                        let pickedData = this.pickedBySubMesh[subMeshIndex][subMeshFaceId];
                        if (pickedData) {
                            pickedData.idx = sortedPart.idx;
                            pickedData.faceId = faceId;
                        }
                        else {
                            this.pickedBySubMesh[subMeshIndex][subMeshFaceId] = {idx: sortedPart.idx, faceId: faceId};
                        }
                        subMeshFaceId++;
                        faceId++;
                    }
                }
                sid++;
            }
        }

        indicesByMaterial.push(indices32.length);   // add the last number to ease the indices start/count values for subMeshes creation
        if (this._updatable) {
            this.mesh.updateIndices(indices32);
        }
        return this;
    }
    /**
     * Sets the material indexes by id materialIndexesById[id] = materialIndex
     * @hidden
     */
    private _setMaterialIndexesById() {
        this._materialIndexesById = {};
        for (var i = 0; i < this._materials.length; i++) {
            var id = this._materials[i].uniqueId;
            this._materialIndexesById[id] = i;
        }
    }
    /**
     * Returns an array with unique values of Materials from the passed array
     * @param array the material array to be checked and filtered
     * @hidden
     */
    private _filterUniqueMaterialId(array: Material[]): Material[] {
        var filtered = array.filter(function(value, index, self) {
            return self.indexOf(value) === index;
        });
        return filtered;
    }
    /**
     * Sets a new Standard Material as _defaultMaterial if not already set.
     * @hidden
     */
    private _setDefaultMaterial(): Material {
        if (!this._defaultMaterial) {
            this._defaultMaterial = new StandardMaterial(this.name + "DefaultMaterial", this._scene);
        }
        return this._defaultMaterial;
    }
    /**
     * Visibilty helper : Recomputes the visible size according to the mesh bounding box
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     * @returns the SPS.
     */
    public refreshVisibleSize(): SolidParticleSystem {
        if (!this._isVisibilityBoxLocked) {
            this.mesh.refreshBoundingInfo();
        }
        return this;
    }

    /**
     * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
     * @param size the size (float) of the visibility box
     * note : this doesn't lock the SPS mesh bounding box.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     */
    public setVisibilityBox(size: number): void {
        var vis = size / 2;
        this.mesh._boundingInfo = new BoundingInfo(new Vector3(-vis, -vis, -vis), new Vector3(vis, vis, vis));
    }

    /**
     * Gets whether the SPS as always visible or not
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     */
    public get isAlwaysVisible(): boolean {
        return this._alwaysVisible;
    }

    /**
     * Sets the SPS as always visible or not
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     */
    public set isAlwaysVisible(val: boolean) {
        this._alwaysVisible = val;
        this.mesh.alwaysSelectAsActiveMesh = val;
    }

    /**
     * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     */
    public set isVisibilityBoxLocked(val: boolean) {
        this._isVisibilityBoxLocked = val;

        let boundingInfo = this.mesh.getBoundingInfo();

        boundingInfo.isLocked = val;
    }

    /**
     * Gets if the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#sps-visibility
     */
    public get isVisibilityBoxLocked(): boolean {
        return this._isVisibilityBoxLocked;
    }

    /**
     * Tells to `setParticles()` to compute the particle rotations or not.
     * Default value : true. The SPS is faster when it's set to false.
     * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
     */
    public set computeParticleRotation(val: boolean) {
        this._computeParticleRotation = val;
    }

    /**
     * Tells to `setParticles()` to compute the particle colors or not.
     * Default value : true. The SPS is faster when it's set to false.
     * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
     */
    public set computeParticleColor(val: boolean) {
        this._computeParticleColor = val;
    }

    public set computeParticleTexture(val: boolean) {
        this._computeParticleTexture = val;
    }
    /**
     * Tells to `setParticles()` to call the vertex function for each vertex of each particle, or not.
     * Default value : false. The SPS is faster when it's set to false.
     * Note : the particle custom vertex positions aren't stored values.
     */
    public set computeParticleVertex(val: boolean) {
        this._computeParticleVertex = val;
    }
    /**
     * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
     */
    public set computeBoundingBox(val: boolean) {
        this._computeBoundingBox = val;
    }
    /**
     * Tells to `setParticles()` to sort or not the distance between each particle and the camera.
     * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
     * Default : `true`
     */
    public set depthSortParticles(val: boolean) {
        this._depthSortParticles = val;
    }

    /**
     * Gets if `setParticles()` computes the particle rotations or not.
     * Default value : true. The SPS is faster when it's set to false.
     * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
     */
    public get computeParticleRotation(): boolean {
        return this._computeParticleRotation;
    }

    /**
     * Gets if `setParticles()` computes the particle colors or not.
     * Default value : true. The SPS is faster when it's set to false.
     * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
     */
    public get computeParticleColor(): boolean {
        return this._computeParticleColor;
    }

    /**
     * Gets if `setParticles()` computes the particle textures or not.
     * Default value : true. The SPS is faster when it's set to false.
     * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
     */
    public get computeParticleTexture(): boolean {
        return this._computeParticleTexture;
    }

    /**
     * Gets if `setParticles()` calls the vertex function for each vertex of each particle, or not.
     * Default value : false. The SPS is faster when it's set to false.
     * Note : the particle custom vertex positions aren't stored values.
     */
    public get computeParticleVertex(): boolean {
        return this._computeParticleVertex;
    }

    /**
     * Gets if `setParticles()` computes or not the mesh bounding box when computing the particle positions.
     */
    public get computeBoundingBox(): boolean {
        return this._computeBoundingBox;
    }

    /**
     * Gets if `setParticles()` sorts or not the distance between each particle and the camera.
     * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
     * Default : `true`
     */
    public get depthSortParticles(): boolean {
        return this._depthSortParticles;
    }

    /**
     * Gets if the SPS is created as expandable at construction time.
     * Default : `false`
     */
    public get expandable(): boolean {
        return this._expandable;
    }
    /**
     * Gets if the SPS supports the Multi Materials
     */
    public get multimaterialEnabled(): boolean {
        return this._multimaterialEnabled;
    }
    /**
     * Gets if the SPS uses the model materials for its own multimaterial.
     */
    public get useModelMaterial(): boolean {
        return this._useModelMaterial;
    }
    /**
     * The SPS used material array.
    */
    public get materials(): Material[] {
        return this._materials;
    }
    /**
     * Sets the SPS MultiMaterial from the passed materials.
     * Note : the passed array is internally copied and not used then by reference.
     * @param materials an array of material objects. This array indexes are the materialIndex values of the particles.
     */
    public setMultiMaterial(materials: Material[]) {
        this._materials = this._filterUniqueMaterialId(materials);
        this._setMaterialIndexesById();
        if (this._multimaterial) {
            this._multimaterial.dispose();
        }
        this._multimaterial = new MultiMaterial(this.name + "MultiMaterial", this._scene);
        for (var m = 0; m < this._materials.length; m++) {
            this._multimaterial.subMaterials.push(this._materials[m]);
        }
        this.computeSubMeshes();
        this.mesh.material = this._multimaterial;
    }
    /**
     * The SPS computed multimaterial object
     */
    public get multimaterial(): MultiMaterial {
        return this._multimaterial;
    }
    public set multimaterial(mm) {
        this._multimaterial = mm;
    }
    /**
     * If the subMeshes must be updated on the next call to setParticles()
     */
    public get autoUpdateSubMeshes(): boolean {
        return this._autoUpdateSubMeshes;
    }
    public set autoUpdateSubMeshes(val: boolean) {
        this._autoUpdateSubMeshes = val;
    }
    // =======================================================================
    // Particle behavior logic
    // these following methods may be overwritten by the user to fit his needs

    /**
     * This function does nothing. It may be overwritten to set all the particle first values.
     * The SPS doesn't call this function, you may have to call it by your own.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#particle-management
     */
    public initParticles(): void {
    }

    /**
     * This function does nothing. It may be overwritten to recycle a particle.
     * The SPS doesn't call this function, you may have to call it by your own.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#particle-management
     * @param particle The particle to recycle
     * @returns the recycled particle
     */
    public recycleParticle(particle: SolidParticle): SolidParticle {
        return particle;
    }

    /**
     * Updates a particle : this function should  be overwritten by the user.
     * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#particle-management
     * @example : just set a particle position or velocity and recycle conditions
     * @param particle The particle to update
     * @returns the updated particle
     */
    public updateParticle(particle: SolidParticle): SolidParticle {
        return particle;
    }

    /**
     * Updates a vertex of a particle : it can be overwritten by the user.
     * This will be called on each vertex particle by `setParticles()` if `computeParticleVertex` is set to true only.
     * @param particle the current particle
     * @param vertex the current vertex of the current particle : a SolidParticleVertex object
     * @param pt the index of the current vertex in the particle shape
     * doc : http://doc.babylonjs.com/how_to/Solid_Particle_System#update-each-particle-shape
     * @example : just set a vertex particle position or color
     * @returns the sps
     */
    public updateParticleVertex(particle: SolidParticle, vertex: SolidParticleVertex, pt: number): SolidParticleSystem {
        return this;
    }

    /**
     * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
     * This does nothing and may be overwritten by the user.
     * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param update the boolean update value actually passed to setParticles()
     */
    public beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void {
    }
    /**
     * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
     * This will be passed three parameters.
     * This does nothing and may be overwritten by the user.
     * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param update the boolean update value actually passed to setParticles()
     */
    public afterUpdateParticles(start?: number, stop?: number, update?: boolean): void {
    }
}
