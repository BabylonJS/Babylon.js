/* eslint-disable import/no-internal-modules */
import type {
    NodeRenderGraphConnectionPoint,
    Scene,
    FrameGraph,
    NodeRenderGraphBuildState,
    Camera,
    InternalTexture,
    Nullable,
    FrameGraphTextureCreationOptions,
    FrameGraphTextureHandle,
    FrameGraphObjectList,
    IShadowLight,
} from "core/index";
import { Observable } from "../../../Misc/observable";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../../FrameGraph/frameGraphTypes";
import { Constants } from "../../../Engines/constants";

export type NodeRenderGraphValueType = InternalTexture | Camera | FrameGraphObjectList | IShadowLight;

export type NodeRenderGraphInputCreationOptions = FrameGraphTextureCreationOptions;

/**
 * Block used to expose an input value
 */
export class NodeRenderGraphInputBlock extends NodeRenderGraphBlock {
    private _storedValue: Nullable<NodeRenderGraphValueType> = null;
    private _type: NodeRenderGraphBlockConnectionPointTypes = NodeRenderGraphBlockConnectionPointTypes.Undefined;

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<NodeRenderGraphInputBlock>();

    /** Indicates that the input is externally managed */
    @editableInPropertyPage("Is external", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public isExternal = false;

    /** Gets or sets the options to create the input value */
    public creationOptions: NodeRenderGraphInputCreationOptions;

    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    public get type(): NodeRenderGraphBlockConnectionPointTypes {
        return this._type;
    }

    /**
     * Creates a new NodeRenderGraphInputBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param type defines the type of the input (can be set to NodeRenderGraphBlockConnectionPointTypes.Undefined)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, type: NodeRenderGraphBlockConnectionPointTypes = NodeRenderGraphBlockConnectionPointTypes.Undefined) {
        super(name, frameGraph, scene);

        this._type = type;
        this._isInput = true;
        this.registerOutput("output", type);
        this.setDefaultValue();
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        switch (this.type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth:
            case NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth:
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal:
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal:
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
            case NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition:
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition:
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
            case NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity:
            case NodeRenderGraphBlockConnectionPointTypes.TextureIrradiance:
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedoSqrt: {
                const options: FrameGraphTextureCreationOptions = {
                    size: { width: 100, height: 100 },
                    options: {
                        createMipMaps: false,
                        types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                        formats: [Constants.TEXTUREFORMAT_RGBA],
                        samples: 1,
                        useSRGBBuffers: [false],
                    },
                    sizeIsPercentage: true,
                };
                this.creationOptions = options;
                break;
            }
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment: {
                const options: FrameGraphTextureCreationOptions = {
                    size: { width: 100, height: 100 },
                    options: {
                        createMipMaps: false,
                        types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                        formats: [Constants.TEXTUREFORMAT_DEPTH24_STENCIL8],
                        useSRGBBuffers: [false],
                        labels: [this.name],
                        samples: 1,
                    },
                    sizeIsPercentage: true,
                };
                this.creationOptions = options;
                break;
            }
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList:
                this.value = { meshes: [], particleSystems: [] };
                this.isExternal = true;
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Camera:
                this.value = this._scene.cameras[0];
                this.isExternal = true;
                break;
            default:
                this.isExternal = true;
        }
    }

    /**
     * Gets or sets the value of that point.
     */
    public get value(): Nullable<NodeRenderGraphValueType> {
        return this._storedValue;
    }

    public set value(value: Nullable<NodeRenderGraphValueType>) {
        this._storedValue = value;
        this.output.value = undefined;
        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Gets the value as a specific type
     * @returns the value as a specific type
     */
    public getTypedValue<T extends NodeRenderGraphValueType>(): T {
        return this._storedValue as T;
    }

    /**
     * Gets the value as an internal texture
     * @returns The internal texture stored in value if value is an internal texture, otherwise null
     */
    public getInternalTextureFromValue(): Nullable<InternalTexture> {
        if ((this._storedValue as InternalTexture)._swapAndDie) {
            return this._storedValue as InternalTexture;
        }
        return null;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphInputBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Check if the block is a texture of any type
     * @returns true if the block is a texture
     */
    public isAnyTexture(): boolean {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.TextureAll) !== 0;
    }

    /**
     * Gets a boolean indicating that the connection point is the back buffer texture
     * @returns true if the connection point is the back buffer texture
     */
    public isBackBuffer() {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer) !== 0;
    }

    /**
     * Gets a boolean indicating that the connection point is a depth/stencil attachment texture
     * @returns true if the connection point is a depth/stencil attachment texture
     */
    public isBackBufferDepthStencilAttachment() {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment) !== 0;
    }

    /**
     * Check if the block is a camera
     * @returns true if the block is a camera
     */
    public isCamera(): boolean {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.Camera) !== 0;
    }

    /**
     * Check if the block is an object list
     * @returns true if the block is an object list
     */
    public isObjectList(): boolean {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.ObjectList) !== 0;
    }

    /**
     * Check if the block is a shadow light
     * @returns true if the block is a shadow light
     */
    public isShadowLight(): boolean {
        return (this.type & NodeRenderGraphBlockConnectionPointTypes.ShadowLight) !== 0;
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        if (this.isExternal) {
            if (this.isBackBuffer()) {
                this.output.value = backbufferColorTextureHandle;
            } else if (this.isBackBufferDepthStencilAttachment()) {
                this.output.value = backbufferDepthStencilTextureHandle;
            } else if (this.isCamera()) {
                this.output.value = this.getTypedValue<Camera>();
            } else if (this.isObjectList()) {
                this.output.value = this.getTypedValue<FrameGraphObjectList>();
            } else if (this.isShadowLight()) {
                this.output.value = this.getTypedValue<IShadowLight>();
            } else {
                if (this._storedValue === undefined || this._storedValue === null) {
                    throw new Error(`NodeRenderGraphInputBlock: External input "${this.name}" is not set`);
                }
                const texture = this.getInternalTextureFromValue();
                if (texture) {
                    this.output.value = this._frameGraph.textureManager.importTexture(this.name, texture, this.output.value as FrameGraphTextureHandle);
                }
            }
            return;
        }

        if ((this.type & NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer) !== 0) {
            const textureCreateOptions = this.creationOptions as FrameGraphTextureCreationOptions;

            if (!textureCreateOptions) {
                throw new Error(`NodeRenderGraphInputBlock: Creation options are missing for texture "${this.name}"`);
            }

            this.output.value = this._frameGraph.textureManager.createRenderTargetTexture(this.name, textureCreateOptions);
        }
    }

    public override dispose() {
        this._storedValue = null;
        this.onValueChangedObservable.clear();
        super.dispose();
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.isExternal = ${this.isExternal};`);
        if (this.isAnyTexture()) {
            if (!this.isExternal) {
                codes.push(`${this._codeVariableName}.creationOptions = ${JSON.stringify(this.creationOptions)};`);
            } else {
                codes.push(`${this._codeVariableName}.value = EXTERNAL_TEXTURE; // TODO: set the external texture`);
            }
        } else if (this.isCamera()) {
            codes.push(`${this._codeVariableName}.value = EXTERNAL_CAMERA; // TODO: set the external camera`);
        } else if (this.isObjectList()) {
            codes.push(`${this._codeVariableName}.value = EXTERNAL_OBJECT_LIST; // TODO: set the external object list`);
        } else if (this.isShadowLight()) {
            codes.push(`${this._codeVariableName}.value = EXTERNAL_SHADOW_LIGHT; // TODO: set the external shadow light`);
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
        this.output.type = this._type;
        this.isExternal = serializationObject.isExternal;
        if (serializationObject.creationOptions) {
            if (serializationObject.creationOptions.options.depthTextureFormat !== undefined) {
                // Backward compatibility - remove this code in the future
                serializationObject.creationOptions.options.formats = [serializationObject.creationOptions.options.depthTextureFormat];
            }
            this.creationOptions = serializationObject.creationOptions;
        }
    }
}

RegisterClass("BABYLON.NodeRenderGraphInputBlock", NodeRenderGraphInputBlock);
