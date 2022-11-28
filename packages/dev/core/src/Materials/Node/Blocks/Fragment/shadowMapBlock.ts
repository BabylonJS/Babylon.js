import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to output the depth to a shadow map
 */
export class ShadowMapBlock extends NodeMaterialBlock {
    /**
     * Create a new ShadowMapBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("viewProjection", NodeMaterialBlockConnectionPointTypes.Matrix, false);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector3, true);
        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Vector3);

        this.worldNormal.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ShadowMapBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vPositionWSM");
        state._excludeVariableName("lightDataSM");
        state._excludeVariableName("biasAndScaleSM");
        state._excludeVariableName("depthValuesSM");
        state._excludeVariableName("clipPos");
        state._excludeVariableName("worldPos");
        state._excludeVariableName("zSM");
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the view x projection input component
     */
    public get viewProjection(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the depth output component
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const comments = `//${this.name}`;

        state._emitUniformFromString("biasAndScaleSM", "vec3");
        state._emitUniformFromString("lightDataSM", "vec3");
        state._emitUniformFromString("depthValuesSM", "vec2");

        state._emitFunctionFromInclude("packingFunctions", comments);

        state.compilationString += `vec4 worldPos = ${this.worldPosition.associatedVariableName};\r\n`;
        state.compilationString += `vec3 vPositionWSM;\r\n`;
        state.compilationString += `float vDepthMetricSM = 0.0;\r\n`;
        state.compilationString += `float zSM;\r\n`;

        if (this.worldNormal.isConnected) {
            state.compilationString += `vec3 vNormalW = ${this.worldNormal.associatedVariableName}.xyz;\r\n`;
            state.compilationString += state._emitCodeFromInclude("shadowMapVertexNormalBias", comments);
        }

        state.compilationString += `vec4 clipPos = ${this.viewProjection.associatedVariableName} * worldPos;\r\n`;

        state.compilationString += state._emitCodeFromInclude("shadowMapVertexMetric", comments, {
            replaceStrings: [
                {
                    search: /gl_Position/g,
                    replace: "clipPos",
                },
            ],
        });

        state.compilationString += state._emitCodeFromInclude("shadowMapFragment", comments, {
            replaceStrings: [
                {
                    search: /return;/g,
                    replace: "",
                },
            ],
        });

        state.compilationString += `
            #if SM_DEPTHTEXTURE == 1
                #ifdef IS_NDC_HALF_ZRANGE
                    gl_FragDepth = (clipPos.z / clipPos.w);
                #else
                    gl_FragDepth = (clipPos.z / clipPos.w) * 0.5 + 0.5;
                #endif
            #endif
        `;

        state.compilationString += `${this._declareOutput(this.depth, state)} = vec3(depthSM, 1., 1.);\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.ShadowMapBlock", ShadowMapBlock);
