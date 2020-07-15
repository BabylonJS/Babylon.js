import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Tools } from "babylonjs/Misc/tools";
import { Observable } from "babylonjs/Misc/observable";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { CubeTexture } from "babylonjs/Materials/Textures/cubeTexture";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { TextureLineComponent } from "../../../lines/textureLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";
import { FileButtonLineComponent } from "../../../lines/fileButtonLineComponent";
import { LockObject } from "../lockObject";
import { ValueLineComponent } from "../../../lines/valueLineComponent";
import { GlobalState } from "../../../../../components/globalState";

import { AdvancedDynamicTextureInstrumentation } from "babylonjs-gui/2D/adtInstrumentation";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';

import { Engine } from 'babylonjs/Engines/engine';
import { PopupComponent } from '../../../../popupComponent';
import { TextureEditorComponent } from './textures/textureEditorComponent';

interface ITexturePropertyGridComponentProps {
    texture: BaseTexture,
    lockObject: LockObject,
    globalState: GlobalState,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps> {

    private _adtInstrumentation: Nullable<AdvancedDynamicTextureInstrumentation>;
    private textureLineRef: React.RefObject<TextureLineComponent>;

    private _isTextureEditorOpen = false;
    

    constructor(props: ITexturePropertyGridComponentProps) {
        super(props);

        const texture = this.props.texture;

        this.textureLineRef = React.createRef();

        if (!texture || !(texture as any).rootContainer) {
            return;
        }

        const adt = texture as AdvancedDynamicTexture;

        this._adtInstrumentation = new AdvancedDynamicTextureInstrumentation(adt);
        this._adtInstrumentation!.captureRenderTime = true;
        this._adtInstrumentation!.captureLayoutTime = true;
    }

    componentWillUnmount() {
        if (this._adtInstrumentation) {
            this._adtInstrumentation.dispose();
            this._adtInstrumentation = null;
        }
    }

    updateTexture(file: File) {
        const texture = this.props.texture;
        Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });

            var reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = () => {
                let base64data = reader.result as string;     

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

        }, undefined, true);
    }

    onOpenTextureEditor() {
        this._isTextureEditorOpen = true;
    }
    
    onCloseTextureEditor(window: Window | null) {
        this._isTextureEditorOpen = false;
        if (window !== null) {
            window.close();
        }
    }

    forceRefresh() {
        this.forceUpdate();
        (this.textureLineRef.current as TextureLineComponent).updatePreview();
    }

    render() {
        const texture = this.props.texture;

        var samplingMode = [
            { label: "Nearest", value: Texture.NEAREST_NEAREST },
            { label: "Nearest & linear mip", value: Texture.NEAREST_LINEAR },
            { label: "Linear", value: Texture.LINEAR_LINEAR_MIPLINEAR },
        ];

        var coordinatesMode = [
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

        let extension = "";
        let url = (texture as Texture).url;
        let textureUrl = (!url || url.substring(0, 4) === "data" || url.substring(0, 4) === "blob") ? "" : url;

        if (textureUrl) {
            for (var index = textureUrl.length - 1; index >= 0; index--) {
                if (textureUrl[index] === ".") {
                    break;
                }
                extension = textureUrl[index] + extension;
            }
        }

        const editable = texture.textureType != Engine.TEXTURETYPE_FLOAT && texture.textureType != Engine.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV && texture.textureType !== Engine.TEXTURETYPE_HALF_FLOAT;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="PREVIEW">
                    <TextureLineComponent ref={this.textureLineRef} texture={texture} width={256} height={256} globalState={this.props.globalState} />
                    <FileButtonLineComponent label="Load texture from file" onClick={(file) => this.updateTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
                    {editable &&
                        <ButtonLineComponent label="View" onClick={() => this.onOpenTextureEditor()} />
                    }
                    <TextInputLineComponent label="URL" value={textureUrl} lockObject={this.props.lockObject} onChange={url => {
                        (texture as Texture).updateURL(url);
                        this.forceRefresh();
                    }} />
                </LineContainerComponent>
                {this._isTextureEditorOpen && (
                <PopupComponent
                  id='texture-editor'
                  title='Texture Editor'
                  size={{ width: 1024, height: 490 }}
                  onOpen={(window: Window) => {}}
                  onClose={(window: Window) =>
                    this.onCloseTextureEditor(window)
                  }
                >
                    <TextureEditorComponent
                        globalState={this.props.globalState}
                        texture={this.props.texture}
                        url={textureUrl}
                    />
                </PopupComponent>)}
                <CustomPropertyGridComponent globalState={this.props.globalState} target={texture}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Width" value={texture.getSize().width.toString()} />
                    <TextLineComponent label="Height" value={texture.getSize().height.toString()} />
                    {
                        texture.isRenderTarget &&
                        <ButtonLineComponent label="Scale up" onClick={() => {
                            let scene = texture.getScene()!;
                            texture.scale(2);
                            setTimeout(() => {
                                this.props.globalState.onSelectionChangedObservable.notifyObservers(scene.getTextureByUniqueID(texture.uniqueId));
                            });
                        }} />
                    }
                    {
                        texture.isRenderTarget &&
                        <ButtonLineComponent label="Scale down" onClick={() => {                            
                            let scene = texture.getScene()!;
                            texture.scale(0.5);
                            setTimeout(() => {
                                this.props.globalState.onSelectionChangedObservable.notifyObservers(scene.getTextureByUniqueID(texture.uniqueId));
                            });
                        }} />
                    }
                    {
                        extension &&
                        <TextLineComponent label="File format" value={extension} />
                    }
                    <TextLineComponent label="Unique ID" value={texture.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={texture.getClassName()} />
                    <TextLineComponent label="Has alpha" value={texture.hasAlpha ? "Yes" : "No"} />
                    <TextLineComponent label="Is 3D" value={texture.is3D ? "Yes" : "No"} />
                    <TextLineComponent label="Is 2D array" value={texture.is2DArray ? "Yes" : "No"} />
                    <TextLineComponent label="Is cube" value={texture.isCube ? "Yes" : "No"} />
                    <TextLineComponent label="Is render target" value={texture.isRenderTarget ? "Yes" : "No"} />
                    {
                        (texture instanceof Texture) && 
                        <TextLineComponent label="Stored as inverted on Y" value={texture.invertY ? "Yes" : "No"} />
                    }
                    <TextLineComponent label="Has mipmaps" value={!texture.noMipmap ? "Yes" : "No"} />
                    <SliderLineComponent label="UV set" target={texture} propertyName="coordinatesIndex" minimum={0} maximum={3} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} decimalCount={0} />
                    <OptionsLineComponent label="Mode" options={coordinatesMode} target={texture} propertyName="coordinatesMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => texture.updateSamplingMode(value)} />
                    <SliderLineComponent label="Level" target={texture} propertyName="level" minimum={0} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        texture.updateSamplingMode &&
                        <OptionsLineComponent label="Sampling" options={samplingMode} target={texture} noDirectUpdate={true} propertyName="samplingMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => texture.updateSamplingMode(value)} />
                    }
                </LineContainerComponent>
                {
                    texture.getScene() &&
                    <AnimationGridComponent globalState={this.props.globalState} animatable={texture} scene={texture.getScene()!} lockObject={this.props.lockObject} />
                }
                {
                    (texture as any).rootContainer &&
                    <LineContainerComponent globalState={this.props.globalState} title="ADVANCED TEXTURE PROPERTIES">
                        <ValueLineComponent label="Last layout time" value={this._adtInstrumentation!.renderTimeCounter.current} units="ms" />
                        <ValueLineComponent label="Last render time" value={this._adtInstrumentation!.layoutTimeCounter.current} units="ms" />
                        <SliderLineComponent label="Render scale" minimum={0.1} maximum={5} step={0.1} target={texture} propertyName="renderScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Premultiply alpha" target={texture} propertyName="premulAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Ideal width" target={texture} propertyName="idealWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Ideal height" target={texture} propertyName="idealHeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Use smallest ideal" target={texture} propertyName="useSmallestIdeal" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Render at ideal size" target={texture} propertyName="renderAtIdealSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Invalidate Rect optimization" target={texture} propertyName="useInvalidateRectOptimization" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </LineContainerComponent>
                }
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORM">
                    {
                        !texture.isCube &&
                        <div>
                            <FloatLineComponent lockObject={this.props.lockObject} label="U offset" target={texture} propertyName="uOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V offset" target={texture} propertyName="vOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="U scale" target={texture} propertyName="uScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V scale" target={texture} propertyName="vScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="U angle" useEuler={this.props.globalState.onlyUseEulers} target={texture} propertyName="uAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V angle" useEuler={this.props.globalState.onlyUseEulers} target={texture} propertyName="vAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="W angle" useEuler={this.props.globalState.onlyUseEulers} target={texture} propertyName="wAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE} />
                            <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE} />
                        </div>
                    }
                    {
                        texture.isCube &&
                        <div>
                            <SliderLineComponent label="Rotation Y" useEuler={this.props.globalState.onlyUseEulers} minimum={0} maximum={2 * Math.PI} step={0.1} target={texture} propertyName="rotationY" />
                        </div>
                    }
                </LineContainerComponent>
            </div>
        );
    }
}