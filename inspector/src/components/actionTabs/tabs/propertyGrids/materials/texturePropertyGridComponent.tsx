import * as React from "react";
import { Texture, BaseTexture, CubeTexture, Observable, Nullable } from "babylonjs";
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

interface ITexturePropertyGridComponentProps {
    texture: BaseTexture,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps> {

    private _adtInstrumentation: Nullable<BABYLON.GUI.AdvancedDynamicTextureInstrumentation>;

    constructor(props: ITexturePropertyGridComponentProps) {
        super(props);
    }

    componentWillMount() {
        const texture = this.props.texture

        if (!texture || !(texture as any).rootContainer) {
            return;
        }

        const adt = texture as BABYLON.GUI.AdvancedDynamicTexture;

        this._adtInstrumentation = new BABYLON.GUI.AdvancedDynamicTextureInstrumentation(adt);
        this._adtInstrumentation.captureRenderTime = true;
        this._adtInstrumentation.captureLayoutTime = true;
    }

    componentWillUnmount() {
        if (this._adtInstrumentation) {
            this._adtInstrumentation.dispose();
            this._adtInstrumentation = null;
        }
    }

    updateTexture(file: File) {
        const texture = this.props.texture;
        BABYLON.Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });
            var url = URL.createObjectURL(blob);

            if (texture.isCube) {
                let extension: string | undefined = undefined;
                if (file.name.toLowerCase().indexOf(".dds") > 0) {
                    extension = ".dds";
                } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                    extension = ".env";
                }

                (texture as CubeTexture).updateURL(url, extension, () => this.forceUpdate());
            } else {
                (texture as Texture).updateURL(url, null, () => this.forceUpdate());
            }

        }, undefined, true);
    }

    render() {
        const texture = this.props.texture;

        var samplingMode = [
            { label: "Nearest", value: BABYLON.Texture.NEAREST_NEAREST },
            { label: "Nearest & linear mip", value: BABYLON.Texture.NEAREST_LINEAR },
            { label: "Linear", value: BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR },
        ];

        return (
            <div className="pane">
                <LineContainerComponent title="PREVIEW">
                    <TextureLineComponent texture={texture} width={256} height={256} />
                    <FileButtonLineComponent label="Replace texture" onClick={(file) => this.updateTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
                </LineContainerComponent>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Unique ID" value={texture.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={texture.getClassName()} />
                    <TextLineComponent label="Has alpha" value={texture.hasAlpha ? "Yes" : "No"} />
                    <TextLineComponent label="Is 3D" value={texture.is3D ? "Yes" : "No"} />
                    <TextLineComponent label="Is cube" value={texture.isCube ? "Yes" : "No"} />
                    <TextLineComponent label="Is render target" value={texture.isRenderTarget ? "Yes" : "No"} />
                    <TextLineComponent label="Has mipmaps" value={!texture.noMipmap ? "Yes" : "No"} />
                    <SliderLineComponent label="UV set" target={texture} propertyName="coordinatesIndex" minimum={0} maximum={3} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        texture.updateSamplingMode &&
                        <OptionsLineComponent label="Sampling" options={samplingMode} target={texture} noDirectUpdate={true} propertyName="samplingMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={value => texture.updateSamplingMode(value)} />
                    }
                </LineContainerComponent>
                {
                    (texture as any).rootContainer &&
                    <LineContainerComponent title="ADVANCED TEXTURE PROPERTIES">
                        <ValueLineComponent label="Last layout time" value={this._adtInstrumentation!.renderTimeCounter.current} units="ms" />
                        <ValueLineComponent label="Last render time" value={this._adtInstrumentation!.layoutTimeCounter.current} units="ms" />
                        <SliderLineComponent label="Render scale" minimum={0.1} maximum={5} step={0.1} target={texture} propertyName="renderScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Premultiply alpha" target={texture} propertyName="premulAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Ideal width" target={texture} propertyName="idealWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Ideal height" target={texture} propertyName="idealHeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Use smallest ideal" target={texture} propertyName="useSmallestIdeal" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Render at ideal size" target={texture} propertyName="renderAtIdealSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </LineContainerComponent>
                }
                <LineContainerComponent title="TRANSFORM">
                    {
                        !texture.isCube &&
                        <div>
                            <FloatLineComponent lockObject={this.props.lockObject} label="U offset" target={texture} propertyName="uOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V offset" target={texture} propertyName="vOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="U scale" target={texture} propertyName="uScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V scale" target={texture} propertyName="vScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="U angle" target={texture} propertyName="uAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="V angle" target={texture} propertyName="vAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="W angle" target={texture} propertyName="wAng" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === BABYLON.Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapU = value ? BABYLON.Texture.CLAMP_ADDRESSMODE : BABYLON.Texture.WRAP_ADDRESSMODE} />
                            <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === BABYLON.Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapV = value ? BABYLON.Texture.CLAMP_ADDRESSMODE : BABYLON.Texture.WRAP_ADDRESSMODE} />
                        </div>
                    }
                    {
                        texture.isCube &&
                        <div>
                            <SliderLineComponent label="Rotation Y" minimum={0} maximum={2 * Math.PI} step={0.1} target={texture} propertyName="rotationY" />
                        </div>
                    }
                </LineContainerComponent>
            </div>
        );
    }
}