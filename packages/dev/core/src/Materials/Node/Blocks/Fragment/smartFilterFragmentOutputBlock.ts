import { FragmentOutputBlock } from "./fragmentOutputBlock";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialModes } from "../../Enums/nodeMaterialModes";
import { RegisterClass } from "core/Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import { ScreenSizeBlock } from "../Fragment/screenSizeBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/** @internal */
export const SfeModeDefine = "USE_SFE_FRAMEWORK";

/**
 * Block used to output the final color with Smart Filters structural support.
 */
export class SmartFilterFragmentOutputBlock extends FragmentOutputBlock {
    /**
     * Create a new SmartFilterFragmentOutputBlock
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
        return "SmartFilterFragmentOutputBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        super.initialize(state);

        if (state.sharedData.nodeMaterial.mode !== NodeMaterialModes.SFE) {
            state.sharedData.raiseBuildError("SmartFilterFragmentOutputBlock should not be used outside of SFE mode.");
        }

        if (state.sharedData.nodeMaterial.shaderLanguage !== ShaderLanguage.GLSL) {
            state.sharedData.raiseBuildError("WebGPU is not supported in SmartFilters mode.");
        }

        // Annotate uniforms of InputBlocks and bindable blocks with their current values
        if (!state.sharedData.formatConfig.getUniformAnnotation) {
            state.sharedData.formatConfig.getUniformAnnotation = (name: string) => {
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

        // Do our best to clean up variable names, as they will be used as display names.
        state.sharedData.formatConfig.formatVariablename = (n: string) => {
            let name = n;

            const hasUnderscoredPrefix = name.length > 1 && name[1] === "_";
            if (hasUnderscoredPrefix) {
                name = name.substring(2);
            }

            return name.replace(/[^a-zA-Z]+/g, "");
        };
    }

    private _generateInputBlockAnnotation(inputBlock: InputBlock): string {
        const value = inputBlock.valueCallback ? inputBlock.valueCallback() : inputBlock.value;
        return `// { "default": ${JSON.stringify(value)} }\n`;
    }

    private _generateScreenSizeBlockAnnotation(): string {
        return `// { "autoBind": "outputResolution" }\n`;
    }

    private _getMainUvName(state: NodeMaterialBuildState): string {
        // Get the ScreenUVBlock's name, which is required for SFE and should be vUV.
        // NOTE: In the future, when we move to vertex shaders, update this to check for the nearest vec2 varying output.
        const screenUv = state.sharedData.nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "postprocess_uv");
        if (!screenUv || !screenUv.isAnAncestorOf(this)) {
            return "";
        }
        return screenUv.associatedVariableName;
    }

    protected override _getOutputString(): string {
        return "outColor";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const outputString = this._getOutputString();

        state._customEntryHeader += `#ifdef ${SfeModeDefine}\n`;
        state._customEntryHeader += `vec4 nmeMain(vec2 ${this._getMainUvName(state)}) { // main\n`;
        state._customEntryHeader += `#else\n`;
        state._customEntryHeader += `void main(void) {\n`;
        state._customEntryHeader += `#endif\n`;
        state._customEntryHeader += `vec4 ${outputString} = vec4(0.0);\n`;

        state.compilationString += `\n#ifndef ${SfeModeDefine}\n`;
        state.compilationString += `gl_FragColor = ${outputString};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += `return ${outputString};\n`;
        state.compilationString += `#endif\n`;

        return this;
    }
}

RegisterClass("BABYLON.SmartFilterFragmentOutputBlock", SmartFilterFragmentOutputBlock);
