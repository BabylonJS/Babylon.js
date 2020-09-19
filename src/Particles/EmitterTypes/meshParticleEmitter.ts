import { DeepCopier } from "../../Misc/deepCopier";
import { Vector3, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Effect } from "../../Materials/effect";
import { Particle } from "../../Particles/particle";
import { IParticleEmitterType } from "./IParticleEmitterType";
import { IndicesArray, Nullable, FloatArray } from '../../types';
import { VertexBuffer } from '../../Meshes/buffer';
import { Scene } from '../../scene';
import { AbstractMesh } from '../../Meshes/abstractMesh';
/**
 * Particle emitter emitting particles from the inside of a box.
 * It emits the particles randomly between 2 given directions.
 */
export class MeshParticleEmitter implements IParticleEmitterType {
    private _indices: Nullable<IndicesArray> = null;
    private _positions: Nullable<FloatArray> = null;
    private _normals: Nullable<FloatArray> = null;
    private _storedNormal = Vector3.Zero();
    private _mesh: Nullable<AbstractMesh> = null;

    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     */
    public direction1 = new Vector3(0, 1.0, 0);
    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     */
    public direction2 = new Vector3(0, 1.0, 0);

    /**
     * Gets or sets a boolean indicating that particle directions must be built from mesh face normals
     */
    public useMeshNormalsForDirection = true;

    /** Defines the mesh to use as source */
    public get mesh(): Nullable<AbstractMesh> {
        return this._mesh;
    }

    public set mesh(value: Nullable<AbstractMesh>) {
        if (this._mesh === value) {
            return;
        }

        this._mesh = value;

        if (value) {
            this._indices = value.getIndices();
            this._positions = value.getVerticesData(VertexBuffer.PositionKind);
            this._normals = value.getVerticesData(VertexBuffer.NormalKind);
        } else {
            this._indices = null;
            this._positions = null;
            this._normals = null;
        }
    }

    /**
     * Creates a new instance MeshParticleEmitter
     * @param mesh defines the mesh to use as source
     */
    constructor(mesh: Nullable<AbstractMesh> = null) {
        this.mesh = mesh;
    }

    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        if (this.useMeshNormalsForDirection && this._normals) {
            Vector3.TransformNormalToRef(this._storedNormal, worldMatrix, directionToUpdate);
            return;
        }

        var randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
        var randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
        var randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);

        if (isLocal) {
            directionToUpdate.copyFromFloats(randX, randY, randZ);
            return;
        }

        Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, worldMatrix, directionToUpdate);
    }

    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean): void {
        if (!this._indices || !this._positions) {
            return;
        }

        let randomFaceIndex = 3 * Math.random() * (this._indices.length / 3) | 0;
        let bu = Math.random();
        let bv = Math.random() * (1.0 - bu);
        let bw = 1.0 - bu - bv;

        let faceIndexA = this._indices[randomFaceIndex];
        let faceIndexB = this._indices[randomFaceIndex + 1];
        let faceIndexC = this._indices[randomFaceIndex + 2];
        let vertexA = TmpVectors.Vector3[0];
        let vertexB = TmpVectors.Vector3[1];
        let vertexC = TmpVectors.Vector3[2];
        let randomVertex = TmpVectors.Vector3[3];

        Vector3.FromArrayToRef(this._positions, faceIndexA * 3, vertexA);
        Vector3.FromArrayToRef(this._positions, faceIndexB * 3, vertexB);
        Vector3.FromArrayToRef(this._positions, faceIndexC * 3, vertexC);

        randomVertex.x = bu * vertexA.x + bv * vertexB.x + bw * vertexC.x;
        randomVertex.y = bu * vertexA.y + bv * vertexB.y + bw * vertexC.y;
        randomVertex.z = bu * vertexA.z + bv * vertexB.z + bw * vertexC.z;

        if (isLocal) {
            positionToUpdate.copyFromFloats(randomVertex.x, randomVertex.y, randomVertex.z);
        } else {
            Vector3.TransformCoordinatesFromFloatsToRef(randomVertex.x, randomVertex.y, randomVertex.z, worldMatrix, positionToUpdate);
        }

        if (this.useMeshNormalsForDirection && this._normals) {
            Vector3.FromArrayToRef(this._normals, faceIndexA * 3, vertexA);
            Vector3.FromArrayToRef(this._normals, faceIndexB * 3, vertexB);
            Vector3.FromArrayToRef(this._normals, faceIndexC * 3, vertexC);

            this._storedNormal.x = bu * vertexA.x + bv * vertexB.x + bw * vertexC.x;
            this._storedNormal.y = bu * vertexA.y + bv * vertexB.y + bw * vertexC.y;
            this._storedNormal.z = bu * vertexA.z + bv * vertexB.z + bw * vertexC.z;
        }
    }

    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    public clone(): MeshParticleEmitter {
        let newOne = new MeshParticleEmitter(this.mesh);

        DeepCopier.DeepCopy(this, newOne);

        return newOne;
    }

    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param effect defines the update shader
     */
    public applyToShader(effect: Effect): void {
        effect.setVector3("direction1", this.direction1);
        effect.setVector3("direction2", this.direction2);
    }

    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containng the defines string
     */
    public getEffectDefines(): string {
        return "";
    }

    /**
     * Returns the string "BoxParticleEmitter"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "MeshParticleEmitter";
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.type = this.getClassName();
        serializationObject.direction1 = this.direction1.asArray();
        serializationObject.direction2 = this.direction2.asArray();
        serializationObject.meshId = this.mesh?.id;
        serializationObject.useMeshNormalsForDirection = this.useMeshNormalsForDirection;

        return serializationObject;
    }

    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     * @param scene defines the hosting scene
     */
    public parse(serializationObject: any, scene: Nullable<Scene>): void {
        Vector3.FromArrayToRef(serializationObject.direction1, 0, this.direction1);
        Vector3.FromArrayToRef(serializationObject.direction2, 0, this.direction2);

        if (serializationObject.meshId && scene) {
            this.mesh = scene.getLastMeshByID(serializationObject.meshId);
        }

        this.useMeshNormalsForDirection = serializationObject.useMeshNormalsForDirection;
    }
}
