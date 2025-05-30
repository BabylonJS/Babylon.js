import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { NodeMaterialModes } from "../../Enums/nodeMaterialModes";
import { CurrentScreenBlock } from "./currentScreenBlock";
import { RegisterClass } from "core/Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import type { NodeMaterialBlock } from "../../nodeMaterialBlock";
import type { NodeMaterial } from "../../nodeMaterial";

/** @internal */
export const SfeModeDefine = "USE_SFE_FRAMEWORK";

/**
 * Base block used for compositing an input SFE texture.
 * This block extends the functionality of CurrentScreenBlock
 * so that it can be used in the SFE framework.
 */
export class SmartFilterTextureBlock extends CurrentScreenBlock {
    /**
     * Create a new SmartFilterTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this._samplerName = "sfeInput";
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

        if (state.sharedData.nodeMaterial.mode !== NodeMaterialModes.SFE) {
            throw new Error("SmartFilterTextureBlock: Can only be used in SFE mode.");
        }

        // Tell FragmentOutputBlock ahead of time to store the final color in a temp variable
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state._customOutputName = "outColor";
        }
    }

    protected override _getMainUvName(state: NodeMaterialBuildState): string {
        // Get the ScreenUVBlock's name, which is required for SFE and should be vUV.
        // NOTE: In the future, when we move to vertex shaders, update this to check for the nearest vec2 varying output.
        const screenUv = state.sharedData.nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "postprocess_uv");
        if (!screenUv || !screenUv.isAnAncestorOf(this)) {
            throw new Error("SmartFilterTextureBlock: 'postprocess_uv' attribute from ScreenUVBlock is required.");
        }
        return screenUv.associatedVariableName;
    }

    protected override _emitUvAndSampler(state: NodeMaterialBuildState): void {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            // Wrap the varying in a define, as it won't be needed in SFE.
            state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2, SfeModeDefine, true);
            // Append `// main` to denote this as the main input texture to composite
            state._emit2DSampler(this._samplerName, undefined, undefined, "// main");
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
                state._injectAtTop = `// { "smartFilterBlockType": "${state.sharedData.nodeMaterial.name}", "namespace": "Babylon.NME.Test" }`;
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
}

RegisterClass("BABYLON.SmartFilterTextureBlock", SmartFilterTextureBlock);
