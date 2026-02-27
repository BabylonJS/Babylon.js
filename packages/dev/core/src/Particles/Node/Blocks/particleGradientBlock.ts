import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { ParticleGradientValueBlock } from "./particleGradientValueBlock";
import type { Nullable } from "core/types";
import { Lerp } from "core/Maths/math.scalar.functions";
import { Color4 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "core/Maths/math.vector";
/**
 * Block used to define a list of gradient entries
 */
export class ParticleGradientBlock extends NodeParticleBlock {
    private _entryCount = 1;
    /**
     * Creates a new ParticleGradientBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("gradient", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("value0", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[1];
        this._outputs[0]._typeConnectionSourceTranslation = (type) => {
            switch (type) {
                case NodeParticleBlockConnectionPointTypes.FloatGradient:
                    return NodeParticleBlockConnectionPointTypes.Float;
                case NodeParticleBlockConnectionPointTypes.Vector2Gradient:
                    return NodeParticleBlockConnectionPointTypes.Vector2;
                case NodeParticleBlockConnectionPointTypes.Vector3Gradient:
                    return NodeParticleBlockConnectionPointTypes.Vector3;
                case NodeParticleBlockConnectionPointTypes.Color4Gradient:
                    return NodeParticleBlockConnectionPointTypes.Color4;
            }
            return type;
        };

        this._inputs[1].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.FloatGradient |
                NodeParticleBlockConnectionPointTypes.Vector2Gradient |
                NodeParticleBlockConnectionPointTypes.Vector3Gradient |
                NodeParticleBlockConnectionPointTypes.Color4Gradient
        );

        this._manageExtendedInputs(1);
    }

    private _extend() {
        this._entryCount++;
        this.registerInput("value" + (this._entryCount - 1), NodeParticleBlockConnectionPointTypes.AutoDetect, true);
        this._linkConnectionTypes(1, this._entryCount);

        this._manageExtendedInputs(this._entryCount);
    }

    private _reduce() {
        // Remove the last input if it's not connected and we have more than one entry
        for (let i = this._inputs.length - 2; i >= 1; i--) {
            if (this._inputs[i].isConnected) {
                break;
            }
            const inputToRemove = this._inputs[i];
            inputToRemove.dispose();
            this._inputs.splice(i, 1);
            this._entryCount--;
            this.onInputChangedObservable.notifyObservers(inputToRemove);
        }

        // Rename inputs
        for (let i = 1; i < this._inputs.length; i++) {
            this._inputs[i].name = "value" + (i - 1);
        }
    }

    private _manageExtendedInputs(index: number) {
        this._inputs[index].onConnectionObservable.add(() => {
            if (this._entryCount > index) {
                return;
            }

            // Need to add a new input
            this._extend();
        });

        this._inputs[index].onDisconnectionObservable.add(() => {
            this._reduce();
        });
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleGradientBlock";
    }

    /**
     * Gets the gradient operand input component
     */
    public get gradient(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        // Building the list of entries in order
        const entries: ParticleGradientValueBlock[] = [];
        for (let i = 1; i < this._inputs.length; i++) {
            if (this._inputs[i].isConnected) {
                entries.push(this._inputs[i].connectedPoint?.ownerBlock as ParticleGradientValueBlock);
            }
        }

        entries.sort((a, b) => {
            return a.reference - b.reference;
        });

        this.output._storedFunction = (state) => {
            const gradient = this.gradient.getConnectedValue(state);

            if (entries.length === 1) {
                return entries[0].value.getConnectedValue(state);
            }

            // Go down the entries list in reverse order
            let nextEntry: Nullable<ParticleGradientValueBlock> = null;
            for (let i = entries.length - 1; i >= 0; i--) {
                const entry = entries[i];
                if (entry.reference <= gradient) {
                    const currentValue = entry.value.getConnectedValue(state);
                    if (nextEntry) {
                        const nextValue = nextEntry.value.getConnectedValue(state);
                        const nextReference = nextEntry.reference;
                        const currentReference = entry.reference;
                        const scale = Math.max(0, Math.min(1, (gradient - currentReference) / (nextReference - currentReference)));

                        switch (this.output.type) {
                            case NodeParticleBlockConnectionPointTypes.Float:
                                return Lerp(currentValue, nextValue, scale);
                            case NodeParticleBlockConnectionPointTypes.Vector2:
                                return Vector2.Lerp(currentValue, nextValue, scale);
                            case NodeParticleBlockConnectionPointTypes.Vector3:
                                return Vector3.Lerp(currentValue, nextValue, scale);
                            case NodeParticleBlockConnectionPointTypes.Color4:
                                return Color4.Lerp(currentValue, nextValue, scale);
                        }
                    }
                    return currentValue;
                }

                nextEntry = entry;
            }

            return 0;
        };
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject._entryCount = this._entryCount;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject._entryCount && serializationObject._entryCount > 1) {
            for (let i = 1; i < serializationObject._entryCount; i++) {
                this._extend();
            }
        }
    }
}

RegisterClass("BABYLON.ParticleGradientBlock", ParticleGradientBlock);
