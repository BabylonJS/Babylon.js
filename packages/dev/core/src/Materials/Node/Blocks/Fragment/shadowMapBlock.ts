import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

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
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Vector3);

        this.worldNormal.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ShadowMapBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vPositionWSM");
        state._excludeVariableName("lightDataSM");
        state._excludeVariableName("biasAndScaleSM");
        state._excludeVariableName("depthValuesSM");
        state._excludeVariableName("clipPos");
        state._excludeVariableName("worldPos");
        state._excludeVariableName("zSM");
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/shadowMapVertexMetric"),
                import("../../../../ShadersWGSL/ShadersInclude/packingFunctions"),
                import("../../../../ShadersWGSL/ShadersInclude/shadowMapFragment"),
            ]);
        } else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/shadowMapVertexMetric"),
                import("../../../../Shaders/ShadersInclude/packingFunctions"),
                import("../../../../Shaders/ShadersInclude/shadowMapFragment"),
            ]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
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

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const comments = `//${this.name}`;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        state._emitUniformFromString("biasAndScaleSM", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("lightDataSM", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("depthValuesSM", NodeMaterialBlockConnectionPointTypes.Vector2);

        state._emitFunctionFromInclude("packingFunctions", comments);

        state.compilationString += `${state._declareLocalVar("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.worldPosition.associatedVariableName};\n`;
        state.compilationString += `${state._declareLocalVar("vPositionWSM", NodeMaterialBlockConnectionPointTypes.Vector3)};\n`;
        state.compilationString += `${state._declareLocalVar("vDepthMetricSM", NodeMaterialBlockConnectionPointTypes.Float)} = 0.0;\n`;
        state.compilationString += `${state._declareLocalVar("zSM", NodeMaterialBlockConnectionPointTypes.Float)};\n`;

        if (this.worldNormal.isConnected) {
            state.compilationString += `${state._declareLocalVar("vNormalW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this.worldNormal.associatedVariableName}.xyz;\n`;
            state.compilationString += state._emitCodeFromInclude("shadowMapVertexNormalBias", comments);
        }

        state.compilationString += `${state._declareLocalVar("clipPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.viewProjection.associatedVariableName} * worldPos;\n`;

        state.compilationString += state._emitCodeFromInclude("shadowMapVertexMetric", comments, {
            replaceStrings: [
                {
                    search: /gl_Position/g,
                    replace: "clipPos",
                },
                {
                    search: /vertexOutputs.position/g,
                    replace: "clipPos",
                },
                {
                    search: /vertexOutputs\.vDepthMetricSM/g,
                    replace: "vDepthMetricSM",
                },
            ],
        });

        state.compilationString += state._emitCodeFromInclude("shadowMapFragment", comments, {
            replaceStrings: [
                {
                    search: /return;/g,
                    replace: "",
                },
                {
                    search: /fragmentInputs\.vDepthMetricSM/g,
                    replace: "vDepthMetricSM",
                },
            ],
        });
        const output = isWebGPU ? "fragmentOutputs.fragDepth" : "gl_FragDepth";
        state.compilationString += `
            #if SM_DEPTHTEXTURE == 1
                #ifdef IS_NDC_HALF_ZRANGE
                    ${output} = (clipPos.z / clipPos.w);
                #else
                    ${output} = (clipPos.z / clipPos.w) * 0.5 + 0.5;
                #endif
            #endif
        `;

        state.compilationString += `${state._declareOutput(this.depth)} = vec3${state.fSuffix}(depthSM, 1., 1.);\n`;

        return this;
    }
}

RegisterClass("BABYLON.ShadowMapBlock", ShadowMapBlock);
