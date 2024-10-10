import { Observable } from "../../../Misc/observable";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { GetClass, RegisterClass } from "../../../Misc/typeStore";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";

/**
 * Block used to expose an input value
 */
export class GeometryInputBlock extends NodeGeometryBlock {
    private _storedValue: any;
    private _valueCallback: () => any;
    private _type: NodeGeometryBlockConnectionPointTypes = NodeGeometryBlockConnectionPointTypes.Undefined;
    private _contextualSource = NodeGeometryContextualSources.None;

    /** Gets or set a value used to limit the range of float values */
    public min: number = 0;

    /** Gets or set a value used to limit the range of float values */
    public max: number = 0;

    /** Gets or sets the group to use to display this block in the Inspector */
    public groupInInspector = "";

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<GeometryInputBlock>();

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeGeometryBlockConnectionPointTypes {
        if (this._type === NodeGeometryBlockConnectionPointTypes.AutoDetect) {
            if (this.value != null) {
                if (!isNaN(this.value)) {
                    this._type = NodeGeometryBlockConnectionPointTypes.Float;
                    return this._type;
                }

                switch (this.value.getClassName()) {
                    case "Vector2":
                        this._type = NodeGeometryBlockConnectionPointTypes.Vector2;
                        return this._type;
                    case "Vector3":
                        this._type = NodeGeometryBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case "Vector4":
                        this._type = NodeGeometryBlockConnectionPointTypes.Vector4;
                        return this._type;
                    case "Matrix":
                        this._type = NodeGeometryBlockConnectionPointTypes.Matrix;
                        return this._type;
                }
            }
        }

        return this._type;
    }

    /**
     * Gets a boolean indicating that the current connection point is a contextual value
     */
    public get isContextual(): boolean {
        return this._contextualSource !== NodeGeometryContextualSources.None;
    }

    /**
     * Gets or sets the current contextual value
     */
    public get contextualValue(): NodeGeometryContextualSources {
        return this._contextualSource;
    }

    public set contextualValue(value: NodeGeometryContextualSources) {
        this._contextualSource = value;

        switch (value) {
            case NodeGeometryContextualSources.Positions:
            case NodeGeometryContextualSources.Normals:
            case NodeGeometryContextualSources.LatticeID:
            case NodeGeometryContextualSources.LatticeControl:
                this._type = NodeGeometryBlockConnectionPointTypes.Vector3;
                break;
            case NodeGeometryContextualSources.Colors:
            case NodeGeometryContextualSources.Tangents:
                this._type = NodeGeometryBlockConnectionPointTypes.Vector4;
                break;
            case NodeGeometryContextualSources.UV:
            case NodeGeometryContextualSources.UV2:
            case NodeGeometryContextualSources.UV3:
            case NodeGeometryContextualSources.UV4:
            case NodeGeometryContextualSources.UV5:
            case NodeGeometryContextualSources.UV6:
                this._type = NodeGeometryBlockConnectionPointTypes.Vector2;
                break;
            case NodeGeometryContextualSources.VertexID:
            case NodeGeometryContextualSources.GeometryID:
            case NodeGeometryContextualSources.CollectionID:
            case NodeGeometryContextualSources.FaceID:
            case NodeGeometryContextualSources.LoopID:
            case NodeGeometryContextualSources.InstanceID:
                this._type = NodeGeometryBlockConnectionPointTypes.Int;
                break;
        }

        if (this.output) {
            this.output.type = this._type;
        }
    }

    /**
     * Creates a new InputBlock
     * @param name defines the block name
     * @param type defines the type of the input (can be set to NodeGeometryBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, type: NodeGeometryBlockConnectionPointTypes = NodeGeometryBlockConnectionPointTypes.AutoDetect) {
        super(name);

        this._type = type;
        this._isInput = true;

        this.setDefaultValue();

        this.registerOutput("output", type);
    }

    /**
     * Gets or sets the value of that point.
     * Please note that this value will be ignored if valueCallback is defined
     */
    public get value(): any {
        return this._storedValue;
    }

    public set value(value: any) {
        if (this.type === NodeGeometryBlockConnectionPointTypes.Float) {
            if (this.min !== this.max) {
                value = Math.max(this.min, value);
                value = Math.min(this.max, value);
            }
        }

        this._storedValue = value;

        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Gets or sets a callback used to get the value of that point.
     * Please note that setting this value will force the connection point to ignore the value property
     */
    public get valueCallback(): () => any {
        return this._valueCallback;
    }

    public set valueCallback(value: () => any) {
        this._valueCallback = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryInputBlock";
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        this.contextualValue = NodeGeometryContextualSources.None;
        switch (this.type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
            case NodeGeometryBlockConnectionPointTypes.Float:
                this.value = 0;
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                this.value = Vector2.Zero();
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                this.value = Vector3.Zero();
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                this.value = Vector4.Zero();
                break;
            case NodeGeometryBlockConnectionPointTypes.Matrix:
                this.value = Matrix.Identity();
                break;
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        if (this.isContextual) {
            this.output._storedValue = null;
            this.output._storedFunction = (state) => {
                return state.getContextualValue(this._contextualSource);
            };
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = this.value;
        }
    }

    public override dispose() {
        this.onValueChangedObservable.clear();

        super.dispose();
    }

    protected override _dumpPropertiesCode() {
        const variableName = this._codeVariableName;

        if (this.isContextual) {
            return (
                super._dumpPropertiesCode() + `${variableName}.contextualValue = BABYLON.NodeGeometryContextualSources.${NodeGeometryContextualSources[this._contextualSource]};\n`
            );
        }
        const codes: string[] = [];

        let valueString = "";

        switch (this.type) {
            case NodeGeometryBlockConnectionPointTypes.Float:
            case NodeGeometryBlockConnectionPointTypes.Int:
                valueString = `${this.value}`;
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                valueString = `new BABYLON.Vector2(${this.value.x}, ${this.value.y})`;
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                valueString = `new BABYLON.Vector3(${this.value.x}, ${this.value.y}, ${this.value.z})`;
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                valueString = `new BABYLON.Vector4(${this.value.x}, ${this.value.y}, ${this.value.z}, ${this.value.w})`;
                break;
        }

        // Common Property "Value"
        codes.push(`${variableName}.value = ${valueString}`);

        // Float-Value-Specific Properties
        if (this.type === NodeGeometryBlockConnectionPointTypes.Float || this.type === NodeGeometryBlockConnectionPointTypes.Int) {
            codes.push(`${variableName}.min = ${this.min}`, `${variableName}.max = ${this.max}`);
        }

        codes.push("");

        return super._dumpPropertiesCode() + codes.join(";\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.type = this.type;
        serializationObject.contextualValue = this.contextualValue;
        serializationObject.min = this.min;
        serializationObject.max = this.max;
        serializationObject.groupInInspector = this.groupInInspector;

        if (this._storedValue !== null && !this.isContextual) {
            if (this._storedValue.asArray) {
                serializationObject.valueType = "BABYLON." + this._storedValue.getClassName();
                serializationObject.value = this._storedValue.asArray();
            } else {
                serializationObject.valueType = "number";
                serializationObject.value = this._storedValue;
            }
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this._type = serializationObject.type;

        this.contextualValue = serializationObject.contextualValue;
        this.min = serializationObject.min || 0;
        this.max = serializationObject.max || 0;
        this.groupInInspector = serializationObject.groupInInspector || "";

        if (!serializationObject.valueType) {
            return;
        }

        if (serializationObject.valueType === "number") {
            this._storedValue = serializationObject.value;
        } else {
            const valueType = GetClass(serializationObject.valueType);

            if (valueType) {
                this._storedValue = valueType.FromArray(serializationObject.value);
            }
        }
    }
}

RegisterClass("BABYLON.GeometryInputBlock", GeometryInputBlock);
