import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to output values on the prepass textures
 * #WW65SN#9
 */
export class PrePassOutputBlock extends NodeMaterialBlock {
    /**
     * Create a new PrePassOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("viewDepth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("screenDepth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("localPosition", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("viewNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("reflectivity", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);

        this.inputs[2].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
        this.inputs[3].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
        this.inputs[4].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
        this.inputs[5].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
        this.inputs[6].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector3 |
                NodeMaterialBlockConnectionPointTypes.Vector4 |
                NodeMaterialBlockConnectionPointTypes.Color3 |
                NodeMaterialBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PrePassOutputBlock";
    }

    /**
     * Gets the view depth component
     */
    public get viewDepth(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the screen depth component
     */
    public get screenDepth(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world position component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the position in local space component
     */
    public get localPosition(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the view normal component
     */
    public get viewNormal(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the world normal component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the reflectivity component
     */
    public get reflectivity(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    private _getFragData(isWebGPU: boolean, index: number) {
        return isWebGPU ? `fragmentOutputs.fragData${index}` : `gl_FragData[${index}]`;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const worldPosition = this.worldPosition;
        const localPosition = this.localPosition;
        const viewNormal = this.viewNormal;
        const worldNormal = this.worldNormal;
        const viewDepth = this.viewDepth;
        const reflectivity = this.reflectivity;
        const screenDepth = this.screenDepth;

        state.sharedData.blocksWithDefines.push(this);

        const comments = `//${this.name}`;
        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        state._emitFunctionFromInclude("helperFunctions", comments);

        state.compilationString += `#if defined(PREPASS)\r\n`;
        state.compilationString += isWebGPU ? `var fragData: array<vec4<f32>, SCENE_MRT_COUNT>;\r\n` : `vec4 fragData[SCENE_MRT_COUNT];\r\n`;

        state.compilationString += `#ifdef PREPASS_DEPTH\r\n`;
        if (viewDepth.connectedPoint) {
            state.compilationString += ` fragData[PREPASS_DEPTH_INDEX] = ${vec4}(${viewDepth.associatedVariableName}, 0.0, 0.0, 1.0);\r\n`;
        } else {
            // We have to write something on the viewDepth output or it will raise a gl error
            state.compilationString += ` fragData[PREPASS_DEPTH_INDEX] = ${vec4}(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_SCREENSPACE_DEPTH\r\n`;
        if (screenDepth.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4(${screenDepth.associatedVariableName}, 0.0, 0.0, 1.0);\r\n`;
        } else {
            // We have to write something on the viewDepth output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_SCREENSPACE_DEPTH_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_POSITION\r\n`;
        if (worldPosition.connectedPoint) {
            state.compilationString += `fragData[PREPASS_POSITION_INDEX] = ${vec4}(${worldPosition.associatedVariableName}.rgb, ${
                worldPosition.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? worldPosition.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the position output or it will raise a gl error
            state.compilationString += ` fragData[PREPASS_POSITION_INDEX] = ${vec4}(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_LOCAL_POSITION\r\n`;
        if (localPosition.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_LOCAL_POSITION_INDEX] = vec4(${localPosition.associatedVariableName}.rgb, ${
                localPosition.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? localPosition.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the position output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_LOCAL_POSITION_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_NORMAL\r\n`;
        if (viewNormal.connectedPoint) {
            state.compilationString += ` fragData[PREPASS_NORMAL_INDEX] = ${vec4}(${viewNormal.associatedVariableName}.rgb, ${
                viewNormal.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? viewNormal.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the normal output or it will raise a gl error
            state.compilationString += ` fragData[PREPASS_NORMAL_INDEX] = ${vec4}(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_WORLD_NORMAL\r\n`;
        if (worldNormal.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_WORLD_NORMAL_INDEX] = vec4(${worldNormal.associatedVariableName}.rgb, ${
                worldNormal.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? worldNormal.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the normal output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_WORLD_NORMAL_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_REFLECTIVITY\r\n`;
        if (reflectivity.connectedPoint) {
            state.compilationString += ` fragData[PREPASS_REFLECTIVITY_INDEX] = ${vec4}(${reflectivity.associatedVariableName}.rgb, ${
                reflectivity.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? reflectivity.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the reflectivity output or it will raise a gl error
            state.compilationString += ` fragData[PREPASS_REFLECTIVITY_INDEX] = ${vec4}(0.0, 0.0, 0.0, 1.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;

        state.compilationString += `#if SCENE_MRT_COUNT > 1\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 1)} = fragData[1];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 2\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 2)} = fragData[2];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 3\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 3)} = fragData[3];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 4\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 4)} = fragData[4];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 5\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 5)} = fragData[5];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 6\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 6)} = fragData[6];\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#if SCENE_MRT_COUNT > 7\r\n`;
        state.compilationString += `${this._getFragData(isWebGPU, 7)} = fragData[7];\r\n`;
        state.compilationString += `#endif\r\n`;

        state.compilationString += `#endif\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.PrePassOutputBlock", PrePassOutputBlock);
