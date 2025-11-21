import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { Nullable } from "core/types";
import type { Mesh } from "core/Meshes/mesh";
import { ImportMeshAsync, SceneLoader } from "core/Loading/sceneLoader";
import { Tools } from "core/Misc/tools";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to load a mesh asset for SPS
 */
export class SPSMeshFileBlock extends NodeParticleBlock {
    @editableInPropertyPage("Mesh URL", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
    })
    public meshUrl = "";

    @editableInPropertyPage("Mesh name (optional)", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
    })
    public meshName = "";

    private _loadedMesh: Nullable<Mesh> = null;
    private _isLoading = false;

    public constructor(name: string) {
        super(name);
        this.registerOutput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
    }

    public override getClassName() {
        return "SPSMeshFileBlock";
    }

    public get mesh(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        if (this._loadedMesh && !this._loadedMesh.isDisposed()) {
            this.mesh._storedValue = this._loadedMesh;
            return;
        }

        this.mesh._storedValue = null;

        if (!state.scene || this._isLoading || !this.meshUrl) {
            return;
        }

        this._isLoading = true;

        const fileName = Tools.GetFilename(this.meshUrl);
        const rootUrl = this.meshUrl.substring(0, this.meshUrl.length - fileName.length);

        // TO-DO import mesh

        // ImportMeshAsync(this.meshUrl, state.scene)
        //     .then((result) => {
        //         let mesh = result.meshes.find((m) => (this.meshName ? m.name === this.meshName : m.name !== "__root__"));
        //         if (!mesh && result.meshes.length) {
        //             mesh = result.meshes[0];
        //         }
        //         if (mesh) {
        //             mesh.isVisible = false;
        //             this._loadedMesh = mesh as Mesh;
        //             this.mesh._storedValue = this._loadedMesh;
        //             this.onValueChangedObservable.notifyObservers(this);
        //         }
        //     })
        //     .catch(() => {
        //         // silently fail
        //     })
        //     .finally(() => {
        //         this._isLoading = false;
        //     });
    }

    public override dispose() {
        this._loadedMesh?.dispose();
        this._loadedMesh = null;
        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.meshUrl = this.meshUrl;
        serializationObject.meshName = this.meshName;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.meshUrl = serializationObject.meshUrl || "";
        this.meshName = serializationObject.meshName || "";
    }
}

RegisterClass("BABYLON.SPSMeshFileBlock", SPSMeshFileBlock);
