import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { _TypeStore } from '../../../../Misc/typeStore';
import { InputBlock } from '../Input/inputBlock';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { Nullable } from '../../../../types';
import { BaseTexture } from '../../../Textures/baseTexture';
import { Mesh } from '../../../../Meshes/mesh';
import { SubMesh } from '../../../../Meshes/subMesh';
import { Effect } from '../../../effect';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { Scene } from '../../../../scene';
import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { CubeTexture } from '../../../Textures/cubeTexture';
import { Texture } from '../../../Textures/texture';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';

/**
 * Block used to implement the refraction part of the sub surface module of the PBR material
 */
export class RefractionBlock extends NodeMaterialBlock {

    /** @hidden */
    public _define3DName: string;
    /** @hidden */
    public _refractionMatrixName: string;
    /** @hidden */
    public _defineLODRefractionAlpha: string;
    /** @hidden */
    public _defineLinearSpecularRefraction: string;
    /** @hidden */
    public _defineOppositeZ: string;
    /** @hidden */
    public _cubeSamplerName: string;
    /** @hidden */
    public _2DSamplerName: string;
    /** @hidden */
    public _vRefractionMicrosurfaceInfosName: string;
    /** @hidden */
    public _vRefractionInfosName: string;

    private _scene: Scene;

    /**
     * This parameters will make the material used its opacity to control how much it is refracting aginst not.
     * Materials half opaque for instance using refraction could benefit from this control.
     */
    @editableInPropertyPage("Link refraction to transparency", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public linkRefractionWithTransparency: boolean = false;

    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    @editableInPropertyPage("Invert refraction Y", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public invertRefractionY: boolean = false;

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
        this.registerInput("indexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintAtDistance", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("refraction", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("refraction", this, NodeMaterialConnectionPointDirection.Output, RefractionBlock, "RefractionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RefractionBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the index of refraction input component
     */
    public get indexOfRefraction(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the tint at distance input component
     */
    public get tintAtDistance(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[3];
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

    public autoConfigure(material: NodeMaterial) {
        if (!this.intensity.isConnected) {
            let intensityInput = new InputBlock("Refraction intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);
        }

        if (!this.view.isConnected) {
            let viewInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.View);

            if (!viewInput) {
                viewInput = new InputBlock("view");
                viewInput.setAsSystemValue(NodeMaterialSystemValues.View);
            }
            viewInput.output.connectTo(this.view);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
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
        defines.setValue(this._defineOppositeZ, this._scene.useRightHandedSystem ? !refractionTexture!.invertZ : refractionTexture!.invertZ, true);

        defines.setValue("SS_LINKREFRACTIONTOTRANSPARENCY", this.linkRefractionWithTransparency, true);
        defines.setValue("SS_GAMMAREFRACTION", refractionTexture!.gammaSpace, true);
        defines.setValue("SS_RGBDREFRACTION", refractionTexture!.isRGBD, true);
    }

    public isReady() {
        const texture = this._getTexture();

        if (texture && !texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, subMesh?: SubMesh) {
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

        effect.setMatrix(this._refractionMatrixName, refractionTexture.getReflectionTextureMatrix());

        let depth = 1.0;
        if (!refractionTexture.isCube) {
            if ((<any>refractionTexture).depth) {
                depth = (<any>refractionTexture).depth;
            }
        }

        const indexOfRefraction = this.indexOfRefraction.connectInputBlock?.value ?? 1.5;

        effect.setFloat4(this._vRefractionInfosName, refractionTexture.level, 1 / indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);

        effect.setFloat3(this._vRefractionMicrosurfaceInfosName, refractionTexture.getSize().width, refractionTexture.lodGenerationScale, refractionTexture.lodGenerationOffset);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @returns the shader code
     */
    public getCode(state: NodeMaterialBuildState): string {
        let code = "";

        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);

        // Samplers
        this._cubeSamplerName = state._getFreeVariableName(this.name + "CubeSampler");
        state.samplers.push(this._cubeSamplerName);

        this._2DSamplerName = state._getFreeVariableName(this.name + "2DSampler");
        state.samplers.push(this._2DSamplerName);

        this._define3DName = state._getFreeDefineName("SS_REFRACTIONMAP_3D");

        state._samplerDeclaration += `#ifdef ${this._define3DName}\r\n`;
        state._samplerDeclaration += `uniform samplerCube ${this._cubeSamplerName};\r\n`;
        state._samplerDeclaration += `#else\r\n`;
        state._samplerDeclaration += `uniform sampler2D ${this._2DSamplerName};\r\n`;
        state._samplerDeclaration += `#endif\r\n`;

        // Fragment
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        this._defineLODRefractionAlpha = state._getFreeDefineName("SS_LODINREFRACTIONALPHA");
        this._defineLinearSpecularRefraction = state._getFreeDefineName("SS_LINEARSPECULARREFRACTION");
        this._defineOppositeZ = state._getFreeDefineName("SS_REFRACTIONMAP_OPPOSITEZ");

        this._refractionMatrixName = state._getFreeVariableName("refractionMatrix");

        state._emitUniformFromString(this._refractionMatrixName, "mat4");

        state._emitFunction("sampleRefraction", `
            #ifdef ${this._define3DName}
                #define sampleRefraction(s, c) textureCube(s, c)
            #else
                #define sampleRefraction(s, c) texture2D(s, c)
            #endif\r\n`, `//${this.name}`);

        state._emitFunction("sampleRefractionLod", `
            #ifdef ${this._define3DName}
                #define sampleRefractionLod(s, c, l) textureCubeLodEXT(s, c, l)
            #else
                #define sampleRefractionLod(s, c, l) texture2DLodEXT(s, c, l)
            #endif\r\n`, `//${this.name}`);

        this._vRefractionMicrosurfaceInfosName = state._getFreeVariableName("vRefractionMicrosurfaceInfos");

        state._emitUniformFromString(this._vRefractionMicrosurfaceInfosName, "vec3");

        this._vRefractionInfosName = state._getFreeVariableName("vRefractionInfos");

        state._emitUniformFromString(this._vRefractionInfosName, "vec4");

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        this._scene = state.sharedData.scene;

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = super._dumpPropertiesCode();

        if (this.texture) {
            if (this.texture.isCube) {
                codeString = `${this._codeVariableName}.texture = new BABYLON.CubeTexture("${this.texture.name}");\r\n`;
            } else {
                codeString = `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}");\r\n`;
            }
            codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\r\n`;
        }

        codeString += `${this._codeVariableName}.linkRefractionWithTransparency = ${this.linkRefractionWithTransparency};\r\n`;
        codeString += `${this._codeVariableName}.invertRefractionY = ${this.invertRefractionY};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.texture) {
            serializationObject.texture = this.texture.serialize();
        }

        serializationObject.linkRefractionWithTransparency = this.linkRefractionWithTransparency;
        serializationObject.invertRefractionY = this.invertRefractionY;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
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
    }
}

_TypeStore.RegisteredTypes["BABYLON.RefractionBlock"] = RefractionBlock;
