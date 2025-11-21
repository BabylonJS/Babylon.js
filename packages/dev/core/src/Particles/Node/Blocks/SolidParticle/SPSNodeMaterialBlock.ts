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
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

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
    private _serializedMaterial: Nullable<string> = null;
    private _customMaterialName = "";
    private _textureInstance: Nullable<Texture> = null;
    private _isLoading = false;

    public constructor(name: string) {
        super(name);
        this.registerInput("texture", NodeParticleBlockConnectionPointTypes.Texture, true);
        this.registerOutput("material", NodeParticleBlockConnectionPointTypes.Material);
    }

    public override getClassName() {
        return "SPSNodeMaterialBlock";
    }

    /** Raised when material data changes */
    public onValueChangedObservable = new Observable<SPSNodeMaterialBlock>();

    public get texture(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get material(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public get hasCustomMaterial(): boolean {
        return !!this._serializedMaterial;
    }

    public get customMaterialName(): string {
        return this._customMaterialName;
    }

    public setSerializedMaterial(serializedData: string, name?: string) {
        this._serializedMaterial = serializedData;
        this._customMaterialName = name || "Custom Node Material";
        this.shaderUrl = "";
        this._disposeMaterial();
        this.onValueChangedObservable.notifyObservers(this);
    }

    public clearMaterial() {
        this._serializedMaterial = null;
        this._customMaterialName = "";
        this._disposeMaterial();
        this.onValueChangedObservable.notifyObservers(this);
    }

    public override _build(state: NodeParticleBuildState) {
        if (this._nodeMaterial) {
            this._applyTexture(state, this._nodeMaterial);
            this.material._storedValue = this._nodeMaterial;
            return;
        }

        this.material._storedValue = null;

        if (this._serializedMaterial) {
            if (this._instantiateMaterial(this._serializedMaterial, state.scene)) {
                this._applyTexture(state, this._nodeMaterial!);
                this.material._storedValue = this._nodeMaterial;
            }
            return;
        }

        if (!this.shaderUrl || this._isLoading) {
            return;
        }

        this._isLoading = true;
        const scene = state.scene;
        Tools.LoadFile(
            this.shaderUrl,
            (data) => {
                try {
                    this._serializedMaterial = data as string;
                    this._customMaterialName = this.shaderUrl;
                    this._instantiateMaterial(this._serializedMaterial, scene);
                    this.onValueChangedObservable.notifyObservers(this);
                } finally {
                    this._isLoading = false;
                }
            },
            undefined,
            undefined,
            false,
            () => {
                this._isLoading = false;
            }
        );
    }

    public override dispose() {
        this._disposeMaterial();
        this._textureInstance?.dispose();
        this._textureInstance = null;
        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.shaderUrl = this.shaderUrl;
        serializationObject.textureUrl = this.textureUrl;
        serializationObject.textureBlockName = this.textureBlockName;
        serializationObject.serializedMaterial = this._serializedMaterial;
        serializationObject.customMaterialName = this._customMaterialName;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.shaderUrl = serializationObject.shaderUrl || "";
        this.textureUrl = serializationObject.textureUrl || "";
        this.textureBlockName = serializationObject.textureBlockName || "";
        this._serializedMaterial = serializationObject.serializedMaterial || null;
        this._customMaterialName = serializationObject.customMaterialName || "";
        this._disposeMaterial();
    }

    private _disposeMaterial() {
        this._nodeMaterial?.dispose();
        this._nodeMaterial = null;
    }

    private _instantiateMaterial(serializedData: string, scene: Scene): boolean {
        try {
            const json = JSON.parse(serializedData);
            const nodeMaterial = NodeMaterial.Parse(json, scene);
            nodeMaterial.build(false);
            this._disposeMaterial();
            this._nodeMaterial = nodeMaterial;
            return true;
        } catch {
            this._nodeMaterial = null;
        }
        return false;
    }

    private _applyTexture(state: NodeParticleBuildState, nodeMaterial: NodeMaterial) {
        if (!this.textureBlockName) {
            return;
        }

        const block = nodeMaterial.getBlockByName(this.textureBlockName) as { texture?: Texture | null };
        if (!block || block.texture === undefined) {
            return;
        }

        if (this.texture.isConnected) {
            const connectedTexture = this.texture.getConnectedValue(state) as Texture;
            if (connectedTexture) {
                block.texture = connectedTexture;
                return;
            }
        }

        if (!this.textureUrl) {
            block.texture = null;
            return;
        }

        if (!this._textureInstance || this._textureInstance.url !== this.textureUrl) {
            this._textureInstance?.dispose();
            this._textureInstance = new Texture(this.textureUrl, state.scene);
        }

        block.texture = this._textureInstance;
    }
}

RegisterClass("BABYLON.SPSNodeMaterialBlock", SPSNodeMaterialBlock);
