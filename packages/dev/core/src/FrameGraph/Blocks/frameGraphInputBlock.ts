import { Observable } from "../../Misc/observable";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import type { FrameGraphBuilder } from "../frameGraphBuilder";
import type { Camera } from "../../Cameras/camera";
import type { ThinTexture } from "../../Materials/Textures/thinTexture";
import type { RenderTargetCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../Decorators/nodeDecorator";
import type { Vector3 } from "../../Maths/math.vector";
import type { RenderTargetWrapper } from "../../Engines/renderTargetWrapper";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { AbstractEngine } from "../../Engines/abstractEngine";

export type FrameGraphInputType = ThinTexture | RenderTargetWrapper | Camera;

export type FrameGraphInputTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

export type FrameGraphInputCameraCreationOptions = {
    /** TODO */
    position: Vector3;
};

export type FrameGraphInputCreationOptions = FrameGraphInputTextureCreationOptions | FrameGraphInputCameraCreationOptions;

/**
 * Block used to expose an input value
 */
export class FrameGraphInputBlock extends FrameGraphBlock {
    private _storedValue: Nullable<FrameGraphInputType> = null;
    private _type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.Undefined;

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<FrameGraphInputBlock>();

    /** Indicates that the input is externally managed */
    @editableInPropertyPage("Is external", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public isExternal = false;

    /** Gets or sets the options to create the input value */
    public creationOptions: FrameGraphInputCreationOptions;

    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    public get type(): FrameGraphBlockConnectionPointTypes {
        return this._type;
    }

    /**
     * Creates a new FrameGraphInputBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     * @param type defines the type of the input (can be set to FrameGraphBlockConnectionPointTypes.Undefined)
     */
    public constructor(name: string, engine: AbstractEngine, type: FrameGraphBlockConnectionPointTypes = FrameGraphBlockConnectionPointTypes.Undefined) {
        super(name, engine);
        this._type = type;
        this._isInput = true;
        this.registerOutput("output", type);
        this.output.value = this;
    }

    /**
     * Gets or sets the value of that point.
     */
    public get value(): Nullable<FrameGraphInputType> {
        return this._storedValue;
    }

    public set value(value: Nullable<FrameGraphInputType>) {
        this._storedValue = value;
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Gets the value as a specific type
     * @returns the value as a specific type
     */
    public getTypedValue<T extends FrameGraphInputType>(): Nullable<T> {
        return this._storedValue as T;
    }

    /**
     * Gets the value as a render target wrapper
     * @returns The value as a render target wrapper if it is a render target wrapper, otherwise undefined
     */
    public getValueAsRenderTargetWrapper(): Nullable<RenderTargetWrapper> {
        if ((this._storedValue as RenderTargetWrapper).shareDepth) {
            return this._storedValue as RenderTargetWrapper;
        }
        return null;
    }

    /**
     * Gets the value as a render target wrapper
     * @returns The internal texture stored in value if value is a render target wrapper or a thin texture, otherwise null
     */
    public getInternalTextureFromValue(): Nullable<InternalTexture> {
        if ((this._storedValue as RenderTargetWrapper).shareDepth) {
            return (this._storedValue as RenderTargetWrapper).texture;
        } else if ((this._storedValue as ThinTexture).getInternalTexture) {
            return (this._storedValue as ThinTexture).getInternalTexture();
        }
        return null;
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

    /**
     * Gets a boolean indicating that the connection point is the back buffer texture
     * @returns true if the connection point is the back buffer texture
     */
    public isBackBuffer() {
        return (this.type & FrameGraphBlockConnectionPointTypes.TextureBackBuffer) !== 0;
    }

    /**
     * Gets a boolean indicating that the connection point is a depth/stencil attachment texture
     * @returns true if the connection point is a depth/stencil attachment texture
     */
    public isBackBufferDepthStencilAttachment() {
        return (this.type & FrameGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment) !== 0;
    }

    protected override _buildBlock(builder: FrameGraphBuilder) {
        super._buildBlock(builder);

        if (this.isExternal) {
            if (this._storedValue === undefined || this._storedValue === null) {
                throw new Error(`FrameGraphInputBlock: External input "${this.name}" is not set`);
            }
            return;
        }

        if ((this.type & FrameGraphBlockConnectionPointTypes.TextureAllButBackBuffer) !== 0) {
            const textureCreateOptions = this.creationOptions as FrameGraphInputTextureCreationOptions;

            if (!textureCreateOptions) {
                throw new Error(`FrameGraphInputBlock: Creation options are missing for texture "${this.name}"`);
            }

            const size = textureCreateOptions.sizeIsPercentage
                ? {
                      width: (this._engine.getRenderWidth() * (textureCreateOptions.size as { width: number }).width) / 100,
                      height: (this._engine.getRenderHeight() * (textureCreateOptions.size as { height: number }).height) / 100,
                  }
                : textureCreateOptions.size;

            this.value = builder.createRenderTargetTexture(this.name, size, textureCreateOptions.options);
        }
    }

    public override dispose() {
        this._storedValue = null;
        this.onValueChangedObservable.clear();
        super.dispose();
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        if (this.isAnyTexture()) {
            codes.push(`${this._codeVariableName}.isExternal = ${this.isExternal};`);
            if (!this.isExternal) {
                codes.push(`${this._codeVariableName}.creationOptions = ${JSON.stringify(this.creationOptions)};`);
            } else {
                codes.push(`${this._codeVariableName}.value = external_texture; // TODO: set the external texture`);
            }
        }
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.type = this.type;
        serializationObject.isExternal = this.isExternal;
        if (this.creationOptions) {
            serializationObject.creationOptions = this.creationOptions;
        }
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this._type = serializationObject.type;
        this.isExternal = serializationObject.isExternal;
        if (serializationObject.creationOptions) {
            this.creationOptions = serializationObject.creationOptions;
        }
    }
}

RegisterClass("BABYLON.FrameGraphInputBlock", FrameGraphInputBlock);
