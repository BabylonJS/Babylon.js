import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Logger } from "core/Misc/logger";
/**
 * Block used to write the fragment depth
 */
export class FragDepthBlock extends NodeMaterialBlock {
    /**
     * Create a new FragDepthBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("depth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("viewProjection", NodeMaterialBlockConnectionPointTypes.Matrix, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragDepthBlock";
    }

    /**
     * Gets the depth input component
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the worldPos input component
     */
    public get worldPos(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the viewProjection input component
     */
    public get viewProjection(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.depth.isConnected) {
            state.compilationString += `gl_FragDepth = ${this.depth.associatedVariableName};\n`;
        } else if (this.worldPos.isConnected && this.viewProjection.isConnected) {
            state.compilationString += `
                vec4 p = ${this.viewProjection.associatedVariableName} * ${this.worldPos.associatedVariableName};
                float v = p.z / p.w;
                #ifndef IS_NDC_HALF_ZRANGE
                    v = v * 0.5 + 0.5;
                #endif
                gl_FragDepth = v;
    
            `;
        } else {
            Logger.Warn("FragDepthBlock: either the depth input or both the worldPos and viewProjection inputs must be connected!");
        }

        return this;
    }
}

RegisterClass("BABYLON.FragDepthBlock", FragDepthBlock);
