import { RegisterClass } from "../../../../Misc/typeStore";
import type { Mesh } from "../../../../Meshes/mesh";
import { VertexData } from "../../../../Meshes/mesh.vertexData";
import type { FloatArray, IndicesArray, Nullable } from "../../../../types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { Particle } from "core/Particles/particle";
import { TmpVectors, Vector3, Vector4 } from "core/Maths/math.vector";
import { RandomRange } from "core/Maths/math.scalar.functions";
import type { IShapeBlock } from "./IShapeBlock";

/**
 * Defines a block used to generate particle shape from mesh geometry data
 */
export class MeshShapeBlock extends NodeParticleBlock implements IShapeBlock {
    private _mesh: Nullable<Mesh>;
    private _cachedVertexData: Nullable<VertexData> = null;
    private _indices: Nullable<IndicesArray> = null;
    private _positions: Nullable<FloatArray> = null;
    private _normals: Nullable<FloatArray> = null;
    private _colors: Nullable<FloatArray> = null;
    private _storedNormal = Vector3.Zero();

    /**
     * Gets or sets a boolean indicating that this block should serialize its cached data
     */
    @editableInPropertyPage("Serialize cached data", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public serializedCachedData = false;

    /**
     * Gets or sets a boolean indicating if the mesh normals should be used for particle direction
     */
    @editableInPropertyPage("Use normals for direction", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public useMeshNormalsForDirection = false;

    /**
     * Gets or sets a boolean indicating if the mesh colors should be used for particle color
     */
    @editableInPropertyPage("Use vertex color for color", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public useMeshColorForColor = false;

    /**
     * Gets or sets a boolean indicating if the coordinates should be in world space (local space by default)
     */
    @editableInPropertyPage("World space", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public worldSpace = false;

    /**
     * Gets or sets the mesh to use to get vertex data
     */
    public get mesh() {
        return this._mesh;
    }

    public set mesh(value: Nullable<Mesh>) {
        this._mesh = value;
    }

    /**
     * Create a new MeshShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "MeshShapeBlock";
    }

    /**
     * Gets a boolean indicating if the block is using cached data
     */
    public get isUsingCachedData() {
        return !this.mesh && !!this._cachedVertexData;
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Remove stored data
     */
    public cleanData() {
        this._mesh = null;
        this._cachedVertexData = null;
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state);

        if (!this._mesh && !this._cachedVertexData) {
            this.output._storedValue = system;
            return;
        }

        if (this._mesh) {
            this._cachedVertexData = VertexData.ExtractFromMesh(this._mesh, false, true);
        }

        if (!this._cachedVertexData) {
            this.output._storedValue = system;
            return;
        }

        this._indices = this._cachedVertexData.indices;
        this._positions = this._cachedVertexData.positions;
        this._normals = this._cachedVertexData.normals;
        this._colors = this._cachedVertexData.colors;

        if (this.useMeshColorForColor && this._colors) {
            system._colorCreation.process = () => {};
        }

        system._directionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            if (this.useMeshNormalsForDirection && this._normals) {
                if (state.isEmitterTransformNode) {
                    Vector3.TransformNormalToRef(this._storedNormal, state.emitterWorldMatrix!, particle.direction);
                } else {
                    particle.direction.copyFrom(this._storedNormal);
                }
                return;
            }

            const direction1 = this.direction1.getConnectedValue(state) as Vector3;
            const direction2 = this.direction2.getConnectedValue(state) as Vector3;

            const randX = RandomRange(direction1.x, direction2.x);
            const randY = RandomRange(direction1.y, direction2.y);
            const randZ = RandomRange(direction1.z, direction2.z);

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFromFloats(randX, randY, randZ);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            if (!this._indices || !this._positions) {
                return;
            }

            const randomFaceIndex = 3 * ((Math.random() * (this._indices.length / 3)) | 0);
            const bu = Math.random();
            const bv = Math.random() * (1.0 - bu);
            const bw = 1.0 - bu - bv;

            const faceIndexA = this._indices[randomFaceIndex];
            const faceIndexB = this._indices[randomFaceIndex + 1];
            const faceIndexC = this._indices[randomFaceIndex + 2];
            const vertexA = TmpVectors.Vector3[0];
            const vertexB = TmpVectors.Vector3[1];
            const vertexC = TmpVectors.Vector3[2];
            const randomVertex = TmpVectors.Vector3[3];

            Vector3.FromArrayToRef(this._positions, faceIndexA * 3, vertexA);
            Vector3.FromArrayToRef(this._positions, faceIndexB * 3, vertexB);
            Vector3.FromArrayToRef(this._positions, faceIndexC * 3, vertexC);

            randomVertex.x = bu * vertexA.x + bv * vertexB.x + bw * vertexC.x;
            randomVertex.y = bu * vertexA.y + bv * vertexB.y + bw * vertexC.y;
            randomVertex.z = bu * vertexA.z + bv * vertexB.z + bw * vertexC.z;

            if (this.worldSpace && this.mesh) {
                Vector3.TransformCoordinatesFromFloatsToRef(randomVertex.x, randomVertex.y, randomVertex.z, this.mesh.getWorldMatrix(), randomVertex);
            }

            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesFromFloatsToRef(randomVertex.x, randomVertex.y, randomVertex.z, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFromFloats(randomVertex.x, randomVertex.y, randomVertex.z);
            }

            if (this.useMeshNormalsForDirection && this._normals) {
                Vector3.FromArrayToRef(this._normals, faceIndexA * 3, vertexA);
                Vector3.FromArrayToRef(this._normals, faceIndexB * 3, vertexB);
                Vector3.FromArrayToRef(this._normals, faceIndexC * 3, vertexC);

                this._storedNormal.x = bu * vertexA.x + bv * vertexB.x + bw * vertexC.x;
                this._storedNormal.y = bu * vertexA.y + bv * vertexB.y + bw * vertexC.y;
                this._storedNormal.z = bu * vertexA.z + bv * vertexB.z + bw * vertexC.z;
            }

            if (this.useMeshColorForColor && this._colors) {
                Vector4.FromArrayToRef(this._colors, faceIndexA * 4, TmpVectors.Vector4[0]);
                Vector4.FromArrayToRef(this._colors, faceIndexB * 4, TmpVectors.Vector4[1]);
                Vector4.FromArrayToRef(this._colors, faceIndexC * 4, TmpVectors.Vector4[2]);

                particle.color.copyFromFloats(
                    bu * TmpVectors.Vector4[0].x + bv * TmpVectors.Vector4[1].x + bw * TmpVectors.Vector4[2].x,
                    bu * TmpVectors.Vector4[0].y + bv * TmpVectors.Vector4[1].y + bw * TmpVectors.Vector4[2].y,
                    bu * TmpVectors.Vector4[0].z + bv * TmpVectors.Vector4[1].z + bw * TmpVectors.Vector4[2].z,
                    bu * TmpVectors.Vector4[0].w + bv * TmpVectors.Vector4[1].w + bw * TmpVectors.Vector4[2].w
                );

                particle.initialColor.copyFrom(particle.color);
                system.colorDead.subtractToRef(particle.initialColor, system._colorDiff);
                system._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
            }
        };

        this.output._storedValue = system;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.serializedCachedData = this.serializedCachedData;

        if (this.serializedCachedData) {
            if (this._mesh) {
                serializationObject.cachedVertexData = VertexData.ExtractFromMesh(this._mesh, false, true).serialize();
            } else if (this._cachedVertexData) {
                serializationObject.cachedVertexData = this._cachedVertexData.serialize();
            }
        }

        serializationObject.useMeshNormalsForDirection = this.useMeshNormalsForDirection;
        serializationObject.useMeshColorForColor = this.useMeshColorForColor;
        serializationObject.worldSpace = this.worldSpace;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.cachedVertexData) {
            this._cachedVertexData = VertexData.Parse(serializationObject.cachedVertexData);
        }

        this.serializedCachedData = !!serializationObject.serializedCachedData;
        this.useMeshNormalsForDirection = !!serializationObject.useMeshNormalsForDirection;
        this.useMeshColorForColor = !!serializationObject.useMeshColorForColor;
        this.worldSpace = !!serializationObject.worldSpace;
    }
}

RegisterClass("BABYLON.MeshShapeBlock", MeshShapeBlock);
