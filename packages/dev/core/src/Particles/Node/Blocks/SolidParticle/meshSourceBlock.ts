/* eslint-disable @typescript-eslint/naming-convention */

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { ISolidParticleMeshSourceData } from "./ISolidParticleData";

/**
 * Block used to provide mesh source for SPS
 */
export class MeshSourceBlock extends NodeParticleBlock {
    private _customVertexData: Nullable<VertexData> = null;
    private _customMeshName = "";

    /** Gets an observable raised when the block data changes */
    public onValueChangedObservable = new Observable<MeshSourceBlock>();

    public constructor(name: string) {
        super(name);

        this.registerOutput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
    }

    public override getClassName() {
        return "MeshSourceBlock";
    }

    public get mesh(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets whether a custom mesh is currently assigned
     */
    public get hasCustomMesh(): boolean {
        return !!this._customVertexData;
    }

    /**
     * Gets the friendly name of the assigned custom mesh
     */
    public get customMeshName(): string {
        return this._customMeshName;
    }

    /**
     * Assigns a mesh as custom geometry source
     * @param mesh mesh providing geometry
     */
    public setCustomMesh(mesh: Nullable<Mesh>) {
        if (!mesh) {
            this.clearCustomMesh();
            return;
        }

        this._customVertexData = VertexData.ExtractFromMesh(mesh, true, true);
        this._customMeshName = mesh.name || "";
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Assigns vertex data directly
     * @param vertexData vertex data
     * @param name friendly name
     */
    public setCustomVertexData(vertexData: VertexData, name = "") {
        this._customVertexData = vertexData;
        this._customMeshName = name;
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Clears any assigned custom mesh data
     */
    public clearCustomMesh() {
        this._customVertexData = null;
        this._customMeshName = "";
        this.onValueChangedObservable.notifyObservers(this);
    }

    public override _build(state: NodeParticleBuildState) {
        if (!this._customVertexData) {
            this.mesh._storedValue = null;
            return;
        }

        const meshData: ISolidParticleMeshSourceData = {
            vertexData: this._customVertexData,
            customMeshName: this._customMeshName,
        };

        this.mesh._storedValue = meshData;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customMeshName = this._customMeshName;
        if (this._customVertexData) {
            serializationObject.customVertexData = this._customVertexData.serialize();
        }
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        if (serializationObject.customVertexData) {
            this._customVertexData = VertexData.Parse(serializationObject.customVertexData);
            this._customMeshName = serializationObject.customMeshName || "";
        }
    }
}

RegisterClass("BABYLON.MeshSourceBlock", MeshSourceBlock);
