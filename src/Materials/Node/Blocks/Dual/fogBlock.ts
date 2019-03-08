import { NodeMaterialBlock, NodeMaterialBlockTargets } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';

/**
 * Block used to add support for scene fog
 */
export class FogBlock extends NodeMaterialBlock {
    /**
     * Create a new FogBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        // Vertex
        this.registerInput("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("vFogDistance", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Vertex);

        // Fragment
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Color3OrColor4, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogColor", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogParameters", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);

        // Auto configuration
        this._inputs[1].setAsWellKnownValue(NodeMaterialWellKnownValues.View);
        this._inputs[3].setAsWellKnownValue(NodeMaterialWellKnownValues.FogColor);
        this._inputs[4].setAsWellKnownValue(NodeMaterialWellKnownValues.FogParameters);
        this._outputs[0].isVarying = true;
    }

    /** @hidden */
    public get _canAddAtFragmentRoot(): boolean {
        return false;
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state._emitFunction("CalcFogFactor",
                `
                    #define FOGMODE_NONE    0.
                    #define FOGMODE_EXP     1.
                    #define FOGMODE_EXP2    2.
                    #define FOGMODE_LINEAR  3.
                    #define E 2.71828

                    float CalcFogFactor(vec3 vFogDistance, vec4 fogInfos)
                    {
                        float fogCoeff = 1.0;
                        float fogStart = fogInfos.y;
                        float fogEnd = fogInfos.z;
                        float fogDensity = fogInfos.w;
                        float fogDistance = length(vFogDistance);

                        if (FOGMODE_LINEAR == fogInfos.x)
                        {
                            fogCoeff = (fogEnd - fogDistance) / (fogEnd - fogStart);
                        }
                        else if (FOGMODE_EXP == fogInfos.x)
                        {
                            fogCoeff = 1.0 / pow(E, fogDistance * fogDensity);
                        }
                        else if (FOGMODE_EXP2 == fogInfos.x)
                        {
                            fogCoeff = 1.0 / pow(E, fogDistance * fogDistance * fogDensity * fogDensity);
                        }

                        return clamp(fogCoeff, 0.0, 1.0);
                    }
                `);

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