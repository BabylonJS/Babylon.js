/* eslint-disable @typescript-eslint/naming-convention */
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { Effect } from "../../../../Materials/effect";
import type { Scene } from "../../../../scene";
import { NodeMaterialConnectionPointDirection, type NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterial } from "../../nodeMaterial";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { Constants } from "core/Engines";
import type { Mesh } from "core/Meshes";
import { ImageSourceBlock } from "../Dual";

/**
 * Block used to expose an input value
 */
export class PrePassTextureBlock extends NodeMaterialBlock {
    private _colorSamplerName: string;
    private _depthSamplerName: string;
    private _normalSamplerName: string;

    /**
     * The texture associated with the node is the prepass texture
     */
    public get texture() {
        return null;
    }

    public set texture(value: any) {
        return;
    }

    /**
     * Creates a new PrePassTextureBlock
     * @param name defines the block name
     * @param target defines the target of that block (Vertex by default)
     * @param type defines the type of the input (can be set to NodeMaterialBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, target = NodeMaterialBlockTargets.Vertex) {
        super(name, target, false, true);

        this.registerOutput(
            "color",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            // new NodeMaterialConnectionPointCustomObject("color", this, NodeMaterialConnectionPointDirection.Output, PrePassTextureBlock, "color")
        );
        // this.registerOutput(
        //     "depth",
        //     NodeMaterialBlockConnectionPointTypes.Object,
        //     NodeMaterialBlockTargets.VertexAndFragment,
        //     new NodeMaterialConnectionPointCustomObject("depth", this, NodeMaterialConnectionPointDirection.Output, PrePassTextureBlock, "depth")
        // );
        // this.registerOutput(
        //     "normal",
        //     NodeMaterialBlockConnectionPointTypes.Object,
        //     NodeMaterialBlockTargets.VertexAndFragment,
        //     new NodeMaterialConnectionPointCustomObject("normal", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "normal")
        // );
    }

    /**
     * Gets the color texture
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the depth texture
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the color texture
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get colorSamplerName(): string {
        return this._colorSamplerName;
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get normalSamplerName(): string {
        return this._normalSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    public get depthSamplerName(): string {
        return this._depthSamplerName;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PrePassTextureBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            this._colorSamplerName = "prepassColorSampler";
            this._depthSamplerName = "prepassDepthSampler";
            this._normalSamplerName = "prepassNormalSampler";

            // Unique sampler names for every prepasstexture block
            state.sharedData.variableNames.prepassColorSampler = 0;
            state.sharedData.variableNames.prepassDepthSampler = 0;
            state.sharedData.variableNames.prepassNormalSampler = 0;

            // Declarations
            state.sharedData.blockingBlocks.push(this);
            state.sharedData.textureBlocks.push(this);
            state.sharedData.bindableBlocks.push(this);
        }

        state._emit2DSampler(this._colorSamplerName);
        state._emit2DSampler(this._depthSamplerName);
        state._emit2DSampler(this._normalSamplerName);

        return this;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();
        const prePassRenderer = scene.enablePrePassRenderer();
        if (!prePassRenderer) {
            return;
        }

        const sceneRT = prePassRenderer.getRenderTarget();
        effect.setTexture("prepassColorSampler", sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)]);
        effect.setTexture("prepassDepthSampler", sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
        effect.setTexture("prepassNormalSampler", sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE)]);
    }

    protected _dumpPropertiesCode() {
        return super._dumpPropertiesCode();
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);
    }
}

RegisterClass("BABYLON.PrePassTextureBlock", PrePassTextureBlock);

