import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Nullable } from "../../../../types";
import { Texture } from "../../../Textures/texture";
import { Constants } from "../../../../Engines/constants";
import type { Effect } from "../../../effect";
import { NodeMaterial } from "../../nodeMaterial";
import type { Scene } from "../../../../scene";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { EngineStore } from "../../../../Engines/engineStore";
/**
 * Block used to provide an image for a TextureBlock
 */
export class ImageSourceBlock extends NodeMaterialBlock {
    private _samplerName: string;
    protected _texture: Nullable<Texture>;
    /**
     * Gets or sets the texture associated with the node
     */
    public get texture(): Nullable<Texture> {
        return this._texture;
    }

    public set texture(texture: Nullable<Texture>) {
        if (this._texture === texture) {
            return;
        }

        const scene = texture?.getScene() ?? EngineStore.LastCreatedScene;

        if (!texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this._texture!);
            });
        }

        this._texture = texture;

        if (texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(texture);
            });
        }
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get samplerName(): string {
        return this._samplerName;
    }

    /**
     * Creates a new ImageSourceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput(
            "source",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("source", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
    }

    public bind(effect: Effect) {
        if (!this.texture) {
            return;
        }

        effect.setTexture(this._samplerName, this.texture);
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ImageSourceBlock";
    }

    /**
     * Gets the output component
     */
    public get source(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            this._samplerName = state._getFreeVariableName(this.name + "Sampler");

            // Declarations
            state.sharedData.blockingBlocks.push(this);
            state.sharedData.textureBlocks.push(this);
            state.sharedData.bindableBlocks.push(this);
        }

        state._emit2DSampler(this._samplerName);

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        if (!this.texture) {
            return codeString;
        }

        codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null, ${this.texture.noMipmap}, ${this.texture.invertY}, ${this.texture.samplingMode});\r\n`;
        codeString += `${this._codeVariableName}.texture.wrapU = ${this.texture.wrapU};\r\n`;
        codeString += `${this._codeVariableName}.texture.wrapV = ${this.texture.wrapV};\r\n`;
        codeString += `${this._codeVariableName}.texture.uAng = ${this.texture.uAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.vAng = ${this.texture.vAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.wAng = ${this.texture.wAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.uOffset = ${this.texture.uOffset};\r\n`;
        codeString += `${this._codeVariableName}.texture.vOffset = ${this.texture.vOffset};\r\n`;
        codeString += `${this._codeVariableName}.texture.uScale = ${this.texture.uScale};\r\n`;
        codeString += `${this._codeVariableName}.texture.vScale = ${this.texture.vScale};\r\n`;
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\r\n`;

        return codeString;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        if (this.texture && !this.texture.isRenderTarget && this.texture.getClassName() !== "VideoTexture") {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime && serializationObject.texture.url !== undefined) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
        }
    }
}

RegisterClass("BABYLON.ImageSourceBlock", ImageSourceBlock);
