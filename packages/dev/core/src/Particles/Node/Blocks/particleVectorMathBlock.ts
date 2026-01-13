import type { Observer } from "core/Misc/observable";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { Vector3 } from "../../../Maths/math.vector";

/**
 * Operations supported by the Vector Math block
 */
export enum ParticleVectorMathBlockOperations {
    /** Dot product */
    Dot,
    /** Distance between two vectors */
    Distance,
}

/**
 * Block used to apply math operations that only apply to vectors
 */
export class ParticleVectorMathBlock extends NodeParticleBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Dot", value: ParticleVectorMathBlockOperations.Dot },
            { label: "Distance", value: ParticleVectorMathBlockOperations.Distance },
        ],
    })
    public operation = ParticleVectorMathBlockOperations.Dot;
    private readonly _connectionObservers: Observer<NodeParticleConnectionPoint>[];

    /**
     * Create a new ParticleVectorMathBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeParticleBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this.left;

        this.left.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector3);
        this.right.acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector3);

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
        return "ParticleVectorMathBlock";
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
            case ParticleVectorMathBlockOperations.Dot: {
                func = (state) => {
                    return Vector3.Dot(left.getConnectedValue(state), right.getConnectedValue(state));
                };
                break;
            }
            case ParticleVectorMathBlockOperations.Distance: {
                func = (state) => {
                    return Vector3.Distance(left.getConnectedValue(state), right.getConnectedValue(state));
                };
                break;
            }
        }

        this.output._storedFunction = (state) => {
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

RegisterClass("BABYLON.ParticleVectorMathBlock", ParticleVectorMathBlock);
