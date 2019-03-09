import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { Mesh } from '../../../../Meshes/mesh';
import { Effect } from '../../../effect';

/**
 * Block used to add support for scene fog
 */
export class FogBlock extends NodeMaterialBlock {
    /**
     * Create a new FogBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment, true);

        // Vertex
        this.registerInput("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("vFogDistance", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Vertex);

        // Fragment
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Color3OrColor4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogColor", NodeMaterialBlockConnectionPointTypes.Color3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogParameters", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);

        // Auto configuration
        this._inputs[1].setAsWellKnownValue(NodeMaterialWellKnownValues.View);
        this._inputs[3].setAsWellKnownValue(NodeMaterialWellKnownValues.FogColor);
        this._inputs[4].setAsWellKnownValue(NodeMaterialWellKnownValues.FogParameters);
        this._outputs[0].isVarying = true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FogBlock";
    }

    public bind(effect: Effect, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();
        effect.setColor3("fogColor", scene.fogColor);
        effect.setFloat4("fogParameters", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
    }

    /** @hidden */
    public get _canAddAtFragmentRoot(): boolean {
        return false;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state._emitFunctionFromInclude("CalcFogFactor", "fogFragmentDeclaration", {
                removeUniforms: true,
                removeVaryings: true,
                removeifDef: true,
                replaceStrings: [{ search: /float CalcFogFactor\(\)/, replace: "float CalcFogFactor(vec3 vFogDistance, vec4 vFogInfos)" }]
            });

            let tempFogVariablename = state._getFreeVariableName("fog");
            let input = this._inputs[2];
            let fogColor = this._inputs[3];
            let fogParameters = this._inputs[4];
            let output = this._outputs[1];
            let vFogDistance = this._outputs[0];

            state.compilationString += `float ${tempFogVariablename} = CalcFogFactor(${vFogDistance.associatedVariableName}, ${fogParameters.associatedVariableName});\r\n`;
            state.compilationString += this._declareOutput(output, state) + ` = ${tempFogVariablename} * ${input.associatedVariableName}.rgb + (1.0 - ${tempFogVariablename}) * ${fogColor.associatedVariableName};\r\n`;
        } else {
            let worldPos = this._inputs[0];
            let view = this._inputs[1];
            let vFogDistance = this._outputs[0];
            state.compilationString += this._declareOutput(vFogDistance, state) + ` = (${view.associatedVariableName} * ${worldPos.associatedVariableName}).xyz;\r\n`;
        }

        return this;
    }
}