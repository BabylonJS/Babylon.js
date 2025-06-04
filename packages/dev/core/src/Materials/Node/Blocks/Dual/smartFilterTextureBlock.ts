import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { NodeMaterialModes } from "../../Enums/nodeMaterialModes";
import { CurrentScreenBlock } from "./currentScreenBlock";
import { RegisterClass } from "core/Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import type { NodeMaterialBlock } from "../../nodeMaterialBlock";
import type { NodeMaterial } from "../../nodeMaterial";
import { ScreenSizeBlock } from "../Fragment/screenSizeBlock";
import { Logger } from "core/Misc/logger";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { Scene } from "core/scene";

/** @internal */
export const SfeModeDefine = "USE_SFE_FRAMEWORK";

/**
 * Base block used for creating Smart Filter shader blocks for the SFE framework.
 * This block extends the functionality of CurrentScreenBlock, as both are used
 * to represent arbitrary 2D textures to compose, and work similarly.
 */
export class SmartFilterTextureBlock extends CurrentScreenBlock {
    /**
     * A boolean indicating whether this block should be the main input for the SFE pipeline.
     * If true, it can be used in SFE for auto-disabling.
     */
    @editableInPropertyPage("Is Main Input", PropertyTypeForEdition.Boolean, undefined, { notifiers: { rebuild: true } })
    public isMainInput: boolean = false;

    /**
     * Create a new SmartFilterTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SmartFilterTextureBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        super.initialize(state);

        this._samplerName = state._getFreeVariableName(this.name);

        if (state.sharedData.nodeMaterial.mode !== NodeMaterialModes.SFE) {
            Logger.Error("SmartFilterTextureBlock: Should not be used outside of SFE mode.");
        }

        if (state.sharedData.nodeMaterial.shaderLanguage !== ShaderLanguage.GLSL) {
            Logger.Error("SmartFilterTextureBlock: WebGPU is not supported by SFE mode.");
        }

        // Tell FragmentOutputBlock ahead of time to store the final color in a temp variable
        if (!state._customOutputName && state.target === NodeMaterialBlockTargets.Fragment) {
            state._customOutputName = "outColor";
        }

        // Annotate uniforms of InputBlocks and bindable blocks with their current values
        if (!state.sharedData.getUniformAnnotation) {
            state.sharedData.getUniformAnnotation = (name: string) => {
                for (const block of state.sharedData.nodeMaterial.attachedBlocks) {
                    if (block instanceof InputBlock && block.isUniform && block.associatedVariableName === name) {
                        return this._generateInputBlockAnnotation(block);
                    }
                    if (block instanceof ScreenSizeBlock && block.associatedVariableName === name) {
                        return this._generateScreenSizeBlockAnnotation();
                    }
                }
                return "";
            };
        }
    }

    private _generateInputBlockAnnotation(inputBlock: InputBlock): string {
        const value = inputBlock.valueCallback ? inputBlock.valueCallback() : inputBlock.value;
        return `// { "default": ${JSON.stringify(value)} }\n`;
    }

    private _generateScreenSizeBlockAnnotation(): string {
        return `// { "autoBind": "outputResolution" }\n`;
    }

    protected override _getMainUvName(state: NodeMaterialBuildState): string {
        // Get the ScreenUVBlock's name, which is required for SFE and should be vUV.
        // NOTE: In the future, when we move to vertex shaders, update this to check for the nearest vec2 varying output.
        const screenUv = state.sharedData.nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "postprocess_uv");
        if (!screenUv || !screenUv.isAnAncestorOf(this)) {
            Logger.Error("SmartFilterTextureBlock: 'postprocess_uv' attribute from ScreenUVBlock is required.");
            return "";
        }
        return screenUv.associatedVariableName;
    }

    protected override _emitUvAndSampler(state: NodeMaterialBuildState): void {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            // Wrap the varying in a define, as it won't be needed in SFE.
            state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2, SfeModeDefine, true);

            // Append `// main` to denote this as the main input texture to composite
            const annotation = this.isMainInput ? "// main" : undefined;
            state._emit2DSampler(this._samplerName, undefined, undefined, annotation);
        }
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "postprocess_uv" && additionalFilteringInfo(b));

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute("postprocess_uv");
            }
            uvInput.output.connectTo(this.uv);
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            // Add the header JSON for the SFE block
            if (!state._injectAtTop) {
                state._injectAtTop = `// { "smartFilterBlockType": "${state.sharedData.nodeMaterial.name}", "namespace": "Babylon.NME.Exports" }`;
            }

            // Convert the main fragment function into a helper function, to later be inserted in an SFE pipeline.
            if (!state._customEntryHeader) {
                state._customEntryHeader += `#ifdef ${SfeModeDefine}\n`;
                state._customEntryHeader += `vec4 nmeMain(vec2 ${this._mainUVName}) { // main\n`;
                state._customEntryHeader += `#else\n`;
                state._customEntryHeader += `void main(void) {\n`;
                state._customEntryHeader += `#endif\n`;
                state._customEntryHeader += `vec4 outColor = vec4(0.0);\n`;
            }

            if (!state._injectAtEnd) {
                state._injectAtEnd += `\n#ifndef ${SfeModeDefine}\n`;
                state._injectAtEnd += `gl_FragColor = outColor;\n`;
                state._injectAtEnd += `#else\n`;
                state._injectAtEnd += `return outColor;\n`;
                state._injectAtEnd += `#endif\n`;
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.isMainInput = this.isMainInput;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.isMainInput = serializationObject.isMainInput;
    }
}

RegisterClass("BABYLON.SmartFilterTextureBlock", SmartFilterTextureBlock);
