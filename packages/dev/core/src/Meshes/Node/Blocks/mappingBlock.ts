import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { Vector2, Vector3 } from "../../../Maths/math.vector";

/**
 * Type of mappings supported by the mapping block
 */
export enum MappingTypes {
    /** Spherical */
    Spherical,
    /** Cylindrical */
    Cylindrical,
    /** Cubic */
    Cubic,
}

/**
 * Block used to generate UV coordinates
 */
export class MappingBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the mapping type used by the block
     */
    @editableInPropertyPage("Mapping", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Spherical", value: MappingTypes.Spherical },
            { label: "Cylindrical", value: MappingTypes.Cylindrical },
            { label: "Cubic", value: MappingTypes.Cubic },
        ],
    })
    public mapping = MappingTypes.Spherical;

    /**
     * Create a new MappingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerInput("center", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerOutput("uv", NodeGeometryBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "MappingBlock";
    }

    /**
     * Gets the position input component
     */
    public get position(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal input component
     */
    public get normal(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the center input component
     */
    public get center(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get uv(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        if (!this.position.isConnected) {
            this.uv._storedFunction = null;
            this.uv._storedValue = null;
            return;
        }
        const tempDirection = Vector3.Zero();

        const func = (state: NodeGeometryBuildState) => {
            const position = (this.position.getConnectedValue(state) as Vector3) || Vector3.Zero();
            const normal = (this.normal.getConnectedValue(state) as Vector3) || Vector3.Zero();
            const center = this.center.getConnectedValue(state) as Vector3;
            const uv = Vector2.Zero();

            switch (this.mapping) {
                case MappingTypes.Spherical: {
                    position.subtractToRef(center, tempDirection);
                    const len = tempDirection.length();
                    if (len > 0) {
                        uv.x = Math.acos(tempDirection.y / len) / Math.PI;
                        if (tempDirection.x !== 0 || tempDirection.z !== 0) {
                            uv.y = Math.atan2(tempDirection.x, tempDirection.z) / (Math.PI * 2);
                        }
                    }
                    break;
                }
                case MappingTypes.Cylindrical: {
                    position.subtractToRef(center, tempDirection);
                    const len = tempDirection.length();
                    if (len > 0) {
                        uv.x = Math.atan2(tempDirection.x / len, tempDirection.z / len) / (Math.PI * 2);
                        uv.y = (tempDirection.y + 1.0) / 2.0;
                    }
                    break;
                }
                case MappingTypes.Cubic: {
                    // Find the largest component of the normal vector
                    const absX = Math.abs(normal.x);
                    const absY = Math.abs(normal.y);
                    const absZ = Math.abs(normal.z);
                    const maxDim = Math.max(Math.abs(position.x), Math.abs(position.y), Math.abs(position.z));

                    let u = 0,
                        v = 0;

                    if (absX >= absY && absX >= absZ) {
                        u = position.y / maxDim - center.y;
                        v = position.z / maxDim - center.z;
                    } else if (absY >= absX && absY >= absZ) {
                        u = position.x / maxDim - center.x;
                        v = position.z / maxDim - center.z;
                    } else {
                        u = position.x / maxDim - center.x;
                        v = position.y / maxDim - center.y;
                    }

                    uv.x = (u + 1) / 2;
                    uv.y = (v + 1) / 2;
                }
            }
            return uv;
        };

        this.uv._storedFunction = (state) => {
            return func(state);
        };
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.mapping = BABYLON.MappingTypes.${MappingTypes[this.mapping]};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.mapping = this.mapping;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.mapping = serializationObject.mapping;
    }
}

RegisterClass("BABYLON.MappingBlock", MappingBlock);
