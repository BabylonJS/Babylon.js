import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { RegisterClass } from "../../../../Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { Nullable } from "../../../../types";
import type { BaseTexture } from "../../../Textures/baseTexture";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Effect } from "../../../effect";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Scene } from "../../../../scene";
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { CubeTexture } from "../../../Textures/cubeTexture";
import { Texture } from "../../../Textures/texture";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to implement the refraction part of the sub surface module of the PBR material
 */
export class RefractionBlock extends NodeMaterialBlock {
    /** @internal */
    public _define3DName: string;
    /** @internal */
    public _refractionMatrixName: string;
    /** @internal */
    public _defineLODRefractionAlpha: string;
    /** @internal */
    public _defineLinearSpecularRefraction: string;
    /** @internal */
    public _defineOppositeZ: string;
    /** @internal */
    public _cubeSamplerName: string;
    /** @internal */
    public _2DSamplerName: string;
    /** @internal */
    public _vRefractionMicrosurfaceInfosName: string;
    /** @internal */
    public _vRefractionInfosName: string;
    /** @internal */
    public _vRefractionFilteringInfoName: string;

    private _scene: Scene;

    /**
     * The properties below are set by the main PBR block prior to calling methods of this class.
     * This is to avoid having to add them as inputs here whereas they are already inputs of the main block, so already known.
     * It's less burden on the user side in the editor part.
     */

    /** @internal */
    public viewConnectionPoint: NodeMaterialConnectionPoint;

    /** @internal */
    public indexOfRefractionConnectionPoint: NodeMaterialConnectionPoint;

    /**
     * This parameters will make the material used its opacity to control how much it is refracting against not.
     * Materials half opaque for instance using refraction could benefit from this control.
     */
    @editableInPropertyPage("Link refraction to transparency", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public linkRefractionWithTransparency: boolean = false;

    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    @editableInPropertyPage("Invert refraction Y", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public invertRefractionY: boolean = false;

    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    @editableInPropertyPage("Use thickness as depth", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public useThicknessAsDepth: boolean = false;

    /**
     * Gets or sets the texture associated with the node
     */
    public texture: Nullable<BaseTexture>;

    /**
     * Create a new RefractionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintAtDistance", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("volumeIndexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput(
            "refraction",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("refraction", this, NodeMaterialConnectionPointDirection.Output, RefractionBlock, "RefractionBlock")
        );
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vRefractionPosition");
        state._excludeVariableName("vRefractionSize");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RefractionBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the tint at distance input component
     */
    public get tintAtDistance(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the volume index of refraction input component
     */
    public get volumeIndexOfRefraction(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this.viewConnectionPoint;
    }

    /**
     * Gets the refraction object output component
     */
    public get refraction(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Returns true if the block has a texture
     */
    public get hasTexture(): boolean {
        return !!this._getTexture();
    }

    protected _getTexture(): Nullable<BaseTexture> {
        if (this.texture) {
            return this.texture;
        }

        return this._scene.environmentTexture;
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.intensity.isConnected) {
            const intensityInput = new InputBlock("Refraction intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);
        }

        if (this.view && !this.view.isConnected) {
            let viewInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.View && additionalFilteringInfo(b));

            if (!viewInput) {
                viewInput = new InputBlock("view");
                viewInput.setAsSystemValue(NodeMaterialSystemValues.View);
            }
            viewInput.output.connectTo(this.view);
        }
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        const refractionTexture = this._getTexture();
        const refraction = refractionTexture && refractionTexture.getTextureMatrix;

        defines.setValue("SS_REFRACTION", refraction, true);

        if (!refraction) {
            return;
        }

        defines.setValue(this._define3DName, refractionTexture!.isCube, true);
        defines.setValue(this._defineLODRefractionAlpha, refractionTexture!.lodLevelInAlpha, true);
        defines.setValue(this._defineLinearSpecularRefraction, refractionTexture!.linearSpecularLOD, true);
        defines.setValue(this._defineOppositeZ, this._scene.useRightHandedSystem && refractionTexture.isCube ? !refractionTexture!.invertZ : refractionTexture!.invertZ, true);

        defines.setValue("SS_LINKREFRACTIONTOTRANSPARENCY", this.linkRefractionWithTransparency, true);
        defines.setValue("SS_GAMMAREFRACTION", refractionTexture!.gammaSpace, true);
        defines.setValue("SS_RGBDREFRACTION", refractionTexture!.isRGBD, true);
        defines.setValue("SS_USE_LOCAL_REFRACTIONMAP_CUBIC", (<any>refractionTexture).boundingBoxSize ? true : false, true);
        defines.setValue("SS_USE_THICKNESS_AS_DEPTH", this.useThicknessAsDepth, true);
    }

    public override isReady() {
        const texture = this._getTexture();

        if (texture && !texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        super.bind(effect, nodeMaterial, mesh);

        const refractionTexture = this._getTexture();

        if (!refractionTexture) {
            return;
        }

        if (refractionTexture.isCube) {
            effect.setTexture(this._cubeSamplerName, refractionTexture);
        } else {
            effect.setTexture(this._2DSamplerName, refractionTexture);
        }

        effect.setMatrix(this._refractionMatrixName, refractionTexture.getRefractionTextureMatrix());

        let depth = 1.0;
        if (!refractionTexture.isCube) {
            if ((<any>refractionTexture).depth) {
                depth = (<any>refractionTexture).depth;
            }
        }

        const indexOfRefraction = this.volumeIndexOfRefraction.connectInputBlock?.value ?? this.indexOfRefractionConnectionPoint.connectInputBlock?.value ?? 1.5;

        effect.setFloat4(this._vRefractionInfosName, refractionTexture.level, 1 / indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);

        effect.setFloat4(
            this._vRefractionMicrosurfaceInfosName,
            refractionTexture.getSize().width,
            refractionTexture.lodGenerationScale,
            refractionTexture.lodGenerationOffset,
            1 / indexOfRefraction
        );

        const width = refractionTexture.getSize().width;

        effect.setFloat2(this._vRefractionFilteringInfoName, width, Math.log2(width));

        if ((<any>refractionTexture).boundingBoxSize) {
            const cubeTexture = <CubeTexture>refractionTexture;
            effect.setVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
            effect.setVector3("vRefractionSize", cubeTexture.boundingBoxSize);
        }
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @returns the shader code
     */
    public getCode(state: NodeMaterialBuildState): string {
        const code = "";

        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);

        // Samplers
        this._cubeSamplerName = state._getFreeVariableName(this.name + "CubeSampler");
        state.samplers.push(this._cubeSamplerName);

        this._2DSamplerName = state._getFreeVariableName(this.name + "2DSampler");
        state.samplers.push(this._2DSamplerName);

        this._define3DName = state._getFreeDefineName("SS_REFRACTIONMAP_3D");
        const refractionTexture = this._getTexture();

        if (refractionTexture) {
            state._samplerDeclaration += `#ifdef ${this._define3DName}\n`;
            state._emitCubeSampler(this._cubeSamplerName, undefined, true);
            state._samplerDeclaration += `#else\n`;
            state._emit2DSampler(this._2DSamplerName, undefined, true);
            state._samplerDeclaration += `#endif\n`;
        }

        // Fragment
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        this._defineLODRefractionAlpha = state._getFreeDefineName("SS_LODINREFRACTIONALPHA");
        this._defineLinearSpecularRefraction = state._getFreeDefineName("SS_LINEARSPECULARREFRACTION");
        this._defineOppositeZ = state._getFreeDefineName("SS_REFRACTIONMAP_OPPOSITEZ");

        this._refractionMatrixName = state._getFreeVariableName("refractionMatrix");

        state._emitUniformFromString(this._refractionMatrixName, NodeMaterialBlockConnectionPointTypes.Matrix);

        if (state.shaderLanguage !== ShaderLanguage.WGSL) {
            state._emitFunction(
                "sampleRefraction",
                `
                #ifdef ${this._define3DName}
                    #define sampleRefraction(s, c) textureCube(s, c)
                #else
                    #define sampleRefraction(s, c) texture2D(s, c)
                #endif\n`,
                `//${this.name}`
            );

            state._emitFunction(
                "sampleRefractionLod",
                `
                #ifdef ${this._define3DName}
                    #define sampleRefractionLod(s, c, l) textureCubeLodEXT(s, c, l)
                #else
                    #define sampleRefractionLod(s, c, l) texture2DLodEXT(s, c, l)
                #endif\n`,
                `//${this.name}`
            );
        }

        this._vRefractionMicrosurfaceInfosName = state._getFreeVariableName("vRefractionMicrosurfaceInfos");

        state._emitUniformFromString(this._vRefractionMicrosurfaceInfosName, NodeMaterialBlockConnectionPointTypes.Vector4);

        this._vRefractionInfosName = state._getFreeVariableName("vRefractionInfos");

        state._emitUniformFromString(this._vRefractionInfosName, NodeMaterialBlockConnectionPointTypes.Vector4);

        this._vRefractionFilteringInfoName = state._getFreeVariableName("vRefractionFilteringInfo");

        state._emitUniformFromString(this._vRefractionFilteringInfoName, NodeMaterialBlockConnectionPointTypes.Vector2);

        state._emitUniformFromString("vRefractionPosition", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("vRefractionSize", NodeMaterialBlockConnectionPointTypes.Vector3);

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        this._scene = state.sharedData.scene;

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        if (this.texture) {
            if (this.texture.isCube) {
                codeString = `${this._codeVariableName}.texture = new BABYLON.CubeTexture("${this.texture.name}");\n`;
            } else {
                codeString = `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}");\n`;
            }
            codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\n`;
        }

        codeString += `${this._codeVariableName}.linkRefractionWithTransparency = ${this.linkRefractionWithTransparency};\n`;
        codeString += `${this._codeVariableName}.invertRefractionY = ${this.invertRefractionY};\n`;
        codeString += `${this._codeVariableName}.useThicknessAsDepth = ${this.useThicknessAsDepth};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        if (this.texture && !this.texture.isRenderTarget) {
            serializationObject.texture = this.texture.serialize();
        }

        serializationObject.linkRefractionWithTransparency = this.linkRefractionWithTransparency;
        serializationObject.invertRefractionY = this.invertRefractionY;
        serializationObject.useThicknessAsDepth = this.useThicknessAsDepth;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.texture) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            if (serializationObject.texture.isCube) {
                this.texture = CubeTexture.Parse(serializationObject.texture, scene, rootUrl);
            } else {
                this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
            }
        }

        this.linkRefractionWithTransparency = serializationObject.linkRefractionWithTransparency;
        this.invertRefractionY = serializationObject.invertRefractionY;
        this.useThicknessAsDepth = !!serializationObject.useThicknessAsDepth;
    }
}

RegisterClass("BABYLON.RefractionBlock", RefractionBlock);
