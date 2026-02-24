import type { Observer } from "core/Misc/observable";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";

/**
 * Operations supported by the Number Math block
 */
export enum ParticleNumberMathBlockOperations {
    /** Modulo */
    Modulo,
    /** Power */
    Pow,
}

/**
 * Block used to apply math operations that only appply to numbers (int/float)
 */
export class ParticleNumberMathBlock extends NodeParticleBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Modulo", value: ParticleNumberMathBlockOperations.Modulo },
            { label: "Power", value: ParticleNumberMathBlockOperations.Pow },
        ],
    })
    public operation = ParticleNumberMathBlockOperations.Modulo;

    private readonly _connectionObservers: Observer<NodeParticleConnectionPoint>[];

    /**
     * Create a new ParticleNumberMathBlock
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

        const excludedConnectionPointTypes = [
            NodeParticleBlockConnectionPointTypes.Vector2,
            NodeParticleBlockConnectionPointTypes.Vector3,
            NodeParticleBlockConnectionPointTypes.Matrix,
            NodeParticleBlockConnectionPointTypes.Particle,
            NodeParticleBlockConnectionPointTypes.Texture,
            NodeParticleBlockConnectionPointTypes.Color4,
            NodeParticleBlockConnectionPointTypes.FloatGradient,
            NodeParticleBlockConnectionPointTypes.Vector2Gradient,
            NodeParticleBlockConnectionPointTypes.Vector3Gradient,
            NodeParticleBlockConnectionPointTypes.Color4Gradient,
            NodeParticleBlockConnectionPointTypes.System,
            NodeParticleBlockConnectionPointTypes.Undefined,
        ] as const;

        this.left.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);
        this.right.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);

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
        return "ParticleNumberMathBlock";
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
        let func: (state: NodeParticleBuildState) => any;
        const left = this.left;
        const right = this.right;

        if (!left.isConnected || !right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        switch (this.operation) {
            case ParticleNumberMathBlockOperations.Modulo: {
                func = (state) => {
                    return left.getConnectedValue(state) % right.getConnectedValue(state);
                };
                break;
            }
            case ParticleNumberMathBlockOperations.Pow: {
                func = (state) => {
                    return Math.pow(left.getConnectedValue(state), right.getConnectedValue(state));
                };
                break;
            }
        }

        this.output._storedFunction = (state) => {
            // We use the left type to determine if we need to cast to int
            if (left.type === NodeParticleBlockConnectionPointTypes.Int) {
                return func(state) | 0;
            }
            return func(state);
        };
    }

    private _updateInputOutputTypes() {
        // First update the output type with the initial assumption that we'll base it on the left input.
        this.output._typeConnectionSource = this.left;

        // If left is not connected, then instead use the type of right if it's connected.
        if (!this.left.isConnected && this.right.isConnected) {
            this.output._typeConnectionSource = this.right;
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

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    /**
     * Deserializes the block from a JSON object
     * @param serializationObject the JSON object to deserialize from
     */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.operation = serializationObject.operation;
    }
}

RegisterClass("BABYLON.ParticleNumberMathBlock", ParticleNumberMathBlock);
