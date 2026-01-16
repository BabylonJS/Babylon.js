import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { Effect } from "../../../effect";
import type { Mesh } from "../../../../Meshes/mesh";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";

import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to add image processing support to fragment shader
 */
export class ImageProcessingBlock extends NodeMaterialBlock {
    /**
     * Create a new ImageProcessingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color4);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 |
                NodeMaterialBlockConnectionPointTypes.Color4 |
                NodeMaterialBlockConnectionPointTypes.Vector3 |
                NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Defines if the input should be converted to linear space (default: true)
     */
    @editableInPropertyPage("Convert input to linear space", PropertyTypeForEdition.Boolean, "ADVANCED")
    public convertInputToLinearSpace: boolean = true;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ImageProcessingBlock";
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("exposureLinear");
        state._excludeVariableName("contrast");
        state._excludeVariableName("vInverseScreenSize");
        state._excludeVariableName("vignetteSettings1");
        state._excludeVariableName("vignetteSettings2");
        state._excludeVariableName("vCameraColorCurveNegative");
        state._excludeVariableName("vCameraColorCurveNeutral");
        state._excludeVariableName("vCameraColorCurvePositive");
        state._excludeVariableName("txColorTransform");
        state._excludeVariableName("colorTransformSettings");
        state._excludeVariableName("ditherIntensity");
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/helperFunctions"),
                import("../../../../ShadersWGSL/ShadersInclude/imageProcessingDeclaration"),
                import("../../../../ShadersWGSL/ShadersInclude/imageProcessingFunctions"),
            ]);
        } else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/helperFunctions"),
                import("../../../../Shaders/ShadersInclude/imageProcessingDeclaration"),
                import("../../../../Shaders/ShadersInclude/imageProcessingFunctions"),
            ]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    public override isReady(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            if (!nodeMaterial.imageProcessingConfiguration.isReady()) {
                return false;
            }
        }
        return true;
    }

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial) {
        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            nodeMaterial.imageProcessingConfiguration.prepareDefines(defines);
        }
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        if (!nodeMaterial.imageProcessingConfiguration) {
            return;
        }

        nodeMaterial.imageProcessingConfiguration.bind(effect);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Register for blocking
        state.sharedData.blockingBlocks.push(this);

        // Register for binding
        state.sharedData.bindableBlocks.push(this);

        // Uniforms
        state.uniforms.push("exposureLinear");
        state.uniforms.push("contrast");
        state.uniforms.push("vInverseScreenSize");
        state.uniforms.push("vignetteSettings1");
        state.uniforms.push("vignetteSettings2");
        state.uniforms.push("vCameraColorCurveNegative");
        state.uniforms.push("vCameraColorCurveNeutral");
        state.uniforms.push("vCameraColorCurvePositive");
        state.uniforms.push("txColorTransform");
        state.uniforms.push("colorTransformSettings");
        state.uniforms.push("ditherIntensity");

        // Emit code
        const color = this.color;
        const output = this._outputs[0];
        const comments = `//${this.name}`;
        const overrideText = state.shaderLanguage === ShaderLanguage.WGSL ? "Vec3" : "";

        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitFunctionFromInclude("imageProcessingDeclaration", comments);
        state._emitFunctionFromInclude("imageProcessingFunctions", comments);

        if (color.connectedPoint?.isConnected) {
            const isVec4Input =
                color.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Color4 || color.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4;
            // For vec3 inputs (Color3/Vector3), use 1.0 for alpha since they have no .a component
            const alpha = isVec4Input ? `${color.associatedVariableName}.a` : "1.0";

            if (isVec4Input) {
                state.compilationString += `${state._declareOutput(output)} = ${color.associatedVariableName};\n`;
            } else {
                state.compilationString += `${state._declareOutput(output)} = vec4${state.fSuffix}(${color.associatedVariableName}, 1.0);\n`;
            }
            state.compilationString += `#ifdef IMAGEPROCESSINGPOSTPROCESS\n`;
            if (this.convertInputToLinearSpace) {
                state.compilationString += `${output.associatedVariableName} = vec4${state.fSuffix}(toLinearSpace${overrideText}(${color.associatedVariableName}.rgb), ${alpha});\n`;
            }
            state.compilationString += `#else\n`;
            state.compilationString += `#ifdef IMAGEPROCESSING\n`;
            if (this.convertInputToLinearSpace) {
                state.compilationString += `${output.associatedVariableName} = vec4${state.fSuffix}(toLinearSpace${overrideText}(${color.associatedVariableName}.rgb), ${alpha});\n`;
            }
            state.compilationString += `${output.associatedVariableName} = applyImageProcessing(${output.associatedVariableName});\n`;
            state.compilationString += `#endif\n`;
            state.compilationString += `#endif\n`;

            if (this.rgb.hasEndpoints) {
                state.compilationString += state._declareOutput(this.rgb) + ` = ${this.output.associatedVariableName}.xyz;\n`;
            }
        }

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.convertInputToLinearSpace = ${this.convertInputToLinearSpace};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertInputToLinearSpace = this.convertInputToLinearSpace;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertInputToLinearSpace = serializationObject.convertInputToLinearSpace ?? true;
    }
}

RegisterClass("BABYLON.ImageProcessingBlock", ImageProcessingBlock);
