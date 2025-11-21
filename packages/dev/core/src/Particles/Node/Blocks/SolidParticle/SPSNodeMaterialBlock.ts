import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { Tools } from "core/Misc/tools";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import type { Nullable } from "core/types";
import { Texture } from "core/Materials/Textures/texture";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to load a node material for SPS
 */
export class SPSNodeMaterialBlock extends NodeParticleBlock {
    @editableInPropertyPage("Shader URL", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
    })
    public shaderUrl = "";

    @editableInPropertyPage("Texture URL", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
    })
    public textureUrl = "";

    @editableInPropertyPage("Texture Block Name", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
    })
    public textureBlockName = "";

    private _nodeMaterial: Nullable<NodeMaterial> = null;
    private _isLoading = false;

    public constructor(name: string) {
        super(name);
        this.registerOutput("material", NodeParticleBlockConnectionPointTypes.Material);
    }

    public override getClassName() {
        return "SPSNodeMaterialBlock";
    }

    public get material(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        if (this._nodeMaterial) {
            this.material._storedValue = this._nodeMaterial;
            return;
        }

        this.material._storedValue = null;

        if (!this.shaderUrl || this._isLoading) {
            return;
        }

        // TO-DO load node material

        // this._isLoading = true;

        // Tools.LoadFile(
        //     this.shaderUrl,
        //     (data) => {
        //         try {
        //             const json = JSON.parse(data as string);
        //             const nodeMaterial = NodeMaterial.Parse(json, state.scene);
        //             nodeMaterial.build(false);
        //             if (this.textureUrl && this.textureBlockName) {
        //                 const block = nodeMaterial.getBlockByName(this.textureBlockName) as any;
        //                 if (block && block.texture !== undefined) {
        //                     block.texture = new Texture(this.textureUrl, state.scene);
        //                 }
        //             }
        //             this._nodeMaterial = nodeMaterial;
        //             this.material._storedValue = nodeMaterial;
        //             this.onValueChangedObservable.notifyObservers(this);
        //         } catch (e) {
        //             // ignore parse errors
        //         } finally {
        //             this._isLoading = false;
        //         }
        //     },
        //     undefined,
        //     undefined,
        //     false,
        //     () => {
        //         this._isLoading = false;
        //     }
        // );
    }

    public override dispose() {
        this._nodeMaterial?.dispose();
        this._nodeMaterial = null;
        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.shaderUrl = this.shaderUrl;
        serializationObject.textureUrl = this.textureUrl;
        serializationObject.textureBlockName = this.textureBlockName;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.shaderUrl = serializationObject.shaderUrl || "";
        this.textureUrl = serializationObject.textureUrl || "";
        this.textureBlockName = serializationObject.textureBlockName || "";
    }
}

RegisterClass("BABYLON.SPSNodeMaterialBlock", SPSNodeMaterialBlock);
