/* eslint-disable @typescript-eslint/naming-convention */

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { Tools } from "core/Misc/tools";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import type { ISpsMeshSourceData } from "./ISPSData";

/**
 * Block used to provide mesh source for SPS
 */
export class SPSMeshSourceBlock extends NodeParticleBlock {
    private _customVertexData: Nullable<VertexData> = null;
    private _customMeshName = "";
    private _isRemoteMeshLoading = false;

    /** Gets an observable raised when the block data changes */
    public onValueChangedObservable = new Observable<SPSMeshSourceBlock>();

    /** Optional remote mesh URL used to auto load geometry */
    public remoteMeshUrl = "";
    /** Optional mesh name filter when loading remote geometry */
    public remoteMeshName = "";

    public constructor(name: string) {
        super(name);

        this.registerOutput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
    }

    public override getClassName() {
        return "SPSMeshSourceBlock";
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
        this.remoteMeshUrl = "";
        this.remoteMeshName = "";
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
        this.remoteMeshUrl = "";
        this.remoteMeshName = "";
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Clears any assigned custom mesh data
     */
    public clearCustomMesh() {
        this._customVertexData = null;
        this._customMeshName = "";
        this.remoteMeshUrl = "";
        this.remoteMeshName = "";
        this.onValueChangedObservable.notifyObservers(this);
    }

    private _tryLoadRemoteMesh(state: NodeParticleBuildState) {
        if (this._customVertexData || !this.remoteMeshUrl || this._isRemoteMeshLoading) {
            return;
        }

        this._isRemoteMeshLoading = true;
        const fileName = Tools.GetFilename(this.remoteMeshUrl);
        const rootUrl = this.remoteMeshUrl.substring(0, this.remoteMeshUrl.length - fileName.length);

        ImportMeshAsync(fileName, state.scene, { meshNames: "", rootUrl })
            .then((result) => {
                let mesh = result.meshes.find((m) => (this.remoteMeshName ? m.name === this.remoteMeshName : !!m && m.name !== "__root__"));
                if (!mesh && result.meshes.length) {
                    mesh = result.meshes[0];
                }

                if (mesh) {
                    this.setCustomMesh(mesh as Mesh);
                    this.onValueChangedObservable.notifyObservers(this);
                }

                for (const loadedMesh of result.meshes) {
                    loadedMesh.dispose();
                }
                for (const skeleton of result.skeletons) {
                    skeleton.dispose();
                }
                for (const animationGroup of result.animationGroups) {
                    animationGroup.dispose();
                }
                for (const particleSystem of result.particleSystems) {
                    particleSystem.dispose();
                }
            })
            .catch(() => {
                // Ignore load errors
            })
            .finally(() => {
                this._isRemoteMeshLoading = false;
            });
    }

    public override _build(state: NodeParticleBuildState) {
        this._tryLoadRemoteMesh(state);

        if (!this._customVertexData) {
            this.mesh._storedValue = null;
            return;
        }

        const meshData: ISpsMeshSourceData = {
            vertexData: this._customVertexData,
            customMeshName: this._customMeshName,
        };

        this.mesh._storedValue = meshData;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.remoteMeshUrl = this.remoteMeshUrl;
        serializationObject.remoteMeshName = this.remoteMeshName;
        serializationObject.customMeshName = this._customMeshName;
        if (this._customVertexData) {
            serializationObject.customVertexData = this._customVertexData.serialize();
        }
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.remoteMeshUrl = serializationObject.remoteMeshUrl ?? "";
        this.remoteMeshName = serializationObject.remoteMeshName ?? "";

        if (serializationObject.customVertexData) {
            this._customVertexData = VertexData.Parse(serializationObject.customVertexData);
            this._customMeshName = serializationObject.customMeshName || "";
        }
    }
}

RegisterClass("BABYLON.SPSMeshSourceBlock", SPSMeshSourceBlock);
