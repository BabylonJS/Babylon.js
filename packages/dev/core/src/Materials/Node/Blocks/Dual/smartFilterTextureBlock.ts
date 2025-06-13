import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { CurrentScreenBlock } from "./currentScreenBlock";
import { RegisterClass } from "core/Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import type { NodeMaterialBlock } from "../../nodeMaterialBlock";
import type { NodeMaterial } from "../../nodeMaterial";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { Scene } from "core/scene";
import { SfeModeDefine } from "../Fragment/smartFilterFragmentOutputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";

/**
 * Base block used for creating Smart Filter shader blocks for the SFE framework.
 * This block extends the functionality of CurrentScreenBlock, as both are used
 * to represent arbitrary 2D textures to compose, and work similarly.
 */
export class SmartFilterTextureBlock extends CurrentScreenBlock {
    private _firstInit: boolean = true;

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
        if (this._firstInit) {
            this._samplerName = state._getFreeVariableName(this.name);
            this._firstInit = false;
        }
    }

    protected override _getMainUvName(state: NodeMaterialBuildState): string {
        // Get the ScreenUVBlock's name, which is required for SFE and should be vUV.
        // NOTE: In the future, when we move to vertex shaders, update this to check for the nearest vec2 varying output.
        const screenUv = state.sharedData.nodeMaterial.getInputBlockByPredicate((b) => b.isAttribute && b.name === "postprocess_uv");
        if (!screenUv || !screenUv.isAnAncestorOf(this)) {
            state.sharedData.raiseBuildError("SmartFilterTextureBlock: 'postprocess_uv' attribute from ScreenUVBlock is required.");
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

    public override _postBuildBlock(): void {
        this._firstInit = true;
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
