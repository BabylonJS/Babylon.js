import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to output values on the prepass textures
 */
export class PrePassOutputBlock extends NodeMaterialBlock {
    /**
     * Create a new PrePassOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("viewDepth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("viewNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);

        this.inputs[1].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
        this.inputs[2].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PrePassOutputBlock";
    }

    /**
     * Gets the view depth component
     */
    public get viewDepth(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world position component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the view normal component
     */
    public get viewNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const worldPosition = this.worldPosition;
        const viewNormal = this.viewNormal;
        const viewDepth = this.viewDepth;

        state.sharedData.blocksWithDefines.push(this);

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        state.compilationString += `#if defined(PREPASS)\r\n`;
        state.compilationString += `#ifdef PREPASS_DEPTH\r\n`;
        if (viewDepth.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_DEPTH_INDEX] = vec4(${viewDepth.associatedVariableName}, 0.0, 0.0, 1.0);\r\n`;
        } else {
            // We have to write something on the viewDepth output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_DEPTH_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_POSITION\r\n`;
        if (worldPosition.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_POSITION_INDEX] = vec4(${worldPosition.associatedVariableName}.rgb, ${
                worldPosition.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? worldPosition.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the position output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_POSITION_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef PREPASS_NORMAL\r\n`;
        if (viewNormal.connectedPoint) {
            state.compilationString += ` gl_FragData[PREPASS_NORMAL_INDEX] = vec4(${viewNormal.associatedVariableName}.rgb, ${
                viewNormal.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? viewNormal.associatedVariableName + ".a" : "1.0"
            });\r\n`;
        } else {
            // We have to write something on the normal output or it will raise a gl error
            state.compilationString += ` gl_FragData[PREPASS_NORMAL_INDEX] = vec4(0.0, 0.0, 0.0, 0.0);\r\n`;
        }
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#endif\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.PrePassOutputBlock", PrePassOutputBlock);

