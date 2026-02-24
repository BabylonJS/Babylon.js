import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterialTeleportInBlock } from "./teleportInBlock";
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { Scene } from "../../../../scene";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";

/**
 * Defines a block used to receive a value from a teleport entry point
 */
export class NodeMaterialTeleportOutBlock extends NodeMaterialBlock {
    /** @internal */
    public _entryPoint: Nullable<NodeMaterialTeleportInBlock> = null;
    /** @internal */
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
    public override getClassName() {
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
    public override get target() {
        return this._entryPoint ? this._entryPoint.target : this._target;
    }

    public override set target(value: NodeMaterialBlockTargets) {
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

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this.entryPoint) {
            return;
        }

        if (this.entryPoint.isConnectedToUniform) {
            // We skip the build if the entry point is connected to a uniform
            this.output.associatedVariableName = this.entryPoint.input.associatedVariableName;
            return;
        }

        state.compilationString += state._declareOutput(this.output) + ` = ${this.entryPoint.input.associatedVariableName};\n`;

        if (this.entryPoint.endpoints.length > 1) {
            // Check if all the endpoints are in the same shader stage
            const firstConnected = this.entryPoint.endpoints.find((e) => e.output.isConnected);
            if (firstConnected) {
                const firstTarget = firstConnected.output.isConnectedInVertexShader;
                for (const endpoint of this.entryPoint.endpoints) {
                    if (endpoint === firstConnected) {
                        continue;
                    }
                    if (endpoint.output.isConnected && endpoint.output.isConnectedInVertexShader !== firstTarget) {
                        state.sharedData.raiseBuildError(
                            `TeleportInBlock "${this.entryPoint.name}" cannot have outputs in different shader stages. All the outputs must be in the same shader stage (vertex or fragment but not both).`
                        );
                    }
                }
            }
        }
    }

    /**
     * Clone the current block to a new identical block
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a copy of the current block
     */
    public override clone(scene: Scene, rootUrl: string = "") {
        const clone = super.clone(scene, rootUrl);

        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone as NodeMaterialTeleportOutBlock);
        }

        return clone;
    }

    protected override _customBuildStep(state: NodeMaterialBuildState, activeBlocks: NodeMaterialBlock[]): void {
        if (this.entryPoint) {
            this.entryPoint.build(state, activeBlocks);
        }
    }

    /**
     * Dumps the code for the block
     * @param uniqueNames - the unique names
     * @param alreadyDumped - the already dumped blocks
     * @returns the code string
     */
    public override _dumpCode(uniqueNames: string[], alreadyDumped: NodeMaterialBlock[]) {
        let codeString: string = "";
        if (this.entryPoint) {
            if (alreadyDumped.indexOf(this.entryPoint) === -1) {
                codeString += this.entryPoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        return codeString + super._dumpCode(uniqueNames, alreadyDumped);
    }

    /**
     * Dumps the code for output connections
     * @param alreadyDumped - the already dumped blocks
     * @returns the code string
     */
    public override _dumpCodeForOutputConnections(alreadyDumped: NodeMaterialBlock[]) {
        let codeString = super._dumpCodeForOutputConnections(alreadyDumped);

        if (this.entryPoint) {
            codeString += this.entryPoint._dumpCodeForOutputConnections(alreadyDumped);
        }

        return codeString;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        if (this.entryPoint) {
            codeString += `${this.entryPoint._codeVariableName}.attachToEndpoint(${this._codeVariableName});\n`;
        }
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.entryPoint = this.entryPoint?.uniqueId ?? "";

        return serializationObject;
    }

    /**
     * Deserializes the block
     * @param serializationObject - the serialization object
     * @param scene - the scene
     * @param rootUrl - the root URL
     */
    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }
}

RegisterClass("BABYLON.NodeMaterialTeleportOutBlock", NodeMaterialTeleportOutBlock);
