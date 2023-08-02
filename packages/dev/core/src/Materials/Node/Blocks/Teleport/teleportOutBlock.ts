import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterialTeleportInBlock } from "./teleportInBlock";
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { Scene } from "../../../../scene";
import { NodeMaterialBlockTargets } from "../../Enums";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";

/**
 * Defines a block used to receive a value from an teleport entry point
 */
export class NodeMaterialTeleportOutBlock extends NodeMaterialBlock {
    /** @hidden */
    public _entryPoint: Nullable<NodeMaterialTeleportInBlock> = null;
    /** @hidden */
    public _tempEntryPointUniqueId: Nullable<number> = null;

    /**
     * Create a new TeleportOutBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
    }

    /**
     * Gets the entry point
     */
    public get entryPoint() {
        return this._entryPoint;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NodeMaterialTeleportOutBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets or sets the target of the block
     */
    public get target() {
        return this._entryPoint ? this._entryPoint.target : this._target;
    }

    public set target(value: NodeMaterialBlockTargets) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }

    /** Detach from entry point */
    public detach() {
        if (!this._entryPoint) {
            return;
        }

        this._entryPoint.detachFromEndpoint(this);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        // Do nothing
        // All work done by the emitter
        super._buildBlock(state);

        if (this.entryPoint) {
            state.compilationString += this._declareOutput(this.output, state) + ` = ${this.entryPoint.input.associatedVariableName};\r\n`;
        }
    }

    /**
     * Clone the current block to a new identical block
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a copy of the current block
     */
    public clone(scene: Scene, rootUrl: string = "") {
        const clone = super.clone(scene, rootUrl);

        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone as any as NodeMaterialTeleportOutBlock);
        }

        return clone;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        if (this.entryPoint) {
            codeString += `${this.entryPoint._codeVariableName}.attachToEndpoint(${this._codeVariableName});\r\n`;
        }
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.entryPoint = this.entryPoint?.uniqueId ?? "";

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }
}

RegisterClass("BABYLON.NodeMaterialTeleportOutBlock", NodeMaterialTeleportOutBlock);
