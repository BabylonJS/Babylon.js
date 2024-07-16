import { Observable } from "../../Misc/observable";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import type { FrameGraphBuildState } from "../frameGraphBuildState";
import type { Camera } from "../../Cameras/camera";
import type { ThinTexture } from "../../Materials/Textures/thinTexture";

export type FrameGraphResourceType = ThinTexture | Camera;

/**
 * Block used to expose an input value
 */
export class FrameGraphInputBlock extends FrameGraphBlock {
    private _storedValue: FrameGraphResourceType | undefined = undefined;
    private _type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.Undefined;
    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<FrameGraphInputBlock>();
    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    public get type(): FrameGraphBlockConnectionPointTypes {
        return this._type;
    }
    /**
     * Creates a new FrameGraphInputBlock
     * @param name defines the block name
     * @param type defines the type of the input (can be set to FrameGraphBlockConnectionPointTypes.Undefined)
     */
    public constructor(name: string, type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.Undefined) {
        super(name);
        this._type = type;
        this._isInput = true;
        this.registerOutput("output", type);
        this.output.value = this;
    }

    /**
     * Gets or sets the value of that point.
     */
    public get value(): FrameGraphResourceType | undefined {
        return this._storedValue;
    }

    public set value(value: FrameGraphResourceType) {
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
     * Gets the output component
     */
    public get output(): FrameGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Check if the block is a texture of any type
     * @returns true if the block is a texture
     */
    public isAnyTexture(): boolean {
        return (this.type & FrameGraphBlockConnectionPointTypes.TextureAll) !== 0;
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
