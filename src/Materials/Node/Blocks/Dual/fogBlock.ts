import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { Mesh } from '../../../../Meshes/mesh';
import { Effect } from '../../../effect';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { MaterialHelper } from '../../../materialHelper';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { InputBlock } from '../Input/inputBlock';
import { _TypeStore } from '../../../../Misc/typeStore';

import "../../../../Shaders/ShadersInclude/fogFragmentDeclaration";

/**
 * Block used to add support for scene fog
 */
export class FogBlock extends NodeMaterialBlock {
    private _fogDistanceName: string;
    private _fogParameters: string;

    /**
     * Create a new FogBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment, false);

        // Vertex
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);

        // Fragment
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Color3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogColor", NodeMaterialBlockConnectionPointTypes.Color3, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);

        this.input.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
        this.fogColor.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FogBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the color input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the fog color input component
     */
    public get fogColor(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.view.isConnected) {
            let viewInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.View);

            if (!viewInput) {
                viewInput = new InputBlock("view");
                viewInput.setAsSystemValue(NodeMaterialSystemValues.View);
            }
            viewInput.output.connectTo(this.view);
        }
        if (!this.fogColor.isConnected) {
            let fogColorInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.FogColor);

            if (!fogColorInput) {
                fogColorInput = new InputBlock("fogColor", undefined, NodeMaterialBlockConnectionPointTypes.Color3);
                fogColorInput.setAsSystemValue(NodeMaterialSystemValues.FogColor);
            }
            fogColorInput.output.connectTo(this.fogColor);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        let scene = mesh.getScene();
        defines.setValue("FOG", nodeMaterial.fogEnabled && MaterialHelper.GetFogState(mesh, scene));
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();
        effect.setFloat4(this._fogParameters, scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
            state.sharedData.bindableBlocks.push(this);

            state._emitFunctionFromInclude("fogFragmentDeclaration", `//${this.name}`, {
                removeUniforms: true,
                removeVaryings: true,
                removeIfDef: false,
                replaceStrings: [{ search: /float CalcFogFactor\(\)/, replace: "float CalcFogFactor(vec3 vFogDistance, vec4 vFogInfos)" }]
            });

            let tempFogVariablename = state._getFreeVariableName("fog");
            let color = this.input;
            let fogColor = this.fogColor;
            this._fogParameters = state._getFreeVariableName("fogParameters");
            let output = this._outputs[0];

            state._emitUniformFromString(this._fogParameters, "vec4");

            state.compilationString += `#ifdef FOG\r\n`;
            state.compilationString += `float ${tempFogVariablename} = CalcFogFactor(${this._fogDistanceName}, ${this._fogParameters});\r\n`;
            state.compilationString += this._declareOutput(output, state) + ` = ${tempFogVariablename} * ${color.associatedVariableName}.rgb + (1.0 - ${tempFogVariablename}) * ${fogColor.associatedVariableName}.rgb;\r\n`;
            state.compilationString += `#else\r\n${this._declareOutput(output, state)} =  ${color.associatedVariableName}.rgb;\r\n`;
            state.compilationString += `#endif\r\n`;
        } else {
            let worldPos = this.worldPosition;
            let view = this.view;
            this._fogDistanceName = state._getFreeVariableName("vFogDistance");
            state._emitVaryingFromString(this._fogDistanceName, "vec3");
            state.compilationString += `${this._fogDistanceName} = (${view.associatedVariableName} * ${worldPos.associatedVariableName}).xyz;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FogBlock"] = FogBlock;