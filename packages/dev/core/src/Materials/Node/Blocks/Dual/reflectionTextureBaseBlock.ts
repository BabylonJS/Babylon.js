import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { BaseTexture } from "../../../Textures/baseTexture";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterial } from "../../nodeMaterial";
import type { Effect } from "../../../effect";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import { InputBlock } from "../Input/inputBlock";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { Constants } from "../../../../Engines/constants";

import { CubeTexture } from "../../../Textures/cubeTexture";
import { Texture } from "../../../Textures/texture";
import { EngineStore } from "../../../../Engines/engineStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { SubMesh } from "../../../..//Meshes/subMesh";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Base block used to read a reflection texture from a sampler
 */
export abstract class ReflectionTextureBaseBlock extends NodeMaterialBlock {
    /** @internal */
    public _define3DName: string;
    /** @internal */
    public _defineCubicName: string;
    /** @internal */
    public _defineExplicitName: string;
    /** @internal */
    public _defineProjectionName: string;
    /** @internal */
    public _defineLocalCubicName: string;
    /** @internal */
    public _defineSphericalName: string;
    /** @internal */
    public _definePlanarName: string;
    /** @internal */
    public _defineEquirectangularName: string;
    /** @internal */
    public _defineMirroredEquirectangularFixedName: string;
    /** @internal */
    public _defineEquirectangularFixedName: string;
    /** @internal */
    public _defineSkyboxName: string;
    /** @internal */
    public _defineOppositeZ: string;
    /** @internal */
    public _cubeSamplerName: string;
    /** @internal */
    public _2DSamplerName: string;
    /** @internal */
    public _reflectionPositionName: string;
    /** @internal */
    public _reflectionSizeName: string;

    protected _positionUVWName: string;
    protected _directionWname: string;
    protected _reflectionVectorName: string;
    /** @internal */
    public _reflectionCoordsName: string;
    /** @internal */
    public _reflectionMatrixName: string;
    protected _reflectionColorName: string;
    protected _worldPositionNameInFragmentOnlyMode: string;

    protected _texture: Nullable<BaseTexture>;
    /**
     * Gets or sets the texture associated with the node
     */
    public get texture(): Nullable<BaseTexture> {
        return this._texture;
    }

    public set texture(texture: Nullable<BaseTexture>) {
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

    /** Indicates that no code should be generated in the vertex shader. Can be useful in some specific circumstances (like when doing ray marching for eg) */
    @editableInPropertyPage("Generate only fragment code", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: { rebuild: true, update: true, onValidation: ReflectionTextureBaseBlock._OnGenerateOnlyFragmentCodeChanged },
    })
    public generateOnlyFragmentCode = false;

    protected static _OnGenerateOnlyFragmentCodeChanged(block: NodeMaterialBlock, _propertyName: string): boolean {
        const that = block as ReflectionTextureBaseBlock;
        return that._onGenerateOnlyFragmentCodeChanged();
    }

    protected _onGenerateOnlyFragmentCodeChanged(): boolean {
        this._setTarget();
        return true;
    }

    protected _setTarget(): void {
        this._setInitialTarget(this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.VertexAndFragment);
    }

    /**
     * Create a new ReflectionTextureBaseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ReflectionTextureBaseBlock";
    }

    /**
     * Gets the world position input component
     */
    public abstract get position(): NodeMaterialConnectionPoint;

    /**
     * Gets the world position input component
     */
    public abstract get worldPosition(): NodeMaterialConnectionPoint;

    /**
     * Gets the world normal input component
     */
    public abstract get worldNormal(): NodeMaterialConnectionPoint;

    /**
     * Gets the world input component
     */
    public abstract get world(): NodeMaterialConnectionPoint;

    /**
     * Gets the camera (or eye) position component
     */
    public abstract get cameraPosition(): NodeMaterialConnectionPoint;

    /**
     * Gets the view input component
     */
    public abstract get view(): NodeMaterialConnectionPoint;

    protected _getTexture(): Nullable<BaseTexture> {
        return this.texture;
    }

    public override initialize(state: NodeMaterialBuildState) {
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await import("../../../../ShadersWGSL/ShadersInclude/reflectionFunction");
        } else {
            await import("../../../../Shaders/ShadersInclude/reflectionFunction");
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    /**
     * Auto configure the node based on the existing material
     * @param material defines the material to configure
     * @param additionalFilteringInfo defines additional info to be used when filtering inputs (we might want to skip some non relevant blocks)
     */
    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.position.isConnected) {
            let positionInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "position" && additionalFilteringInfo(b));

            if (!positionInput) {
                positionInput = new InputBlock("position");
                positionInput.setAsAttribute();
            }
            positionInput.output.connectTo(this.position);
        }

        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.World && additionalFilteringInfo(b));

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
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
        if (!defines._areTexturesDirty) {
            return;
        }

        const texture = this._getTexture();

        if (!texture || !texture.getTextureMatrix) {
            return;
        }

        defines.setValue(this._define3DName, texture.isCube, true);
        defines.setValue(this._defineLocalCubicName, (<any>texture).boundingBoxSize ? true : false, true);
        defines.setValue(this._defineExplicitName, texture.coordinatesMode === Constants.TEXTURE_EXPLICIT_MODE, true);
        defines.setValue(this._defineSkyboxName, texture.coordinatesMode === Constants.TEXTURE_SKYBOX_MODE, true);
        defines.setValue(this._defineCubicName, texture.coordinatesMode === Constants.TEXTURE_CUBIC_MODE || texture.coordinatesMode === Constants.TEXTURE_INVCUBIC_MODE, true);
        defines.setValue("INVERTCUBICMAP", texture.coordinatesMode === Constants.TEXTURE_INVCUBIC_MODE, true);
        defines.setValue(this._defineSphericalName, texture.coordinatesMode === Constants.TEXTURE_SPHERICAL_MODE, true);
        defines.setValue(this._definePlanarName, texture.coordinatesMode === Constants.TEXTURE_PLANAR_MODE, true);
        defines.setValue(this._defineProjectionName, texture.coordinatesMode === Constants.TEXTURE_PROJECTION_MODE, true);
        defines.setValue(this._defineEquirectangularName, texture.coordinatesMode === Constants.TEXTURE_EQUIRECTANGULAR_MODE, true);
        defines.setValue(this._defineEquirectangularFixedName, texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE, true);
        defines.setValue(this._defineMirroredEquirectangularFixedName, texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE, true);
    }

    public override isReady() {
        const texture = this._getTexture();

        if (texture && !texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, _subMesh?: SubMesh) {
        const texture = this._getTexture();

        if (!mesh || !texture) {
            return;
        }

        effect.setMatrix(this._reflectionMatrixName, texture.getReflectionTextureMatrix());

        if (texture.isCube) {
            effect.setTexture(this._cubeSamplerName, texture);
        } else {
            effect.setTexture(this._2DSamplerName, texture);
        }

        if ((<any>texture).boundingBoxSize) {
            const cubeTexture = <CubeTexture>texture;
            effect.setVector3(this._reflectionPositionName, cubeTexture.boundingBoxPosition);
            effect.setVector3(this._reflectionSizeName, cubeTexture.boundingBoxSize);
        }
    }

    /**
     * Gets the code to inject in the vertex shader
     * @param state current state of the node material building
     * @returns the shader code
     */
    public handleVertexSide(state: NodeMaterialBuildState): string {
        if (this.generateOnlyFragmentCode && state.target === NodeMaterialBlockTargets.Vertex) {
            return "";
        }

        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        this._define3DName = state._getFreeDefineName("REFLECTIONMAP_3D");
        this._defineCubicName = state._getFreeDefineName("REFLECTIONMAP_CUBIC");
        this._defineSphericalName = state._getFreeDefineName("REFLECTIONMAP_SPHERICAL");
        this._definePlanarName = state._getFreeDefineName("REFLECTIONMAP_PLANAR");
        this._defineProjectionName = state._getFreeDefineName("REFLECTIONMAP_PROJECTION");
        this._defineExplicitName = state._getFreeDefineName("REFLECTIONMAP_EXPLICIT");
        this._defineEquirectangularName = state._getFreeDefineName("REFLECTIONMAP_EQUIRECTANGULAR");
        this._defineLocalCubicName = state._getFreeDefineName("USE_LOCAL_REFLECTIONMAP_CUBIC");
        this._defineMirroredEquirectangularFixedName = state._getFreeDefineName("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
        this._defineEquirectangularFixedName = state._getFreeDefineName("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
        this._defineSkyboxName = state._getFreeDefineName("REFLECTIONMAP_SKYBOX");
        this._defineOppositeZ = state._getFreeDefineName("REFLECTIONMAP_OPPOSITEZ");

        this._reflectionMatrixName = state._getFreeVariableName("reflectionMatrix");

        state._emitUniformFromString(this._reflectionMatrixName, NodeMaterialBlockConnectionPointTypes.Matrix);

        let code = "";

        this._worldPositionNameInFragmentOnlyMode = state._getFreeVariableName("worldPosition");

        const worldPosVaryingName = this.generateOnlyFragmentCode ? this._worldPositionNameInFragmentOnlyMode : "v_" + this.worldPosition.associatedVariableName;
        if (this.generateOnlyFragmentCode || state._emitVaryingFromString(worldPosVaryingName, NodeMaterialBlockConnectionPointTypes.Vector4)) {
            if (this.generateOnlyFragmentCode) {
                code += `${state._declareLocalVar(worldPosVaryingName, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.worldPosition.associatedVariableName};\n`;
            } else {
                code += `${isWebGPU ? "vertexOutputs." : ""}${worldPosVaryingName} = ${this.worldPosition.associatedVariableName};\n`;
            }
        }

        this._positionUVWName = state._getFreeVariableName("positionUVW");
        this._directionWname = state._getFreeVariableName("directionW");

        if (this.generateOnlyFragmentCode || state._emitVaryingFromString(this._positionUVWName, NodeMaterialBlockConnectionPointTypes.Vector3, this._defineSkyboxName)) {
            code += `#ifdef ${this._defineSkyboxName}\n`;
            if (this.generateOnlyFragmentCode) {
                code += `${state._declareLocalVar(this._positionUVWName, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this.position.associatedVariableName}.xyz;\n`;
            } else {
                code += `${isWebGPU ? "vertexOutputs." : ""}${this._positionUVWName} = ${this.position.associatedVariableName}.xyz;\n`;
            }
            code += `#endif\n`;
        }

        if (
            this.generateOnlyFragmentCode ||
            state._emitVaryingFromString(
                this._directionWname,
                NodeMaterialBlockConnectionPointTypes.Vector3,
                `defined(${this._defineEquirectangularFixedName}) || defined(${this._defineMirroredEquirectangularFixedName})`
            )
        ) {
            code += `#if defined(${this._defineEquirectangularFixedName}) || defined(${this._defineMirroredEquirectangularFixedName})\n`;
            if (this.generateOnlyFragmentCode) {
                code += `${state._declareLocalVar(this._directionWname, NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(vec3${state.fSuffix}(${this.world.associatedVariableName} * vec4${state.fSuffix}(${
                    this.position.associatedVariableName
                }.xyz, 0.0)));\n`;
            } else {
                code += `${isWebGPU ? "vertexOutputs." : ""}${this._directionWname} = normalize(vec3${state.fSuffix}(${this.world.associatedVariableName} * vec4${state.fSuffix}(${
                    this.position.associatedVariableName
                }.xyz, 0.0)));\n`;
            }
            code += `#endif\n`;
        }

        return code;
    }

    /**
     * Handles the inits for the fragment code path
     * @param state node material build state
     */
    public handleFragmentSideInits(state: NodeMaterialBuildState) {
        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);

        // Samplers
        this._cubeSamplerName = state._getFreeVariableName(this.name + "CubeSampler");
        state.samplers.push(this._cubeSamplerName);

        this._2DSamplerName = state._getFreeVariableName(this.name + "2DSampler");
        state.samplers.push(this._2DSamplerName);

        state._samplerDeclaration += `#ifdef ${this._define3DName}\n`;
        state._emitCubeSampler(this._cubeSamplerName, "", true);
        state._samplerDeclaration += `#else\n`;
        state._emit2DSampler(this._2DSamplerName, "", true);
        state._samplerDeclaration += `#endif\n`;

        // Fragment
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitFunctionFromInclude("reflectionFunction", comments, {
            replaceStrings: [
                { search: /vec3 computeReflectionCoords/g, replace: "void DUMMYFUNC" },
                { search: /fn computeReflectionCoords\(worldPos: vec4f,worldNormal: vec3f\)->vec3f/g, replace: "fn DUMMYFUNC()" },
            ],
        });

        this._reflectionColorName = state._getFreeVariableName("reflectionColor");
        this._reflectionVectorName = state._getFreeVariableName("reflectionUVW");
        this._reflectionCoordsName = state._getFreeVariableName("reflectionCoords");

        this._reflectionPositionName = state._getFreeVariableName("vReflectionPosition");
        state._emitUniformFromString(this._reflectionPositionName, NodeMaterialBlockConnectionPointTypes.Vector3);

        this._reflectionSizeName = state._getFreeVariableName("vReflectionPosition");
        state._emitUniformFromString(this._reflectionSizeName, NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    /**
     * Generates the reflection coords code for the fragment code path
     * @param state defines the build state
     * @param worldNormalVarName name of the world normal variable
     * @param worldPos name of the world position variable. If not provided, will use the world position connected to this block
     * @param onlyReflectionVector if true, generates code only for the reflection vector computation, not for the reflection coordinates
     * @param doNotEmitInvertZ if true, does not emit the invertZ code
     * @returns the shader code
     */
    public handleFragmentSideCodeReflectionCoords(
        state: NodeMaterialBuildState,
        worldNormalVarName: string,
        worldPos?: string,
        onlyReflectionVector = false,
        doNotEmitInvertZ = false
    ): string {
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        const reflectionMatrix = (isWebGPU ? "uniforms." : "") + this._reflectionMatrixName;
        const direction = `normalize(${this._directionWname})`;
        const positionUVW = `${this._positionUVWName}`;
        const vEyePosition = `${this.cameraPosition.associatedVariableName}`;
        const view = `${this.view.associatedVariableName}`;
        const fragmentInputsPrefix = isWebGPU ? "fragmentInputs." : "";

        if (!worldPos) {
            worldPos = this.generateOnlyFragmentCode ? this._worldPositionNameInFragmentOnlyMode : `${fragmentInputsPrefix}v_${this.worldPosition.associatedVariableName}`;
        }

        worldNormalVarName += ".xyz";

        let code = `
            #ifdef ${this._defineMirroredEquirectangularFixedName}
               ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeMirroredFixedEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${direction});
            #endif

            #ifdef ${this._defineEquirectangularFixedName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeFixedEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${direction});
            #endif

            #ifdef ${this._defineEquirectangularName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineSphericalName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeSphericalCoords(${worldPos}, ${worldNormalVarName}, ${view}, ${reflectionMatrix});
            #endif

            #ifdef ${this._definePlanarName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computePlanarCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineCubicName}
                #ifdef ${this._defineLocalCubicName}
                    ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeCubicLocalCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix}, ${this._reflectionSizeName}, ${this._reflectionPositionName});
                #else
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeCubicCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
                #endif
            #endif

            #ifdef ${this._defineProjectionName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeProjectionCoords(${worldPos}, ${view}, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineSkyboxName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = computeSkyBoxCoords(${positionUVW}, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineExplicitName}
                ${state._declareLocalVar(this._reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = vec3(0, 0, 0);
            #endif\n`;

        if (!doNotEmitInvertZ) {
            code += `#ifdef ${this._defineOppositeZ}
                ${this._reflectionVectorName}.z *= -1.0;
            #endif\n`;
        }

        if (!onlyReflectionVector) {
            code += `
                #ifdef ${this._define3DName}
                    ${state._declareLocalVar(this._reflectionCoordsName, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this._reflectionVectorName};
                #else
                    ${state._declareLocalVar(this._reflectionCoordsName, NodeMaterialBlockConnectionPointTypes.Vector2)} = ${this._reflectionVectorName}.xy;
                    #ifdef ${this._defineProjectionName}
                        ${this._reflectionCoordsName} /= ${this._reflectionVectorName}.z;
                    #endif
                    ${this._reflectionCoordsName}.y = 1.0 - ${this._reflectionCoordsName}.y;
                #endif\n`;
        }

        return code;
    }

    /**
     * Generates the reflection color code for the fragment code path
     * @param state defines the build state
     * @param lodVarName name of the lod variable
     * @param swizzleLookupTexture swizzle to use for the final color variable
     * @returns the shader code
     */
    public handleFragmentSideCodeReflectionColor(state: NodeMaterialBuildState, lodVarName?: string, swizzleLookupTexture = ".rgb"): string {
        let colorType = NodeMaterialBlockConnectionPointTypes.Vector4;

        if (swizzleLookupTexture.length === 3) {
            colorType = NodeMaterialBlockConnectionPointTypes.Vector3;
        }

        let code = `${state._declareLocalVar(this._reflectionColorName, colorType)};
            #ifdef ${this._define3DName}\n`;

        if (lodVarName) {
            code += `${this._reflectionColorName} = ${state._generateTextureSampleCubeLOD(this._reflectionVectorName, this._cubeSamplerName, lodVarName)}${swizzleLookupTexture};\n`;
        } else {
            code += `${this._reflectionColorName} = ${state._generateTextureSampleCube(this._reflectionVectorName, this._cubeSamplerName)}${swizzleLookupTexture};\n`;
        }

        code += `
            #else\n`;

        if (lodVarName) {
            code += `${this._reflectionColorName} =${state._generateTextureSampleLOD(this._reflectionCoordsName, this._2DSamplerName, lodVarName)}${swizzleLookupTexture};\n`;
        } else {
            code += `${this._reflectionColorName} = ${state._generateTextureSample(this._reflectionCoordsName, this._2DSamplerName)}${swizzleLookupTexture};\n`;
        }

        code += `#endif\n`;

        return code;
    }

    /**
     * Generates the code corresponding to the connected output points
     * @param state node material build state
     * @param varName name of the variable to output
     * @returns the shader code
     */
    public writeOutputs(state: NodeMaterialBuildState, varName: string): string {
        let code = "";

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            for (const output of this._outputs) {
                if (output.hasEndpoints) {
                    code += `${state._declareOutput(output)} = ${varName}.${output.name};\n`;
                }
            }
        }

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);
        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        if (!this.texture) {
            return codeString;
        }

        if (this.texture.isCube) {
            const forcedExtension = (this.texture as CubeTexture).forcedExtension;
            codeString += `${this._codeVariableName}.texture = new BABYLON.CubeTexture("${this.texture.name}", undefined, undefined, ${
                this.texture.noMipmap
            }, null, undefined, undefined, undefined, ${this.texture._prefiltered}, ${forcedExtension ? '"' + forcedExtension + '"' : "null"});\n`;
        } else {
            codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null);\n`;
        }
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        if (this.texture && !this.texture.isRenderTarget) {
            serializationObject.texture = this.texture.serialize();
        }

        serializationObject.generateOnlyFragmentCode = this.generateOnlyFragmentCode;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            if (serializationObject.texture.isCube) {
                this.texture = CubeTexture.Parse(serializationObject.texture, scene, rootUrl);
            } else {
                this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
            }
        }

        this.generateOnlyFragmentCode = serializationObject.generateOnlyFragmentCode;

        this._setTarget();
    }
}

RegisterClass("BABYLON.ReflectionTextureBaseBlock", ReflectionTextureBaseBlock);
