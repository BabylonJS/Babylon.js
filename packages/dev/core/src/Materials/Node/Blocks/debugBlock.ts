import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to render intermediate debug values
 * Please note that the node needs to be active to be generated in the shader
 * Only one DebugBlock should be active at a time
 */
export class NodeMaterialDebugBlock extends NodeMaterialBlock {
    /**
     * Creates a new NodeMaterialDebugBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("debug", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);

        this.debug.excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the rgba input component
     */
    public get debug(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeMaterialDebugBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let outputString = "gl_FragColor";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            outputString = "fragmentOutputs.color";
        }

        state.compilationString += `${outputString} = vec4${state.fSuffix}(1., 0., 0., 1.);\n`;

        return this;
    }
}

RegisterClass("BABYLON.NodeMaterialDebugBlock", NodeMaterialDebugBlock);
