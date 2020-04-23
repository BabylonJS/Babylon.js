import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { BaseTexture } from '../../../Textures/baseTexture';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Scene } from '../../../../scene';
import { InputBlock } from '../Input/inputBlock';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { Constants } from '../../../../Engines/constants';

import "../../../../Shaders/ShadersInclude/reflectionFunction";
import { CubeTexture } from '../../../Textures/cubeTexture';
import { Texture } from '../../../Textures/texture';

/**
 * Base block used to read a reflection texture from a sampler
 */
export abstract class ReflectionTextureBaseBlock extends NodeMaterialBlock {
    /** @hidden */
    public _define3DName: string;
    /** @hidden */
    public _defineCubicName: string;
    /** @hidden */
    public _defineExplicitName: string;
    /** @hidden */
    public _defineProjectionName: string;
    /** @hidden */
    public _defineLocalCubicName: string;
    /** @hidden */
    public _defineSphericalName: string;
    /** @hidden */
    public _definePlanarName: string;
    /** @hidden */
    public _defineEquirectangularName: string;
    /** @hidden */
    public _defineMirroredEquirectangularFixedName: string;
    /** @hidden */
    public _defineEquirectangularFixedName: string;
    /** @hidden */
    public _defineSkyboxName: string;
    /** @hidden */
    public _defineOppositeZ: string;
    /** @hidden */
    public _cubeSamplerName: string;
    /** @hidden */
    public _2DSamplerName: string;
    protected _positionUVWName: string;
    protected _directionWName: string;
    protected _reflectionVectorName: string;
    /** @hidden */
    public _reflectionCoordsName: string;
    /** @hidden */
    public _reflectionMatrixName: string;
    protected _reflectionColorName: string;

    /**
     * Gets or sets the texture associated with the node
     */
    public texture: Nullable<BaseTexture>;

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
    public getClassName() {
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

    public autoConfigure(material: NodeMaterial) {
        if (!this.position.isConnected) {
            let positionInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "position");

            if (!positionInput) {
                positionInput = new InputBlock("position");
                positionInput.setAsAttribute();
            }
            positionInput.output.connectTo(this.position);
        }

        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.World);

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
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
        defines.setValue(this._defineCubicName, texture.coordinatesMode === Constants.TEXTURE_CUBIC_MODE, true);
        defines.setValue(this._defineSphericalName, texture.coordinatesMode === Constants.TEXTURE_SPHERICAL_MODE, true);
        defines.setValue(this._definePlanarName, texture.coordinatesMode === Constants.TEXTURE_PLANAR_MODE, true);
        defines.setValue(this._defineProjectionName, texture.coordinatesMode === Constants.TEXTURE_PROJECTION_MODE, true);
        defines.setValue(this._defineEquirectangularName, texture.coordinatesMode === Constants.TEXTURE_EQUIRECTANGULAR_MODE, true);
        defines.setValue(this._defineEquirectangularFixedName, texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE, true);
        defines.setValue(this._defineMirroredEquirectangularFixedName, texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE, true);
    }

    public isReady() {
        const texture = this._getTexture();

        if (texture && !texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
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
    }

    /**
     * Gets the code to inject in the vertex shader
     * @param state current state of the node material building
     * @returns the shader code
     */
    public handleVertexSide(state: NodeMaterialBuildState): string {
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

        state._emitUniformFromString(this._reflectionMatrixName, "mat4");

        let code = "";

        let worldPosVaryingName = "v_" + this.worldPosition.associatedVariableName;
        if (state._emitVaryingFromString(worldPosVaryingName, "vec4")) {
            code += `${worldPosVaryingName} = ${this.worldPosition.associatedVariableName};\r\n`;
        }

        this._positionUVWName = state._getFreeVariableName("positionUVW");
        this._directionWName = state._getFreeVariableName("directionW");

        if (state._emitVaryingFromString(this._positionUVWName, "vec3", this._defineSkyboxName)) {
            code += `#ifdef ${this._defineSkyboxName}\r\n`;
            code += `${this._positionUVWName} = ${this.position.associatedVariableName}.xyz;\r\n`;
            code += `#endif\r\n`;
        }

        if (state._emitVaryingFromString(this._directionWName, "vec3", `defined(${this._defineEquirectangularFixedName}) || defined(${this._defineMirroredEquirectangularFixedName})`)) {
            code += `#if defined(${this._defineEquirectangularFixedName}) || defined(${this._defineMirroredEquirectangularFixedName})\r\n`;
            code += `${this._directionWName} = normalize(vec3(${this.world.associatedVariableName} * vec4(${this.position.associatedVariableName}.xyz, 0.0)));\r\n`;
            code += `#endif\r\n`;
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

        state._samplerDeclaration += `#ifdef ${this._define3DName}\r\n`;
        state._samplerDeclaration += `uniform samplerCube ${this._cubeSamplerName};\r\n`;
        state._samplerDeclaration += `#else\r\n`;
        state._samplerDeclaration += `uniform sampler2D ${this._2DSamplerName};\r\n`;
        state._samplerDeclaration += `#endif\r\n`;

        // Fragment
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        let comments = `//${this.name}`;
        state._emitFunction("ReciprocalPI", "#define RECIPROCAL_PI2 0.15915494", "");
        state._emitFunctionFromInclude("reflectionFunction", comments, {
            replaceStrings: [
                { search: /vec3 computeReflectionCoords/g, replace: "void DUMMYFUNC" }
            ]
        });

        this._reflectionColorName = state._getFreeVariableName("reflectionColor");
        this._reflectionVectorName = state._getFreeVariableName("reflectionUVW");
        this._reflectionCoordsName = state._getFreeVariableName("reflectionCoords");
    }

    /**
     * Generates the reflection coords code for the fragment code path
     * @param worldNormalVarName name of the world normal variable
     * @param worldPos name of the world position variable. If not provided, will use the world position connected to this block
     * @param onlyReflectionVector if true, generates code only for the reflection vector computation, not for the reflection coordinates
     * @returns the shader code
     */
    public handleFragmentSideCodeReflectionCoords(worldNormalVarName: string, worldPos?: string, onlyReflectionVector = false): string {
        if (!worldPos) {
            worldPos = `v_${this.worldPosition.associatedVariableName}`;
        }
        let reflectionMatrix = this._reflectionMatrixName;
        let direction = `normalize(${this._directionWName})`;
        let positionUVW = `${this._positionUVWName}`;
        let vEyePosition = `${this.cameraPosition.associatedVariableName}`;
        let view = `${this.view.associatedVariableName}`;

        worldNormalVarName += ".xyz";

        let code = `
            #ifdef ${this._defineMirroredEquirectangularFixedName}
                vec3 ${this._reflectionVectorName} = computeMirroredFixedEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${direction});
            #endif

            #ifdef ${this._defineEquirectangularFixedName}
                vec3 ${this._reflectionVectorName} = computeFixedEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${direction});
            #endif

            #ifdef ${this._defineEquirectangularName}
                vec3 ${this._reflectionVectorName} = computeEquirectangularCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineSphericalName}
                vec3 ${this._reflectionVectorName} = computeSphericalCoords(${worldPos}, ${worldNormalVarName}, ${view}, ${reflectionMatrix});
            #endif

            #ifdef ${this._definePlanarName}
                vec3 ${this._reflectionVectorName} = computePlanarCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineCubicName}
                #ifdef ${this._defineLocalCubicName}
                    vec3 ${this._reflectionVectorName} = computeCubicLocalCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix}, vReflectionSize, vReflectionPosition);
                #else
                vec3 ${this._reflectionVectorName} = computeCubicCoords(${worldPos}, ${worldNormalVarName}, ${vEyePosition}.xyz, ${reflectionMatrix});
                #endif
            #endif

            #ifdef ${this._defineProjectionName}
                vec3 ${this._reflectionVectorName} = computeProjectionCoords(${worldPos}, ${view}, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineSkyboxName}
                vec3 ${this._reflectionVectorName} = computeSkyBoxCoords(${positionUVW}, ${reflectionMatrix});
            #endif

            #ifdef ${this._defineExplicitName}
                vec3 ${this._reflectionVectorName} = vec3(0, 0, 0);
            #endif

            #ifdef ${this._defineOppositeZ}
                ${this._reflectionVectorName}.z *= -1.0;
            #endif\r\n`;

        if (!onlyReflectionVector) {
            code += `
                #ifdef ${this._define3DName}
                    vec3 ${this._reflectionCoordsName} = ${this._reflectionVectorName};
                #else
                    vec2 ${this._reflectionCoordsName} = ${this._reflectionVectorName}.xy;
                    #ifdef ${this._defineProjectionName}
                        ${this._reflectionCoordsName} /= ${this._reflectionVectorName}.z;
                    #endif
                    ${this._reflectionCoordsName}.y = 1.0 - ${this._reflectionCoordsName}.y;
                #endif\r\n`;
        }

        return code;
    }

    /**
     * Generates the reflection color code for the fragment code path
     * @param lodVarName name of the lod variable
     * @param swizzleLookupTexture swizzle to use for the final color variable
     * @returns the shader code
     */
    public handleFragmentSideCodeReflectionColor(lodVarName?: string, swizzleLookupTexture = ".rgb"): string {
        const colorType = "vec" + (swizzleLookupTexture.length === 0 ? "4" : (swizzleLookupTexture.length - 1));

        let code = `${colorType} ${this._reflectionColorName};
            #ifdef ${this._define3DName}\r\n`;

        if (lodVarName) {
            code += `${this._reflectionColorName} = textureCubeLodEXT(${this._cubeSamplerName}, ${this._reflectionVectorName}, ${lodVarName})${swizzleLookupTexture};\r\n`;
        } else {
            code += `${this._reflectionColorName} = textureCube(${this._cubeSamplerName}, ${this._reflectionVectorName})${swizzleLookupTexture};\r\n`;
        }

        code += `
            #else\r\n`;

        if (lodVarName) {
            code += `${this._reflectionColorName} = texture2DLodEXT(${this._2DSamplerName}, ${this._reflectionCoordsName}, ${lodVarName})${swizzleLookupTexture};\r\n`;
        } else {
            code += `${this._reflectionColorName} = texture2D(${this._2DSamplerName}, ${this._reflectionCoordsName})${swizzleLookupTexture};\r\n`;
        }

        code += `#endif\r\n`;

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
            for (var output of this._outputs) {
                if (output.hasEndpoints) {
                    code += `${this._declareOutput(output, state)} = ${varName}.${output.name};\r\n`;
                }
            }
        }

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);
        return this;
    }

    protected _dumpPropertiesCode() {
        if (!this.texture) {
            return "";
        }

        let codeString: string;

        if (this.texture.isCube) {
            codeString = `${this._codeVariableName}.texture = new BABYLON.CubeTexture("${this.texture.name}");\r\n`;
        } else {
            codeString = `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}");\r\n`;
        }
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.texture) {
            serializationObject.texture = this.texture.serialize();
        }

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
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionTextureBaseBlock"] = ReflectionTextureBaseBlock;