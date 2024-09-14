import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { Effect } from "../../../../Materials/effect";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterial } from "../../nodeMaterial";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { Constants } from "../../../../Engines/constants";
import { ImageSourceBlock } from "../Dual/imageSourceBlock";

/**
 * Block used to read from prepass textures
 */
export class PrePassTextureBlock extends NodeMaterialBlock {
    private _positionSamplerName: string;
    private _localPositionSamplerName: string;
    private _depthSamplerName: string;
    private _screenSpaceDepthSamplerName: string;
    private _normalSamplerName: string;
    private _worldNormalSamplerName: string;

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
     * @param target defines the target of that block (VertexAndFragment by default)
     */
    public constructor(name: string, target = NodeMaterialBlockTargets.VertexAndFragment) {
        super(name, target, false);

        this.registerOutput(
            "position",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("position", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerOutput(
            "localPosition",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("localPosition", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerOutput(
            "depth",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("depth", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerOutput(
            "screenDepth",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("screenDepth", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerOutput(
            "normal",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("normal", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerOutput(
            "worldNormal",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("worldNormal", this, NodeMaterialConnectionPointDirection.Output, ImageSourceBlock, "ImageSourceBlock")
        );
    }

    /**
     * Returns the sampler name associated with the node connection point
     * @param output defines the connection point to get the associated sampler name
     * @returns
     */
    public getSamplerName(output: NodeMaterialConnectionPoint): string {
        if (output === this._outputs[0]) {
            return this._positionSamplerName;
        }

        if (output === this._outputs[1]) {
            return this._localPositionSamplerName;
        }

        if (output === this._outputs[2]) {
            return this._depthSamplerName;
        }

        if (output === this._outputs[3]) {
            return this._screenSpaceDepthSamplerName;
        }

        if (output === this._outputs[4]) {
            return this._normalSamplerName;
        }

        if (output === this._outputs[5]) {
            return this._worldNormalSamplerName;
        }

        return "";
    }

    /**
     * Gets the position texture
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the local position texture
     */
    public get localPosition(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the depth texture
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the screen depth texture
     */
    public get screenDepth(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the normal texture
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the world normal texture
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get positionSamplerName(): string {
        return this._positionSamplerName;
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get localPositionSamplerName(): string {
        return this._localPositionSamplerName;
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
    public get worldNormalSamplerName(): string {
        return this._worldNormalSamplerName;
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get depthSamplerName(): string {
        return this._depthSamplerName;
    }

    /**
     * Gets the sampler name associated with this image source
     */
    public get linearDepthSamplerName(): string {
        return this._screenSpaceDepthSamplerName;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PrePassTextureBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }

        this._positionSamplerName = "prepassPositionSampler";
        this._depthSamplerName = "prepassDepthSampler";
        this._normalSamplerName = "prepassNormalSampler";
        this._worldNormalSamplerName = "prepassWorldNormalSampler";
        this._localPositionSamplerName = "prepassLocalPositionSampler";
        this._screenSpaceDepthSamplerName = "prepassScreenSpaceDepthSampler";

        // Unique sampler names for every prepasstexture block
        state.sharedData.variableNames.prepassPositionSampler = 0;
        state.sharedData.variableNames.prepassDepthSampler = 0;
        state.sharedData.variableNames.prepassNormalSampler = 0;
        state.sharedData.variableNames.prepassWorldNormalSampler = 0;
        state.sharedData.variableNames.prepassLocalPositionSampler = 0;
        state.sharedData.variableNames.prepassScreenSpaceDepthSampler = 0;

        // Declarations
        state.sharedData.textureBlocks.push(this);
        state.sharedData.bindableBlocks.push(this);

        if (this.position.isConnected) {
            state._emit2DSampler(this._positionSamplerName);
        }
        if (this.depth.isConnected) {
            state._emit2DSampler(this._depthSamplerName);
        }
        if (this.normal.isConnected) {
            state._emit2DSampler(this._normalSamplerName);
        }
        if (this.worldNormal.isConnected) {
            state._emit2DSampler(this._worldNormalSamplerName);
        }
        if (this.localPosition.isConnected) {
            state._emit2DSampler(this._localPositionSamplerName);
        }
        if (this.screenDepth.isConnected) {
            state._emit2DSampler(this._screenSpaceDepthSamplerName);
        }

        return this;
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial) {
        const scene = nodeMaterial.getScene();
        const prePassRenderer = scene.enablePrePassRenderer();
        if (!prePassRenderer) {
            return;
        }

        const sceneRT = prePassRenderer.defaultRT;
        if (!sceneRT.textures) {
            return;
        }

        if (this.position.isConnected) {
            effect.setTexture(this._positionSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE)]);
        }
        if (this.localPosition.isConnected) {
            effect.setTexture(this._localPositionSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE)]);
        }
        if (this.depth.isConnected) {
            effect.setTexture(this._depthSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
        }
        if (this.screenDepth.isConnected) {
            effect.setTexture(this._screenSpaceDepthSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE)]);
        }
        if (this.normal.isConnected) {
            effect.setTexture(this._normalSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE)]);
        }
        if (this.worldNormal.isConnected) {
            effect.setTexture(this._worldNormalSamplerName, sceneRT.textures[prePassRenderer.getIndex(Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE)]);
        }
    }
}

RegisterClass("BABYLON.PrePassTextureBlock", PrePassTextureBlock);
