import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import type { Nullable } from "core/types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Texture } from "core/Materials/Textures/texture";

/**
 * Block used to load a node material for SPS
 */
export class NodeMaterialSourceBlock extends NodeParticleBlock {
    private _serializedMaterial: Nullable<string> = null;
    private _customMaterialName = "";

    public constructor(name: string) {
        super(name);
        this.registerInput("texture", NodeParticleBlockConnectionPointTypes.Texture, true);
        this.registerOutput("material", NodeParticleBlockConnectionPointTypes.Material);
    }

    public override getClassName() {
        return "NodeMaterialSourceBlock";
    }

    /** Raised when material data changes */
    public onValueChangedObservable = new Observable<NodeMaterialSourceBlock>();

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
        this.onValueChangedObservable.notifyObservers(this);
    }

    public clearMaterial() {
        this._serializedMaterial = null;
        this._customMaterialName = "";
        this.onValueChangedObservable.notifyObservers(this);
    }

    public override _build(state: NodeParticleBuildState) {
        this.material._storedValue = null;

        if (!this._serializedMaterial) {
            return;
        }

        const nodeMaterial = this._instantiateMaterial(this._serializedMaterial, state.scene);
        if (!nodeMaterial) {
            return;
        }

        this._applyTexture(state, nodeMaterial);
        this.material._storedValue = nodeMaterial;
    }

    public override dispose() {
        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.serializedMaterial = this._serializedMaterial;
        serializationObject.customMaterialName = this._customMaterialName;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this._serializedMaterial = serializationObject.serializedMaterial || null;
        this._customMaterialName = serializationObject.customMaterialName || "";
    }

    private _instantiateMaterial(serializedData: string, scene: Scene): Nullable<NodeMaterial> {
        try {
            const json = JSON.parse(serializedData);
            const nodeMaterial = NodeMaterial.Parse(json, scene);
            nodeMaterial.build(false);
            return nodeMaterial;
        } catch {
            return null;
        }
    }

    private _applyTexture(state: NodeParticleBuildState, nodeMaterial: NodeMaterial) {
        if (!this.texture.isConnected) {
            return;
        }

        const connectedTexture = this.texture.getConnectedValue(state) as Texture;
        if (!connectedTexture) {
            return;
        }

        const textureBlocks = nodeMaterial.getTextureBlocks();
        if (!textureBlocks.length) {
            return;
        }

        for (const textureBlock of textureBlocks) {
            textureBlock.texture = connectedTexture;
        }
    }
}

RegisterClass("BABYLON.NodeMaterialBlock", NodeMaterialSourceBlock);
