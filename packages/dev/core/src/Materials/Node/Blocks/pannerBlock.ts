import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { InputBlock } from "./Input/inputBlock";
import type { NodeMaterial } from "../nodeMaterial";
import { AnimatedInputBlockTypes } from "./Input/animatedInputBlockTypes";
import { NodeMaterialModes } from "../Enums/nodeMaterialModes";

/**
 * Block used to pan UV coordinates over time (similar to Unreal's Panner node).
 * This block takes UV coordinates, speed values for X and Y axes, and a time input,
 * then outputs animated UV coordinates that scroll based on the speed and time.
 */
export class PannerBlock extends NodeMaterialBlock {
    /**
     * Creates a new PannerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("speed", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("time", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PannerBlock";
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the speed input component
     */
    public get speed(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the time input component
     */
    public get time(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.uv.isConnected) {
            if (material.mode !== NodeMaterialModes.PostProcess && material.mode !== NodeMaterialModes.ProceduralTexture) {
                const attributeName = material.mode === NodeMaterialModes.Particle ? "particle_uv" : "uv";

                let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === attributeName && additionalFilteringInfo(b));

                if (!uvInput) {
                    uvInput = new InputBlock("uv");
                    uvInput.setAsAttribute(attributeName);
                }

                uvInput.output.connectTo(this.uv);
            }
        }

        if (!this.time.isConnected) {
            let timeInput = material.getInputBlockByPredicate((b) => b.animationType === AnimatedInputBlockTypes.Time && additionalFilteringInfo(b));

            if (!timeInput) {
                timeInput = new InputBlock("time");
                timeInput.value = 0;
                timeInput.animationType = AnimatedInputBlockTypes.Time;
            }

            timeInput.output.connectTo(this.time);
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        // Output = UV + speed * time
        state.compilationString +=
            state._declareOutput(output) + ` = ${this.uv.associatedVariableName} + ${this.speed.associatedVariableName} * ${this.time.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.PannerBlock", PannerBlock);
