import { RegisterClass } from "../../../Misc/typeStore";
import type { Observer } from "core/Misc/observable";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

/**
 * Block used to apply the modulo operator
 */
export class ParticleModuloBlock extends NodeParticleBlock {
    private readonly _connectionObservers: Observer<NodeParticleConnectionPoint>[];

    /**
     * Create a new ParticleModuloBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeParticleBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this.left;

        this.left.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Int);
        this.left.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Float);
        this.right.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Int);
        this.right.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Float);

        this._linkConnectionTypes(0, 1);

        this._connectionObservers = [
            this.left.onConnectionObservable.add(() => this._updateInputOutputTypes()),
            this.left.onDisconnectionObservable.add(() => this._updateInputOutputTypes()),
            this.right.onConnectionObservable.add(() => this._updateInputOutputTypes()),
            this.right.onDisconnectionObservable.add(() => this._updateInputOutputTypes()),
        ];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleModuloBlock";
    }

    /**
     * Gets the left input component
     */
    public get left(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right input component
     */
    public get right(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const left = this.left;
        const right = this.right;

        if (!left.isConnected || !right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func: (state: NodeParticleBuildState) => any = (state) => {
            return left.getConnectedValue(state) % right.getConnectedValue(state);
        };

        this.output._storedFunction = (state) => {
            if (left.type === NodeParticleBlockConnectionPointTypes.Int) {
                return func(state) | 0;
            }
            return func(state);
        };
    }

    private _updateInputOutputTypes() {
        // First update the output type with the initial assumption that we'll base it on the left input.
        this.output._typeConnectionSource = this.left;

        if (this.left.isConnected && this.right.isConnected) {
            if (this.right.type === NodeParticleBlockConnectionPointTypes.Float) {
                this.output._typeConnectionSource = this.right;
            }
        } else if (this.left.isConnected !== this.right.isConnected) {
            // Only one input is connected, so we need to determine the output type based on the connected input.
            this.output._typeConnectionSource = this.left.isConnected ? this.left : this.right;
        }
    }

    /**
     * Release resources
     */
    public override dispose() {
        super.dispose();
        for (const observer of this._connectionObservers) {
            observer.remove();
        }
        this._connectionObservers.length = 0;
    }
}

RegisterClass("BABYLON.ParticleModuloBlock", ParticleModuloBlock);
