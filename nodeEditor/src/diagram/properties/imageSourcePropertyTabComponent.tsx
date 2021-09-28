
import * as React from "react";
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { ImageSourceBlock } from 'babylonjs/Materials/Node/Blocks/Dual/imageSourceBlock';
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from './genericNodePropertyComponent';
import { FloatLineComponent } from "../../sharedComponents/floatLineComponent";
import { SliderLineComponent } from "../../sharedComponents/sliderLineComponent";

export class ImageSourcePropertyTabComponent extends React.Component<IPropertyComponentProps, {isEmbedded: boolean}> {

    get imageSourceBlock(): ImageSourceBlock {
        return this.props.block as ImageSourceBlock;
    }

    constructor(props: IPropertyComponentProps) {
        super(props);

        let texture = this.imageSourceBlock.texture as BaseTexture;

        this.state = {isEmbedded: !texture || texture.name.substring(0, 4) === "data"};
    }

    UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: {isEmbedded: boolean, loadAsCubeTexture: boolean}) {
        if (nextProps.block !== this.props.block) {
            let texture = (nextProps.block as ImageSourceBlock).texture as BaseTexture;

            nextState.isEmbedded = !texture || texture.name.substring(0, 4) === "data";
            nextState.loadAsCubeTexture = texture && texture.isCube;
        }
    }

    private _generateRandomForCache() {
        return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, (c) => {
            var r = Math.random() * 10 | 0;
            return r.toString();
        });
    }


    updateAfterTextureLoad() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
        this.forceUpdate();
    }

    removeTexture() {
        let texture = this.imageSourceBlock.texture as BaseTexture;

        if (texture) {
            texture.dispose();
            (texture as any) = null;
            this.imageSourceBlock.texture = null;
        }

        this.updateAfterTextureLoad();
    }

    _prepareTexture() {
        let texture = this.imageSourceBlock.texture as BaseTexture;

        if (texture) {
            texture.dispose();
            (texture as any) = null;
        }

        if (!texture) {
            this.imageSourceBlock.texture = new Texture(null, this.props.globalState.nodeMaterial.getScene(), false, false);
            texture = this.imageSourceBlock.texture;
            texture.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
        }  
    }

	/**
	 * Replaces the texture of the node
	 * @param file the file of the texture to use
	 */
    replaceTexture(file: File) {
        this._prepareTexture();

        let texture = this.imageSourceBlock.texture as BaseTexture;
        Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });

            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                let base64data = reader.result as string;                

                let extension: string | undefined = undefined;
                if (file.name.toLowerCase().indexOf(".dds") > 0) {
                    extension = ".dds";
                } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                    extension = ".env";
                }
                (texture as Texture).updateURL(base64data, extension, () => this.updateAfterTextureLoad());
            }
        }, undefined, true);
    }

    replaceTextureWithUrl(url: string) {
        this._prepareTexture();

        let texture = this.imageSourceBlock.texture as BaseTexture;       
        (texture as Texture).updateURL(url, null, () => this.updateAfterTextureLoad());
    }

    render() {
        let url = "";

        let texture = this.imageSourceBlock.texture as BaseTexture;
        if (texture && texture.name && texture.name.substring(0, 4) !== "data") {
            url = texture.name;
        }

        url = url.replace(/\?nocache=\d+/, "");

        var samplingMode = [
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
        
        return (
            <div>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    {
                        texture && texture.updateSamplingMode &&
                        <OptionsLineComponent label="Sampling" options={samplingMode} target={texture} noDirectUpdate={true} propertyName="samplingMode" onSelect={(value) => {
                            texture.updateSamplingMode(value as number);
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }} />
                    }
   {
                        texture &&
                        <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }} />
                    }
                    {
                        texture &&
                        <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }} />
                    }        
                    {
                        texture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Offset U" target={texture} propertyName="uOffset" 
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }}
                        />
                    }
                    {
                        texture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Offset V" target={texture} propertyName="vOffset"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }}
                        />
                    }
                    {
                        texture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Scale U" target={texture} propertyName="uScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }} />
                    }
                    {
                        texture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Scale V" target={texture} propertyName="vScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }} />
                    }
                    {
                        texture &&
                        <SliderLineComponent label="Rotation U" target={texture} globalState={this.props.globalState} propertyName="uAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }}
                        />
                    }
                    {
                        texture &&
                        <SliderLineComponent label="Rotation V" target={texture} globalState={this.props.globalState} propertyName="vAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }}
                        />
                    }                    
                    {
                        texture &&
                        <SliderLineComponent label="Rotation W" target={texture} globalState={this.props.globalState} propertyName="wAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        }}
                        />
                    }                    
                </LineContainerComponent>
                <LineContainerComponent title="SOURCE">
                    <CheckBoxLineComponent label="Embed static texture" isSelected={() => this.state.isEmbedded} onSelect={value => {
                        this.setState({isEmbedded: value});
                        this.imageSourceBlock.texture = null;
                        this.updateAfterTextureLoad();
                    }}/>
                    {
                        this.state.isEmbedded &&
                        <FileButtonLineComponent label="Upload" onClick={(file) => this.replaceTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
                    }
                    {
                        !this.state.isEmbedded &&
                        <TextInputLineComponent label="Link" globalState={this.props.globalState} value={url} onChange={newUrl => this.replaceTextureWithUrl(newUrl)}/>
                    }
                    {
                        !this.state.isEmbedded && url &&
                        <ButtonLineComponent label="Refresh" onClick={() => this.replaceTextureWithUrl(url + "?nocache=" + this._generateRandomForCache())}/>
                    }
                    {
                        texture &&
                        <ButtonLineComponent label="Remove" onClick={() => this.removeTexture()}/>
                    }
                </LineContainerComponent>
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
            </div>
        );
    }
}
