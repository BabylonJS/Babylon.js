import * as React from "react";

import type { Nullable } from "core/types";
import { Tools } from "core/Misc/tools";
import type { Observable } from "core/Misc/observable";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Constants } from "core/Engines/constants";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextureLineComponent } from "../../../lines/textureLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ValueLineComponent } from "shared-ui-components/lines/valueLineComponent";
import type { GlobalState } from "../../../../../components/globalState";

import { AdvancedDynamicTextureInstrumentation } from "gui/2D/adtInstrumentation";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { AnimationGridComponent } from "../animations/animationPropertyGridComponent";

import { PopupComponent } from "../../../../popupComponent";
import { TextureEditorComponent } from "./textures/textureEditorComponent";
import { EditAdvancedDynamicTexture } from "../../../../sceneExplorer/entities/gui/guiTools";

interface ITexturePropertyGridComponentProps {
    texture: BaseTexture;
    lockObject: LockObject;
    globalState: GlobalState;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

interface ITexturePropertyGridComponentState {
    isTextureEditorOpen: boolean;
    textureEditing: Nullable<BaseTexture>;
}

const textureFormat = [
    { label: "Alpha", normalizable: 0, value: Constants.TEXTUREFORMAT_ALPHA },
    { label: "Luminance", normalizable: 0, value: Constants.TEXTUREFORMAT_LUMINANCE },
    { label: "Luminance/Alpha", normalizable: 0, value: Constants.TEXTUREFORMAT_LUMINANCE_ALPHA },
    { label: "RGB", normalizable: 1, value: Constants.TEXTUREFORMAT_RGB },
    { label: "RGBA", normalizable: 1, value: Constants.TEXTUREFORMAT_RGBA },
    { label: "R (red)", normalizable: 1, value: Constants.TEXTUREFORMAT_RED },
    { label: "RG (red/green)", normalizable: 1, value: Constants.TEXTUREFORMAT_RG },
    { label: "R (red) integer", normalizable: 0, value: Constants.TEXTUREFORMAT_RED_INTEGER },
    { label: "RG (red/green) integer", normalizable: 0, value: Constants.TEXTUREFORMAT_RG_INTEGER },
    { label: "RGB integer", normalizable: 0, value: Constants.TEXTUREFORMAT_RGB_INTEGER },
    { label: "RGBA integer", normalizable: 0, value: Constants.TEXTUREFORMAT_RGBA_INTEGER },
    { label: "BGRA", normalizable: 1, value: Constants.TEXTUREFORMAT_BGRA },
    { label: "Depth24/Stencil8", normalizable: 0, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 },
    { label: "Depth32 float", normalizable: 0, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH32_FLOAT },
    { label: "Depth16", normalizable: 0, value: Constants.TEXTUREFORMAT_DEPTH16 },
    { label: "Depth24", normalizable: 0, value: Constants.TEXTUREFORMAT_DEPTH24 },
    { label: "Depth24Unorm/Stencil8", normalizable: 0, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 },
    { label: "Depth32Float/Stencil8", normalizable: 0, hideType: true, value: Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 },
    { label: "RGBA BPTC UNorm", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM },
    { label: "RGB BPTC UFloat", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT },
    { label: "RGB BPTC SFloat", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT },
    { label: "RGBA S3TC DXT5", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5 },
    { label: "RGBA S3TC DXT3", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3 },
    { label: "RGBA S3TC DXT1", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1 },
    { label: "RGB S3TC DXT1", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1 },
    { label: "RGBA ASTC 4x4", normalizable: 0, compressed: true, value: Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4 },
];

const textureType = [
    { label: "unsigned byte", normalizable: 1, value: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    { label: "32-bit float", normalizable: 0, value: Constants.TEXTURETYPE_FLOAT },
    { label: "16-bit float", normalizable: 0, value: Constants.TEXTURETYPE_HALF_FLOAT },
    { label: "signed byte", normalizable: 1, value: Constants.TEXTURETYPE_BYTE },
    { label: "signed short", normalizable: 0, value: Constants.TEXTURETYPE_SHORT },
    { label: "unsigned short", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_SHORT },
    { label: "signed int", normalizable: 0, value: Constants.TEXTURETYPE_INT },
    { label: "unsigned int", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_INTEGER },
    { label: "unsigned 4/4/4/4 short", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 },
    { label: "unsigned 5/5/5/1 short", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 },
    { label: "unsigned 5/6/5 short", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 },
    { label: "unsigned 2/10/10/10 int", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV },
    { label: "unsigned 24/8 int", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_INT_24_8 },
    { label: "unsigned 10f/11f/11f int", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV },
    { label: "unsigned 5/9/9/9 int", normalizable: 0, value: Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV },
    { label: "32-bits with only 8-bit used (stencil)", normalizable: 0, value: Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV },
];

export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps, ITexturePropertyGridComponentState> {
    private _adtInstrumentation: Nullable<AdvancedDynamicTextureInstrumentation>;
    private _popoutWindowRef: React.RefObject<PopupComponent>;
    private _textureLineRef: React.RefObject<TextureLineComponent>;

    private _textureInspectorSize = { width: 1024, height: 490 };

    constructor(props: ITexturePropertyGridComponentProps) {
        super(props);

        this.state = {
            isTextureEditorOpen: false,
            textureEditing: null,
        };
        const texture = this.props.texture;

        this._textureLineRef = React.createRef();
        this._popoutWindowRef = React.createRef();

        if (!texture || !(texture as any).rootContainer) {
            return;
        }

        const adt = texture as AdvancedDynamicTexture;

        this._adtInstrumentation = new AdvancedDynamicTextureInstrumentation(adt);
        this._adtInstrumentation!.captureRenderTime = true;
        this._adtInstrumentation!.captureLayoutTime = true;

        this.onOpenTextureEditor.bind(this);
        this.onCloseTextureEditor.bind(this);
        this.openTextureEditor.bind(this);
    }

    override componentWillUnmount() {
        if (this._adtInstrumentation) {
            this._adtInstrumentation.dispose();
            this._adtInstrumentation = null;
        }
    }

    updateTexture(file: File) {
        const texture = this.props.texture;
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;

                    if (texture.isCube) {
                        let extension: string | undefined = undefined;
                        if (file.name.toLowerCase().indexOf(".dds") > 0) {
                            extension = ".dds";
                        } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                            extension = ".env";
                        }

                        (texture as CubeTexture).updateURL(base64data, extension, () => this.forceRefresh());
                    } else {
                        (texture as Texture).updateURL(base64data, null, () => this.forceRefresh());
                    }
                };
            },
            undefined,
            true
        );
    }

    openTextureEditor() {
        if (this.state.isTextureEditorOpen) {
            this.onCloseTextureEditor(() => this.openTextureEditor());
            return;
        }
        this.setState({
            isTextureEditorOpen: true,
            textureEditing: this.props.texture,
        });
    }

    onOpenTextureEditor() {}

    onCloseTextureEditor(callback?: { (): void }) {
        this.setState(
            {
                isTextureEditorOpen: false,
                textureEditing: null,
            },
            callback
        );
    }

    forceRefresh() {
        this.forceUpdate();
        (this._textureLineRef.current as TextureLineComponent).updatePreview();
    }

    findTextureFormat(format: number) {
        for (let i = 0; i < textureFormat.length; ++i) {
            if (textureFormat[i].value === format) {
                return textureFormat[i];
            }
        }
        return null;
    }

    findTextureType(type: number) {
        for (let i = 0; i < textureType.length; ++i) {
            if (textureType[i].value === type) {
                return textureType[i];
            }
        }
        return null;
    }

    override render() {
        const texture = this.props.texture;
        const textureAsRTT = texture as RenderTargetTexture;

        const samplingMode = [
            { label: "Nearest", value: Texture.NEAREST_NEAREST }, // 1
            { label: "Linear", value: Texture.LINEAR_LINEAR }, // 2

            { label: "Linear & linear mip", value: Texture.LINEAR_LINEAR_MIPLINEAR }, // 3
            { label: "Linear & nearest mip", value: Texture.LINEAR_LINEAR_MIPNEAREST }, // 11

            { label: "Nearest & linear mip", value: Texture.NEAREST_NEAREST_MIPLINEAR }, // 8
            { label: "Nearest & nearest mip", value: Texture.NEAREST_NEAREST_MIPNEAREST }, // 4

            { label: "Nearest/Linear", value: Texture.NEAREST_LINEAR }, // 7
            { label: "Nearest/Linear & linear mip", value: Texture.NEAREST_LINEAR_MIPLINEAR }, // 6
            { label: "Nearest/Linear & nearest mip", value: Texture.NEAREST_LINEAR_MIPNEAREST }, // 5

            { label: "Linear/Nearest", value: Texture.LINEAR_NEAREST }, // 12
            { label: "Linear/Nearest & linear mip", value: Texture.LINEAR_NEAREST_MIPLINEAR }, // 10
            { label: "Linear/Nearest & nearest mip", value: Texture.LINEAR_NEAREST_MIPNEAREST }, // 9
        ];

        const coordinatesMode = [
            { label: "Explicit", value: Texture.EXPLICIT_MODE },
            { label: "Cubic", value: Texture.CUBIC_MODE },
            { label: "Inverse cubic", value: Texture.INVCUBIC_MODE },
            { label: "Equirectangular", value: Texture.EQUIRECTANGULAR_MODE },
            { label: "Fixed equirectangular", value: Texture.FIXED_EQUIRECTANGULAR_MODE },
            { label: "Fixed equirectangular mirrored", value: Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE },
            { label: "Planar", value: Texture.PLANAR_MODE },
            { label: "Projection", value: Texture.PROJECTION_MODE },
            { label: "Skybox", value: Texture.SKYBOX_MODE },
            { label: "Spherical", value: Texture.SPHERICAL_MODE },
        ];

        const format = texture._texture?.format ?? -2; // -2 is an invalid value so that findTextureFormat will return null when texture is null/undefined. It can't be -1 because -1 means RGBA, so it is -2 :)
        const type = texture._texture?.type ?? -2; // same than above, -1 means ubyte

        const oformat = this.findTextureFormat(format === -1 ? Constants.TEXTUREFORMAT_RGBA : format);
        const otype = this.findTextureType(type === -1 ? Constants.TEXTURETYPE_UNSIGNED_BYTE : type);
        const textureClass = texture instanceof MultiRenderTarget ? "MultiRenderTarget" : texture instanceof RenderTargetTexture ? "RenderTargetTexture" : texture.getClassName();
        const count = texture instanceof MultiRenderTarget ? texture.count : -1;
        const oformatDepthStencil =
            texture.isRenderTarget && textureAsRTT.renderTarget?._depthStencilTexture ? this.findTextureFormat(textureAsRTT.renderTarget._depthStencilTexture.format) : null;

        let extension = "";
        const url = (texture as Texture).url;
        const textureUrl = !url || url.substring(0, 4) === "data" || url.substring(0, 4) === "blob" ? "" : url;

        if (textureUrl) {
            for (let index = textureUrl.length - 1; index >= 0; index--) {
                if (textureUrl[index] === ".") {
                    break;
                }
                extension = textureUrl[index] + extension;
            }
        }

        return (
            <>
                <LineContainerComponent title="PREVIEW" selection={this.props.globalState}>
                    <TextureLineComponent ref={this._textureLineRef} texture={texture} width={256} height={256} globalState={this.props.globalState} />
                    <FileButtonLine label="Load texture from file" onClick={(file) => this.updateTexture(file)} accept=".jpg, .png, .tga, .dds, .env, .exr" />
                    <ButtonLineComponent
                        label="Edit"
                        onClick={() => {
                            if (this.props.texture instanceof AdvancedDynamicTexture) {
                                EditAdvancedDynamicTexture(this.props.texture as AdvancedDynamicTexture);
                            } else {
                                this.openTextureEditor();
                            }
                        }}
                    />
                    <TextInputLineComponent
                        label="URL"
                        value={textureUrl}
                        lockObject={this.props.lockObject}
                        onChange={(url) => {
                            (texture as Texture).updateURL(url);
                            this.forceRefresh();
                        }}
                    />
                </LineContainerComponent>
                {this.state.isTextureEditorOpen && (
                    <PopupComponent
                        id="texture-editor"
                        title="Texture Inspector"
                        size={this._textureInspectorSize}
                        onOpen={this.onOpenTextureEditor}
                        onClose={() => this.onCloseTextureEditor}
                        ref={this._popoutWindowRef}
                    >
                        <TextureEditorComponent texture={this.props.texture} url={textureUrl} window={this._popoutWindowRef} onUpdate={() => this.forceRefresh()} />
                    </PopupComponent>
                )}
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={texture}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Width" value={texture.getSize().width.toString()} />
                    <TextLineComponent label="Height" value={texture.getSize().height.toString()} />
                    {texture.is2DArray && <TextLineComponent label="Layers" value={texture._texture?.depth.toString() ?? "?"} />}
                    {texture.is3D && <TextLineComponent label="Depth" value={texture._texture?.depth.toString() ?? "?"} />}
                    {texture.isRenderTarget && (
                        <ButtonLineComponent
                            label="Scale up"
                            onClick={() => {
                                const scene = texture.getScene()!;
                                texture.scale(2);
                                setTimeout(() => {
                                    this.props.globalState.onSelectionChangedObservable.notifyObservers(scene.getTextureByUniqueId(texture.uniqueId));
                                });
                            }}
                        />
                    )}
                    {texture.isRenderTarget && (
                        <ButtonLineComponent
                            label="Scale down"
                            onClick={() => {
                                const scene = texture.getScene()!;
                                texture.scale(0.5);
                                setTimeout(() => {
                                    this.props.globalState.onSelectionChangedObservable.notifyObservers(scene.getTextureByUniqueId(texture.uniqueId));
                                });
                            }}
                        />
                    )}
                    <TextLineComponent label="Format" value={oformat?.label ?? "unknown"} />
                    {!oformat?.hideType && !oformat?.compressed && <TextLineComponent label="Type" value={otype?.label ?? "unknown"} />}
                    {!!oformat?.normalizable && !oformat?.compressed && !!otype?.normalizable && <TextLineComponent label="Normalized" value={otype.normalizable ? "Yes" : "No"} />}
                    <TextLineComponent label="Is compressed" value={oformat?.compressed ? "Yes" : "No"} />
                    <TextLineComponent label="Use sRGB buffers" value={texture._texture?._useSRGBBuffer ? "Yes" : "No"} />
                    <TextLineComponent label="Is Gamma space" value={texture.gammaSpace ? "Yes" : "No"} />
                    {extension && <TextLineComponent label="File format" value={extension} />}
                    <TextLineComponent label="Unique ID" value={texture.uniqueId.toString()} />
                    <TextLineComponent label="Internal Unique ID" value={(texture._texture?.uniqueId ?? "N/A").toString()} />
                    <TextLineComponent label="Class" value={textureClass} />
                    {count >= 0 && <TextLineComponent label="Number of textures" value={count.toString()} />}
                    <TextLineComponent label="Has alpha" value={texture.hasAlpha ? "Yes" : "No"} />
                    <CheckBoxLineComponent
                        label="Get alpha from RGB"
                        target={texture}
                        propertyName="getAlphaFromRGB"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Is 3D" value={texture.is3D ? "Yes" : "No"} />
                    <TextLineComponent label="Is 2D array" value={texture.is2DArray ? "Yes" : "No"} />
                    <TextLineComponent label="Is cube" value={texture.isCube ? "Yes" : "No"} />
                    <TextLineComponent label="Is render target" value={texture.isRenderTarget ? "Yes" : "No"} />
                    {texture.isRenderTarget && <TextLineComponent label="Depth/stencil texture format" value={oformatDepthStencil?.label ?? "no"} />}
                    {texture instanceof Texture && <TextLineComponent label="Stored as inverted on Y" value={texture.invertY ? "Yes" : "No"} />}
                    <TextLineComponent label="Has mipmaps" value={!texture.noMipmap ? "Yes" : "No"} />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="UV set"
                        target={texture}
                        propertyName="coordinatesIndex"
                        minimum={0}
                        maximum={3}
                        step={1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        decimalCount={0}
                    />
                    <OptionsLine
                        label="Mode"
                        options={coordinatesMode}
                        target={texture}
                        propertyName="coordinatesMode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => (texture.coordinatesMode = value as number)}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Level"
                        target={texture}
                        propertyName="level"
                        minimum={0}
                        maximum={2}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {texture.updateSamplingMode && (
                        <OptionsLine
                            label="Sampling"
                            options={samplingMode}
                            target={texture}
                            noDirectUpdate={true}
                            propertyName="samplingMode"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onSelect={(value) => texture.updateSamplingMode(value as number)}
                        />
                    )}
                </LineContainerComponent>
                {texture.getScene() && (
                    <AnimationGridComponent globalState={this.props.globalState} animatable={texture} scene={texture.getScene()!} lockObject={this.props.lockObject} />
                )}
                {(texture as any).rootContainer && this._adtInstrumentation && (
                    <LineContainerComponent title="ADVANCED TEXTURE PROPERTIES" selection={this.props.globalState}>
                        <ValueLineComponent label="Last layout time" value={this._adtInstrumentation!.renderTimeCounter.current} units="ms" />
                        <ValueLineComponent label="Last render time" value={this._adtInstrumentation!.layoutTimeCounter.current} units="ms" />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Render scale"
                            minimum={0.1}
                            maximum={5}
                            step={0.1}
                            target={texture}
                            propertyName="renderScale"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Premultiply alpha"
                            target={texture}
                            propertyName="premulAlpha"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Ideal width"
                            target={texture}
                            propertyName="idealWidth"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Ideal height"
                            target={texture}
                            propertyName="idealHeight"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Use smallest ideal"
                            target={texture}
                            propertyName="useSmallestIdeal"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Render at ideal size"
                            target={texture}
                            propertyName="renderAtIdealSize"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Invalidate Rect optimization"
                            target={texture}
                            propertyName="useInvalidateRectOptimization"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                )}
                <LineContainerComponent title="TRANSFORM" selection={this.props.globalState}>
                    {!texture.isCube && (
                        <div>
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="U offset"
                                target={texture}
                                propertyName="uOffset"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="V offset"
                                target={texture}
                                propertyName="vOffset"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="U scale"
                                target={texture}
                                propertyName="uScale"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="V scale"
                                target={texture}
                                propertyName="vScale"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="U angle"
                                useEuler={this.props.globalState.onlyUseEulers}
                                target={texture}
                                propertyName="uAng"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="V angle"
                                useEuler={this.props.globalState.onlyUseEulers}
                                target={texture}
                                propertyName="vAng"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="W angle"
                                useEuler={this.props.globalState.onlyUseEulers}
                                target={texture}
                                propertyName="wAng"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <CheckBoxLineComponent
                                label="Clamp U"
                                isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE}
                                onSelect={(value) => (texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE)}
                            />
                            <CheckBoxLineComponent
                                label="Clamp V"
                                isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE}
                                onSelect={(value) => (texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE)}
                            />
                        </div>
                    )}
                    {texture.isCube && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Rotation Y"
                                useEuler={this.props.globalState.onlyUseEulers}
                                minimum={0}
                                maximum={2 * Math.PI}
                                step={0.1}
                                target={texture}
                                propertyName="rotationY"
                            />
                        </div>
                    )}
                </LineContainerComponent>
            </>
        );
    }
}
