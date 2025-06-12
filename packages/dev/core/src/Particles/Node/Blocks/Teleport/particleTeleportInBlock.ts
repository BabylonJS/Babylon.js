import { RegisterClass } from "../../../../Misc/typeStore";
import type { ParticleTeleportOutBlock } from "./particleTeleportOutBlock";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";

/**
 * Defines a block used to teleport a value to an endpoint
 */
export class ParticleTeleportInBlock extends NodeParticleBlock {
    private _endpoints: ParticleTeleportOutBlock[] = [];

    /** Gets the list of attached endpoints */
    public get endpoints() {
        return this._endpoints;
    }

    /**
     * Create a new ParticleTeleportInBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this._isTeleportIn = true;

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleTeleportInBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    public override isAnAncestorOfType(type: string): boolean {
        if (this.getClassName() === type) {
            return true;
        }

        for (const endpoint of this.endpoints) {
            if (endpoint.isAnAncestorOfType(type)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public override isAnAncestorOf(block: NodeParticleBlock): boolean {
        for (const endpoint of this.endpoints) {
            if (endpoint === block) {
                return true;
            }

            if (endpoint.isAnAncestorOf(block)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add an enpoint to this block
     * @param endpoint define the endpoint to attach to
     */
    public attachToEndpoint(endpoint: ParticleTeleportOutBlock) {
        endpoint.detach();

        this._endpoints.push(endpoint);
        endpoint._entryPoint = this;
        endpoint._outputs[0]._typeConnectionSource = this._inputs[0];
        endpoint._tempEntryPointUniqueId = null;
        endpoint.name = "> " + this.name;
    }

    /**
     * Remove enpoint from this block
     * @param endpoint define the endpoint to remove
     */
    public detachFromEndpoint(endpoint: ParticleTeleportOutBlock) {
        const index = this._endpoints.indexOf(endpoint);

        if (index !== -1) {
            this._endpoints.splice(index, 1);
            endpoint._outputs[0]._typeConnectionSource = null;
            endpoint._entryPoint = null;
        }
    }

    public override _build() {
        for (const endpoint of this._endpoints) {
            endpoint.output._storedFunction = (state) => {
                return this.input.getConnectedValue(state);
            };
        }
    }
}

RegisterClass("BABYLON.ParticleTeleportInBlock", ParticleTeleportInBlock);
