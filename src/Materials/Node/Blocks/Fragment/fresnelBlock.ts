import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to compute fresnel value
 */
export class FresnelBlock extends NodeMaterialBlock {

    /**
     * Create a new FresnelBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("bias", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("power", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("fresnel", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FresnelBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
    * Gets the bias input component
    */
    public get bias(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get power(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the fresnel output component
     */
    public get fresnel(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let comments = `//${this.name}`;

        let worldPos = this.worldPosition;
        let worldNormal = this.worldNormal;
        let worldPosVaryingName = "v_" + worldPos.associatedVariableName;
        let worldNormalVaryingName = "v_" + worldNormal.associatedVariableName;

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Inject code in vertex
            if (state._emitVaryingFromString(worldPosVaryingName, "vec3")) {
                state.compilationString += `${worldPosVaryingName} = ${worldPos.associatedVariableName}.xyz;\r\n`;
            }

            if (state._emitVaryingFromString(worldNormalVaryingName, "vec3")) {
                state.compilationString += `${worldNormalVaryingName} = ${worldNormal.associatedVariableName}.xyz;\r\n`;
            }

            return;
        }

        state._emitFunctionFromInclude("fresnelFunction", comments);

        if (state._registerTempVariable("viewDirectionW")) {
            state.compilationString += `vec3 viewDirectionW = normalize(${this.cameraPosition.associatedVariableName} - ${worldPosVaryingName});\r\n`;
        }
        state.compilationString += this._declareOutput(this.fresnel, state) + ` = computeFresnelTerm(viewDirectionW, ${worldNormalVaryingName}, ${this.bias.associatedVariableName}, ${this.power.associatedVariableName});;\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FresnelBlock"] = FresnelBlock;