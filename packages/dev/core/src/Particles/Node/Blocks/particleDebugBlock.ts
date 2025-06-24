import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { Vector2ToFixed, Vector3ToFixed } from "../../../Maths/math.vector.functions";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Observable } from "core/Misc/observable";

/**
 * Defines a block used to debug values going through it
 */
export class ParticleDebugBlock extends NodeParticleBlock {
    /**
     * Gets the log entries
     */
    public log: string[][] = [];

    /**
     * Gets or sets the number of logs to keep
     */
    @editableInPropertyPage("Reference", PropertyTypeForEdition.Int, "ADVANCED", { embedded: false, notifiers: { rebuild: true }, min: 1, max: 100 })
    public stackSize = 10;

    /**
     * Create a new ParticleDebugBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isDebug = true;

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.FloatGradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector2Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector3Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Color4Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.System);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleDebugBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Observable raised when data is collected
     */
    public onDataCollectedObservable = new Observable<ParticleDebugBlock>(undefined, true);

    public override _build(state: NodeParticleBuildState) {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.log = [];
        const func = (state: NodeParticleBuildState) => {
            const input = this.input.getConnectedValue(state);

            if (this.log.length >= this.stackSize) {
                return input;
            }

            if (input === null || input === undefined) {
                this.log.push(["null", ""]);
                return input;
            }

            switch (this.input.type) {
                case NodeParticleBlockConnectionPointTypes.Vector2:
                    this.log.push([Vector2ToFixed(input, 4), input.toString()]);
                    break;
                case NodeParticleBlockConnectionPointTypes.Vector3:
                    this.log.push([Vector3ToFixed(input, 4), input.toString()]);
                    break;
                case NodeParticleBlockConnectionPointTypes.Color4:
                    this.log.push([`{R: ${input.r.toFixed(4)} G: ${input.g.toFixed(4)} B: ${input.b.toFixed(4)} A: ${input.a.toFixed(4)}}`, input.toString()]);
                    break;
                default:
                    this.log.push([input.toString(), input.toString()]);
                    break;
            }

            this.onDataCollectedObservable.notifyObservers(this);

            return input;
        };

        if (this.output.isConnected) {
            this.output._storedFunction = func;
        } else {
            this.output._storedValue = func(state);
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.stackSize = this.stackSize;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.stackSize = serializationObject.stackSize;
    }

    public override dispose(): void {
        this.onDataCollectedObservable.clear();
        super.dispose();
    }
}

RegisterClass("BABYLON.ParticleDebugBlock", ParticleDebugBlock);
