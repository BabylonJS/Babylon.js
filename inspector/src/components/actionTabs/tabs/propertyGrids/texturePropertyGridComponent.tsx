import * as React from "react";
import { Texture, Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { SliderLineComponent } from "../../lines/sliderLineComponent";
import { TextLineComponent } from "../../lines/textLineComponent";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";
import { TextureLineComponent } from "../../lines/textureLineComponent";
import { FloatLineComponent } from "../../lines/floatLineComponent";

interface ITexturePropertyGridComponentProps {
    texture: Texture,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps> {
    constructor(props: ITexturePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const texture = this.props.texture;

        return (
            <div className="pane">
                <LineContainerComponent title="PREVIEW">
                    <TextureLineComponent texture={texture} width={256} height={256} />
                </LineContainerComponent>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Has alpha" value={texture.hasAlpha ? "Yes" : "No"} />
                    <TextLineComponent label="Is 3D" value={texture.is3D ? "Yes" : "No"} />
                    <TextLineComponent label="Is cube" value={texture.isCube ? "Yes" : "No"} />
                    <TextLineComponent label="Is render target" value={texture.isRenderTarget ? "Yes" : "No"} />
                    <TextLineComponent label="Has mipmaps" value={!texture.noMipmap ? "Yes" : "No"} />
                    <SliderLineComponent label="UV set" target={texture} propertyName="coordinatesIndex" minimum={0} maximum={3} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSFORM">
                    <FloatLineComponent label="U offset" target={texture} propertyName="uOffset" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="V offset" target={texture} propertyName="vOffset" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="V scale" target={texture} propertyName="uScale" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="V scale" target={texture} propertyName="vScale" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="U angle" target={texture} propertyName="uAng" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="V angle" target={texture} propertyName="vAng" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="W angle" target={texture} propertyName="wAng" step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === BABYLON.Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapU = value ? BABYLON.Texture.CLAMP_ADDRESSMODE : BABYLON.Texture.WRAP_ADDRESSMODE} />
                    <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === BABYLON.Texture.CLAMP_ADDRESSMODE} onSelect={(value) => texture.wrapV = value ? BABYLON.Texture.CLAMP_ADDRESSMODE : BABYLON.Texture.WRAP_ADDRESSMODE} />
                </LineContainerComponent>
            </div>
        );
    }
}