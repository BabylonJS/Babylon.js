import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Effect } from "../../../effect";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { InputBlock } from "../Input/inputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

import { GetFogState } from "core/Materials/materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

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
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("fogColor", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);

        this.input.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Color4
        );
        this.fogColor.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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

    public override initialize(state: NodeMaterialBuildState) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await import("../../../../ShadersWGSL/ShadersInclude/fogFragmentDeclaration");
        } else {
            await import("../../../../Shaders/ShadersInclude/fogFragmentDeclaration");
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.view.isConnected) {
            let viewInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.View && additionalFilteringInfo(b));

            if (!viewInput) {
                viewInput = new InputBlock("view");
                viewInput.setAsSystemValue(NodeMaterialSystemValues.View);
            }
            viewInput.output.connectTo(this.view);
        }
        if (!this.fogColor.isConnected) {
            let fogColorInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.FogColor && additionalFilteringInfo(b));

            if (!fogColorInput) {
                fogColorInput = new InputBlock("fogColor", undefined, NodeMaterialBlockConnectionPointTypes.Color3);
                fogColorInput.setAsSystemValue(NodeMaterialSystemValues.FogColor);
            }
            fogColorInput.output.connectTo(this.fogColor);
        }
    }

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial, mesh?: AbstractMesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();
        defines.setValue("FOG", nodeMaterial.fogEnabled && GetFogState(mesh, scene));
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();
        effect.setFloat4(this._fogParameters, scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
            state.sharedData.bindableBlocks.push(this);

            let replaceStrings = [];
            let prefix1 = "";
            let prefix2 = "";

            if (state.shaderLanguage === ShaderLanguage.WGSL) {
                replaceStrings = [
                    { search: /fn CalcFogFactor\(\)/, replace: "fn CalcFogFactor(vFogDistance: vec3f, vFogInfos: vec4f)" },
                    { search: /uniforms.vFogInfos/g, replace: "vFogInfos" },
                    { search: /fragmentInputs.vFogDistance/g, replace: "vFogDistance" },
                ];

                prefix1 = "fragmentInputs.";
                prefix2 = "uniforms.";
            } else {
                replaceStrings = [{ search: /float CalcFogFactor\(\)/, replace: "float CalcFogFactor(vec3 vFogDistance, vec4 vFogInfos)" }];
            }

            state._emitFunctionFromInclude("fogFragmentDeclaration", `//${this.name}`, {
                removeUniforms: true,
                removeVaryings: true,
                removeIfDef: false,
                replaceStrings: replaceStrings,
            });

            const tempFogVariablename = state._getFreeVariableName("fog");
            const color = this.input;
            const fogColor = this.fogColor;
            this._fogParameters = state._getFreeVariableName("fogParameters");
            const output = this._outputs[0];

            state._emitUniformFromString(this._fogParameters, NodeMaterialBlockConnectionPointTypes.Vector4);

            state.compilationString += `#ifdef FOG\n`;
            state.compilationString += `${state._declareLocalVar(tempFogVariablename, NodeMaterialBlockConnectionPointTypes.Float)} = CalcFogFactor(${prefix1}${this._fogDistanceName}, ${prefix2}${this._fogParameters});\n`;
            state.compilationString +=
                state._declareOutput(output) +
                ` = ${tempFogVariablename} * ${color.associatedVariableName}.rgb + (1.0 - ${tempFogVariablename}) * ${fogColor.associatedVariableName}.rgb;\n`;
            state.compilationString += `#else\n${state._declareOutput(output)} =  ${color.associatedVariableName}.rgb;\n`;
            state.compilationString += `#endif\n`;
        } else {
            const worldPos = this.worldPosition;
            const view = this.view;
            this._fogDistanceName = state._getFreeVariableName("vFogDistance");
            state._emitVaryingFromString(this._fogDistanceName, NodeMaterialBlockConnectionPointTypes.Vector3);
            const prefix = state.shaderLanguage === ShaderLanguage.WGSL ? "vertexOutputs." : "";
            state.compilationString += `${prefix}${this._fogDistanceName} = (${view.associatedVariableName} * ${worldPos.associatedVariableName}).xyz;\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.FogBlock", FogBlock);
