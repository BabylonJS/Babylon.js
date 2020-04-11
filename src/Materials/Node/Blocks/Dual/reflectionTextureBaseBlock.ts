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
 * Block used to read a reflection texture from a sampler
 */
export abstract class ReflectionTextureBaseBlock extends NodeMaterialBlock {
    private _define3DName: string;
    private _defineCubicName: string;
    private _defineExplicitName: string;
    private _defineProjectionName: string;
    private _defineLocalCubicName: string;
    private _defineSphericalName: string;
    private _definePlanarName: string;
    private _defineEquirectangularName: string;
    private _defineMirroredEquirectangularFixedName: string;
    private _defineEquirectangularFixedName: string;
    private _defineSkyboxName: string;
    private _cubeSamplerName: string;
    private _2DSamplerName: string;
    private _positionUVWName: string;
    private _directionWName: string;
    private _reflectionCoordsName: string;
    private _reflection2DCoordsName: string;
    private _reflectionMatrixName: string;

    protected _reflectionColorName: string;

    /**
     * Gets or sets the texture associated with the node
     */
    public texture: Nullable<BaseTexture>;

    /**
     * Create a new TextureBlock
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

        if (!this.texture || !this.texture.getTextureMatrix) {
            return;
        }

        defines.setValue(this._define3DName, this.texture.isCube);
        defines.setValue(this._defineLocalCubicName, (<any>this.texture).boundingBoxSize ? true : false);
        defines.setValue(this._defineExplicitName, this.texture.coordinatesMode === Constants.TEXTURE_EXPLICIT_MODE);
        defines.setValue(this._defineSkyboxName, this.texture.coordinatesMode === Constants.TEXTURE_SKYBOX_MODE);
        defines.setValue(this._defineCubicName, this.texture.coordinatesMode === Constants.TEXTURE_CUBIC_MODE);
        defines.setValue(this._defineSphericalName, this.texture.coordinatesMode === Constants.TEXTURE_SPHERICAL_MODE);
        defines.setValue(this._definePlanarName, this.texture.coordinatesMode === Constants.TEXTURE_PLANAR_MODE);
        defines.setValue(this._defineProjectionName, this.texture.coordinatesMode === Constants.TEXTURE_PROJECTION_MODE);
        defines.setValue(this._defineEquirectangularName, this.texture.coordinatesMode === Constants.TEXTURE_EQUIRECTANGULAR_MODE);
        defines.setValue(this._defineEquirectangularFixedName, this.texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE);
        defines.setValue(this._defineMirroredEquirectangularFixedName, this.texture.coordinatesMode === Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE);
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh || !this.texture) {
            return;
        }

        effect.setMatrix(this._reflectionMatrixName, this.texture.getReflectionTextureMatrix());

        if (this.texture.isCube) {
            effect.setTexture(this._cubeSamplerName, this.texture);
        } else {
            effect.setTexture(this._2DSamplerName, this.texture);
        }
    }

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
        state._emitFunctionFromInclude("reflectionFunction", comments);

        this._reflectionColorName = state._getFreeVariableName("reflectionColor");
        this._reflectionCoordsName = state._getFreeVariableName("reflectionUVW");
        this._reflection2DCoordsName = state._getFreeVariableName("reflectionUV");
        this._reflectionMatrixName = state._getFreeVariableName("reflectionMatrix");

        state._emitUniformFromString(this._reflectionMatrixName, "mat4");
    }

    public handleFragmentSideCodeReflectionCoords(): string {
        let worldPos = `v_${this.worldPosition.associatedVariableName}`;
        let worldNormal = this.worldNormal.associatedVariableName + ".xyz";
        let reflectionMatrix = this._reflectionMatrixName;
        let direction = `normalize(${this._directionWName})`;
        let positionUVW = `${this._positionUVWName}`;
        let vEyePosition = `${this.cameraPosition.associatedVariableName}`;
        let view = `${this.view.associatedVariableName}`;

        let code = "";

        code += `vec3 ${this._reflectionColorName};\r\n`;
        code += `#ifdef ${this._defineMirroredEquirectangularFixedName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeMirroredFixedEquirectangularCoords(${worldPos}, ${worldNormal}, ${direction});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineEquirectangularFixedName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeFixedEquirectangularCoords(${worldPos}, ${worldNormal}, ${direction});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineEquirectangularName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeEquirectangularCoords(${worldPos}, ${worldNormal}, ${vEyePosition}.xyz, ${reflectionMatrix});\r\n`;
        code += ` #endif\r\n`;

        code += `#ifdef ${this._defineSphericalName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeSphericalCoords(${worldPos}, ${worldNormal}, ${view}, ${reflectionMatrix});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._definePlanarName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computePlanarCoords(${worldPos}, ${worldNormal}, ${vEyePosition}.xyz, ${reflectionMatrix});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineCubicName}\r\n`;
        code += `    #ifdef ${this._defineLocalCubicName}\r\n`;
        code += `        vec3 ${this._reflectionCoordsName} = computeCubicLocalCoords(${worldPos}, ${worldNormal}, ${vEyePosition}.xyz, ${reflectionMatrix}, vReflectionSize, vReflectionPosition);\r\n`;
        code += `    #else\r\n`;
        code += `       vec3 ${this._reflectionCoordsName} = computeCubicCoords(${worldPos}, ${worldNormal}, ${vEyePosition}.xyz, ${reflectionMatrix});\r\n`;
        code += `    #endif\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineProjectionName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeProjectionCoords(${worldPos}, ${view}, ${reflectionMatrix});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineSkyboxName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = computeSkyBoxCoords(${positionUVW}, ${reflectionMatrix});\r\n`;
        code += `#endif\r\n`;

        code += `#ifdef ${this._defineExplicitName}\r\n`;
        code += `    vec3 ${this._reflectionCoordsName} = vec3(0, 0, 0);\r\n`;
        code += `#endif\r\n`;

        return code;
    }

    public handleFragmentSideCodeReflectionColor(): string {
        let code = "";

        code += `#ifdef ${this._define3DName}\r\n`;
        code += `${this._reflectionColorName} = textureCube(${this._cubeSamplerName}, ${this._reflectionCoordsName}).rgb;\r\n`;
        code += `#else\r\n`;
        code += `vec2 ${this._reflection2DCoordsName} = ${this._reflectionCoordsName}.xy;\r\n`;

        code += `#ifdef ${this._defineProjectionName}\r\n`;
        code += `${this._reflection2DCoordsName} /= ${this._reflectionCoordsName}.z;\r\n`;
        code += `#endif\r\n`;

        code += `${this._reflection2DCoordsName}.y = 1.0 - ${this._reflection2DCoordsName}.y;\r\n`;
        code += `${this._reflectionColorName} = texture2D(${this._2DSamplerName}, ${this._reflection2DCoordsName}).rgb;\r\n`;
        code += `#endif\r\n`;

        return code;
    }

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