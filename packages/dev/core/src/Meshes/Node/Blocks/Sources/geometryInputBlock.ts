import { Observable } from "../../../../Misc/observable";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeMaterialGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Vector2, Vector3, Vector4 } from "../../../../Maths/math.vector";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";

/**
 * Block used to expose an input value
 */
export class GeometryInputBlock extends NodeGeometryBlock {
    private _storedValue: any;
    private _valueCallback: () => any;
    private _type: NodeGeometryBlockConnectionPointTypes = NodeGeometryBlockConnectionPointTypes.Undefined;

    /** Gets or set a value used to limit the range of float values */
    public min: number = 0;

    /** Gets or set a value used to limit the range of float values */
    public max: number = 0;

    /** Gets or set a value indicating that this input can only get 0 and 1 values */
    public isBoolean: boolean = false;

    /** Gets or sets a value used by the Node Geometry editor to determine how to configure the current value if it is a matrix */
    public matrixMode: number = 0;

    /** Gets or sets a boolean indicating that the value of this input will not change after a build */
    public isConstant = false;

    /** Gets or sets the group to use to display this block in the Inspector */
    public groupInInspector = "";

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<GeometryInputBlock>();

    /** Gets or sets a boolean indicating if content needs to be converted to gamma space (for color3/4 only) */
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space (for color3/4 only) */
    public convertToLinearSpace = false;

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
                }
            }
        }

        return this._type;
    }

    /**
     * Creates a new InputBlock
     * @param name defines the block name
     * @param type defines the type of the input (can be set to NodeGeometryBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string,type: NodeGeometryBlockConnectionPointTypes = NodeGeometryBlockConnectionPointTypes.AutoDetect) {
        super(name, true);

        this._type = type;

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
            if (this.isBoolean) {
                value = value ? 1 : 0;
            } else if (this.min !== this.max) {
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
    public getClassName() {
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
        switch (this.type) {
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
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        this.output._storedValue = this.value;
    }

    public dispose() {
        this.onValueChangedObservable.clear();

        super.dispose();
    }
}

RegisterClass("BABYLON.GeometryInputBlock", GeometryInputBlock);
