import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterial } from '../../nodeMaterial';
import { _TypeStore } from '../../../../Misc/typeStore';
import { InputBlock } from '../Input/inputBlock';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { ReflectionTextureBaseBlock } from './reflectionTextureBaseBlock';

/**
 * Block used to read a reflection texture from a sampler
 */
export class ReflectionTextureBlock extends ReflectionTextureBaseBlock {
    /**
     * Create a new ReflectionTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment); // Flagging as fragment as the normal can be changed by fragment code
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);

        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionTextureBlock";
    }

    /**
     * Gets the world position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the rgb output component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the r output component
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the g output component
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the b output component
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    public autoConfigure(material: NodeMaterial) {
        super.autoConfigure(material);

        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition);

            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this.texture) {
            state.compilationString += this.writeOutputs(state, "vec3(0.)");
            return this;
        }

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            state.compilationString += this.handleVertexSide(state);
            return this;
        }

        this.handleFragmentSideInits(state);

        const normalWUnit = state._getFreeVariableName("normalWUnit");

        state.compilationString += `vec4 ${normalWUnit} = normalize(${this.worldNormal.associatedVariableName});\r\n`;

        state.compilationString += this.handleFragmentSideCodeReflectionCoords(normalWUnit);

        state.compilationString += this.handleFragmentSideCodeReflectionColor();

        state.compilationString += this.writeOutputs(state, this._reflectionColorName);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionTextureBlock"] = ReflectionTextureBlock;