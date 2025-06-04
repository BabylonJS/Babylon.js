import { serialize } from "core/Misc/decorators";
import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { NodeParticleConnectionPoint, NodeParticleConnectionPointDirection } from "./nodeParticleBlockConnectionPoint";
import type { NodeParticleBlockConnectionPointTypes } from "./Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "./nodeParticleBuildState";
import { Logger } from "core/Misc/logger";
import { PrecisionDate } from "core/Misc/precisionDate";
import { Observable } from "core/Misc/observable";
import { GetClass } from "core/Misc/typeStore";

/**
 * Defines a block that can be used inside a node based particle system
 */
export class NodeParticleBlock {
    private _name = "";
    private _buildId: number;
    protected _isInput = false;
    protected _isSystem = false;

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /** @internal */
    public _inputs = new Array<NodeParticleConnectionPoint>();
    /** @internal */
    public _outputs = new Array<NodeParticleConnectionPoint>();

    private _buildExecutionTime: number = 0;

    /**
     * Gets the time spent to build this block (in ms)
     */
    public get buildExecutionTime() {
        return this._buildExecutionTime;
    }

    /**
     * Gets an observable raised when the block is built
     */
    public onBuildObservable = new Observable<NodeParticleBlock>();

    /**
     * Gets a boolean indicating that this block is a system block
     */
    public get isSystem(): boolean {
        return this._isSystem;
    }

    /**
     * Gets a boolean indicating that this block is an input block
     */
    public get isInput(): boolean {
        return this._isInput;
    }

    /**
     * A free comment about the block
     */
    @serialize("comment")
    public comments: string;

    /** Gets or sets a boolean indicating that this input can be edited from a collapsed frame */
    public visibleOnFrame = false;

    /**
     * Gets or set the name of the block
     */
    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    /**
     * Gets the current class name e.g. "NodeParticleBlock"
     * @returns the class name
     */
    public getClassName() {
        return "NodeParticleBlock";
    }

    /**
     * Gets the list of input points
     */
    public get inputs(): NodeParticleConnectionPoint[] {
        return this._inputs;
    }

    /** Gets the list of output points */
    public get outputs(): NodeParticleConnectionPoint[] {
        return this._outputs;
    }

    /**
     * Creates a new NodeParticleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        this._name = name;
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOf(block: NodeParticleBlock): boolean {
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock === block) {
                    return true;
                }
                if (endpoint.ownerBlock.isAnAncestorOf(block)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOfType(type: string): boolean {
        if (this.getClassName() === type) {
            return true;
        }

        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock.isAnAncestorOfType(type)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Find an input by its name
     * @param name defines the name of the input to look for
     * @returns the input or null if not found
     */
    public getInputByName(name: string) {
        const filter = this._inputs.filter((e) => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Register a new input. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param isOptional defines a boolean indicating that this input can be omitted
     * @param value value to return if there is no connection
     * @param valueMin min value accepted for value
     * @param valueMax max value accepted for value
     * @returns the current block
     */
    public registerInput(name: string, type: NodeParticleBlockConnectionPointTypes, isOptional: boolean = false, value?: any, valueMin?: any, valueMax?: any) {
        const point = new NodeParticleConnectionPoint(name, this, NodeParticleConnectionPointDirection.Input);
        point.type = type;
        point.isOptional = isOptional;
        point.defaultValue = value;
        point.value = value;
        point.valueMin = valueMin;
        point.valueMax = valueMax;

        this._inputs.push(point);

        return this;
    }

    /**
     * Register a new output. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    public registerOutput(name: string, type: NodeParticleBlockConnectionPointTypes, point?: NodeParticleConnectionPoint) {
        point = point ?? new NodeParticleConnectionPoint(name, this, NodeParticleConnectionPointDirection.Output);
        point.type = type;

        this._outputs.push(point);

        return this;
    }

    /**
     * Builds the block. Must be implemented by derived classes.
     * @param _state defines the current build state
     */
    public async _buildAsync(_state: NodeParticleBuildState) {}

    /**
     * Builds the block
     * @param state defines the current build state
     * @returns a promise that resolves when the block is built
     */
    public async buildAsync(state: NodeParticleBuildState) {
        if (this._buildId === state.buildId) {
            return true;
        }

        if (this._outputs.length > 0) {
            if (!this._outputs.some((o) => o.hasEndpoints)) {
                return false;
            }

            for (const o of this.outputs) {
                o._resetCounters();
            }
        }

        this._buildId = state.buildId;

        // Check if "parent" blocks are compiled
        const buildPromises: Promise<any>[] = [];
        for (const input of this._inputs) {
            if (!input.connectedPoint) {
                if (!input.isOptional) {
                    // Emit a warning
                    state.notConnectedNonOptionalInputs.push(input);
                }
                continue;
            }

            const block = input.connectedPoint.ownerBlock;
            if (block && block !== this) {
                buildPromises.push(block.buildAsync(state));
            }
        }
        if (buildPromises.length > 0) {
            await Promise.all(buildPromises);
        }

        // Logs
        if (state.verbose) {
            Logger.Log(`Building ${this.name} [${this.getClassName()}]`);
        }

        const now = PrecisionDate.Now;
        await this._buildAsync(state);
        this._buildExecutionTime = PrecisionDate.Now - now;

        this.onBuildObservable.notifyObservers(this);

        return false;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject: any = {};
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject.visibleOnFrame = this.visibleOnFrame;

        serializationObject.inputs = [];
        serializationObject.outputs = [];

        for (const input of this.inputs) {
            serializationObject.inputs.push(input.serialize());
        }

        for (const output of this.outputs) {
            serializationObject.outputs.push(output.serialize(false));
        }

        return serializationObject;
    }

    /**
     * @internal
     */
    public _deserialize(serializationObject: any) {
        this._name = serializationObject.name;
        this.comments = serializationObject.comments;
        this.visibleOnFrame = !!serializationObject.visibleOnFrame;
        this._deserializePortDisplayNamesAndExposedOnFrame(serializationObject);
    }

    private _deserializePortDisplayNamesAndExposedOnFrame(serializationObject: any) {
        const serializedInputs = serializationObject.inputs;
        const serializedOutputs = serializationObject.outputs;
        if (serializedInputs) {
            for (const port of serializedInputs) {
                const input = this.inputs.find((i) => i.name === port.name);

                if (!input) {
                    return;
                }

                if (port.displayName) {
                    input.displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    input.isExposedOnFrame = port.isExposedOnFrame;
                    input.exposedPortPosition = port.exposedPortPosition;
                }
                if (port.value !== undefined && port.value !== null) {
                    if (port.valueType === "number") {
                        input.value = port.value;
                    } else {
                        const valueType = GetClass(port.valueType);

                        if (valueType) {
                            input.value = valueType.FromArray(port.value);
                        }
                    }
                }
            }
        }
        if (serializedOutputs) {
            for (let i = 0; i < serializedOutputs.length; i++) {
                const port = serializedOutputs[i];
                if (port.displayName) {
                    this.outputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.outputs[i].isExposedOnFrame = port.isExposedOnFrame;
                    this.outputs[i].exposedPortPosition = port.exposedPortPosition;
                }
            }
        }
    }

    /**
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    public clone() {
        const serializationObject = this.serialize();

        const blockType = GetClass(serializationObject.customType);
        if (blockType) {
            const block: NodeParticleBlock = new blockType();
            block._deserialize(serializationObject);

            return block;
        }

        return null;
    }

    /**
     * Release resources
     */
    public dispose() {
        for (const input of this.inputs) {
            input.dispose();
        }

        for (const output of this.outputs) {
            output.dispose();
        }

        this.onBuildObservable.clear();
    }
}
