import { Observable } from "../../../Misc/observable";
import { GetClass, RegisterClass } from "../../../Misc/typeStore";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

/**
 * Block used to expose an input value
 */
export class ParticleInputBlock extends NodeParticleBlock {
    private _storedValue: any;
    private _valueCallback: () => any;
    private _type: NodeParticleBlockConnectionPointTypes = NodeParticleBlockConnectionPointTypes.Undefined;

    /** Gets or set a value used to limit the range of float values */
    public min: number = 0;

    /** Gets or set a value used to limit the range of float values */
    public max: number = 0;

    /** Gets or sets the group to use to display this block in the Inspector */
    public groupInInspector = "";

    /**
     * Gets or sets a boolean indicating that this input is displayed in the Inspector
     */
    public displayInInspector = true;

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<ParticleInputBlock>();

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeParticleBlockConnectionPointTypes {
        if (this._type === NodeParticleBlockConnectionPointTypes.AutoDetect) {
            if (this.value != null) {
                if (!isNaN(this.value)) {
                    this._type = NodeParticleBlockConnectionPointTypes.Float;
                    return this._type;
                }

                switch (this.value.getClassName()) {
                    case "Vector2":
                        this._type = NodeParticleBlockConnectionPointTypes.Vector2;
                        return this._type;
                    case "Vector3":
                        this._type = NodeParticleBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case "Vector4":
                        this._type = NodeParticleBlockConnectionPointTypes.Vector4;
                        return this._type;
                    case "Matrix":
                        this._type = NodeParticleBlockConnectionPointTypes.Matrix;
                        return this._type;
                }
            }
        }

        return this._type;
    }

    /**
     * Creates a new InputBlock
     * @param name defines the block name
     * @param type defines the type of the input (can be set to NodeParticleBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, type: NodeParticleBlockConnectionPointTypes = NodeParticleBlockConnectionPointTypes.AutoDetect) {
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
        if (this.type === NodeParticleBlockConnectionPointTypes.Float) {
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
        return "ParticleInputBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        switch (this.type) {
            case NodeParticleBlockConnectionPointTypes.Int:
            case NodeParticleBlockConnectionPointTypes.Float:
                this.value = 0;
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
                this.value = Vector2.Zero();
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                this.value = Vector3.Zero();
                break;
            case NodeParticleBlockConnectionPointTypes.Vector4:
                this.value = Vector4.Zero();
                break;
            case NodeParticleBlockConnectionPointTypes.Matrix:
                this.value = Matrix.Identity();
                break;
        }
    }

    public override async _buildAsync(state: NodeParticleBuildState) {
        await super._buildAsync(state);

        this.output._storedFunction = null;
        this.output._storedValue = this.value;
    }

    public override dispose() {
        this.onValueChangedObservable.clear();

        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.type = this.type;
        serializationObject.min = this.min;
        serializationObject.max = this.max;
        serializationObject.groupInInspector = this.groupInInspector;
        serializationObject.displayInInspector = this.displayInInspector;

        if (this._storedValue !== null) {
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

        this.min = serializationObject.min || 0;
        this.max = serializationObject.max || 0;
        this.groupInInspector = serializationObject.groupInInspector || "";
        if (serializationObject.displayInInspector !== undefined) {
            this.displayInInspector = serializationObject.displayInInspector;
        }

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

RegisterClass("BABYLON.ParticleInputBlock", ParticleInputBlock);
