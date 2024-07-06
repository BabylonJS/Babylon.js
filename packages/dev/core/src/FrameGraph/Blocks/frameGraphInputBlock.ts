import { Observable } from "../../Misc/observable";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import type { FrameGraphBuildState } from "../frameGraphBuildState";

/**
 * Block used to expose an input value
 */
export class FrameGraphInputBlock extends FrameGraphBlock {
    private _storedValue: any;
    private _type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.Undefined;
    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<FrameGraphInputBlock>();
    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    public get type(): FrameGraphBlockConnectionPointTypes {
        if (this._type === FrameGraphBlockConnectionPointTypes.AutoDetect) {
            if (this.value != null) {
                if (this.value._isCamera) {
                    this._type = FrameGraphBlockConnectionPointTypes.Camera;
                    return this._type;
                }
                switch (this.value.getClassName()) {
                    case "TextureHandle":
                        this._type = FrameGraphBlockConnectionPointTypes.Texture;
                        return this._type;
                    case "RenderableList":
                        this._type = FrameGraphBlockConnectionPointTypes.RenderableList;
                        return this._type;
                }
            }
        }
        return this._type;
    }
    /**
     * Creates a new FrameGraphInputBlock
     * @param name defines the block name
     * @param type defines the type of the input (can be set to FrameGraphBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.AutoDetect) {
        super(name);
        this._type = type;
        this._isInput = true;
        this.setDefaultValue();
        this.registerOutput("output", type);
    }

    /**
     * Gets or sets the value of that point.
     */
    public get value(): any {
        return this._storedValue;
    }

    public set value(value: any) {
        this._storedValue = value;
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphInputBlock";
    }

    /**
     * Gets the frame graph output component
     */
    public get output(): FrameGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        switch (this.type) {
            case FrameGraphBlockConnectionPointTypes.Texture:
                this.value = undefined;
                break;
            case FrameGraphBlockConnectionPointTypes.Camera:
                this.value = undefined;
                break;
            case FrameGraphBlockConnectionPointTypes.RenderableList:
                this.value = undefined;
                break;
        }
    }

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);
    }

    public override dispose() {
        this.onValueChangedObservable.clear();
        super.dispose();
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        return super._dumpPropertiesCode() + codes.join(";\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.type = this.type;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this._type = serializationObject.type;
    }
}

RegisterClass("BABYLON.FrameGraphInputBlock", FrameGraphInputBlock);
