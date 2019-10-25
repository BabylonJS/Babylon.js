
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { FileButtonLineComponent } from '../../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { TextureNodeModel } from './textureNodeModel';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { CheckBoxLineComponent } from '../../../sharedComponents/checkBoxLineComponent';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { SliderLineComponent } from '../../../sharedComponents/sliderLineComponent';
import { FloatLineComponent } from '../../../sharedComponents/floatLineComponent';
import { ButtonLineComponent } from '../../../sharedComponents/buttonLineComponent';
import { ReflectionTextureNodeModel } from '../reflectionTexture/reflectionTextureNodeModel';
import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';
import { OptionsLineComponent } from '../../../sharedComponents/optionsLineComponent';

interface ITexturePropertyTabComponentProps {
    globalState: GlobalState;
    node: TextureNodeModel | ReflectionTextureNodeModel;
}

export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps, {isEmbedded: boolean, loadAsCubeTexture: boolean}> {

    constructor(props: ITexturePropertyTabComponentProps) {
        super(props);

        let texture = this.props.node.texture as BaseTexture;

        this.state = {isEmbedded: !texture || texture.name.substring(0, 4) === "data", loadAsCubeTexture: texture && texture.isCube};
    }

    UNSAFE_componentWillUpdate(nextProps: ITexturePropertyTabComponentProps, nextState: {isEmbedded: boolean, loadAsCubeTexture: boolean}) {
        if (nextProps.node !== this.props.node) {
            let texture = nextProps.node.texture as BaseTexture;

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
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    removeTexture() {
        let texture = this.props.node.texture as BaseTexture;

        if (texture) {
            texture.dispose();
            (texture as any) = null;
            this.props.node.texture = null;
        }

        this.updateAfterTextureLoad();
    }

    _prepareTexture() {
        let texture = this.props.node.texture as BaseTexture;

        if (texture && texture.isCube !== this.state.loadAsCubeTexture) {
            texture.dispose();
            (texture as any) = null;
        }

        if (!texture) {
            if (!this.state.loadAsCubeTexture) {
                this.props.node.texture = new Texture(null, this.props.globalState.nodeMaterial.getScene(), false, this.props.node instanceof ReflectionTextureNodeModel);
                texture = this.props.node.texture;
                texture.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
            } else {
                this.props.node.texture = new CubeTexture("", this.props.globalState.nodeMaterial.getScene());
                texture = this.props.node.texture;
                texture.coordinatesMode = Texture.CUBIC_MODE;
            }
        }  
    }

	/**
	 * Replaces the texture of the node
	 * @param file the file of the texture to use
	 */
    replaceTexture(file: File) {
        if (!this.props.node) {
            return;
        }

        this._prepareTexture();

        let texture = this.props.node.texture as BaseTexture;
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

        let texture = this.props.node.texture as BaseTexture;       
        if (texture.isCube || this.props.node instanceof ReflectionTextureNodeModel) {
            let extension: string | undefined = undefined;
            if (url.toLowerCase().indexOf(".dds") > 0) {
                extension = ".dds";
            } else if (url.toLowerCase().indexOf(".env") > 0) {
                extension = ".env";
            }

            (texture as Texture).updateURL(url, extension, () => this.updateAfterTextureLoad());
        } else {
            (texture as Texture).updateURL(url, null, () => this.updateAfterTextureLoad());
        }
    }

    render() {
        let url = "";

        let texture = this.props.node.texture as BaseTexture;
        if (texture && texture.name && texture.name.substring(0, 4) !== "data") {
            url = texture.name;
        }

        url = url.replace(/\?nocache=\d+/, "");

        let isInReflectionMode = this.props.node instanceof ReflectionTextureNodeModel;

        var reflectionModeOptions: {label: string, value: number}[] = [
            {
                label: "Cubic", value: Texture.CUBIC_MODE
            },
            {                
                label: "Equirectangular", value: Texture.EQUIRECTANGULAR_MODE
            },
            {
                label: "Explicit", value: Texture.EXPLICIT_MODE
            },
            {
                label: "Fixed equirectangular", value: Texture.FIXED_EQUIRECTANGULAR_MODE
            },
            {
                label: "Fixed mirrored equirectangular", value: Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE
            },
            {
                label: "Planar", value: Texture.PLANAR_MODE
            },              
            {
                label: "Projection", value: Texture.PROJECTION_MODE
            },         
            {
                label: "Skybox", value: Texture.SKYBOX_MODE
            },         
            {
                label: "Spherical", value: Texture.SPHERICAL_MODE
            },
        ];
        
        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value={this.props.node.block!.getClassName()} />
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.node.block!} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Auto select UV" propertyName="autoSelectUV" target={this.props.node.block!} onValueChanged={() => {                        
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                    }}/> 
                    {
                        texture && isInReflectionMode &&
                        <OptionsLineComponent label="Reflection mode" options={reflectionModeOptions} target={texture} propertyName="coordinatesMode" onSelect={(value: any) => {
                            texture.coordinatesMode = value;
                            this.forceUpdate();
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }                    
                    {
                        texture && !isInReflectionMode &&
                        <CheckBoxLineComponent label="Gamma space" propertyName="gammaSpace" target={texture} onValueChanged={() => {                        
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}/>
                    }
                    {
                        texture && !isInReflectionMode &&
                        <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }        
                    {
                        texture && !isInReflectionMode &&
                        <FloatLineComponent label="Offset U" target={texture} propertyName="uOffset" 
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <FloatLineComponent label="Offset V" target={texture} propertyName="vOffset"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <FloatLineComponent label="Scale U" target={texture} propertyName="uScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <FloatLineComponent label="Scale V" target={texture} propertyName="vScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <SliderLineComponent label="Rotation U" target={texture} propertyName="uAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode &&
                        <SliderLineComponent label="Rotation V" target={texture} propertyName="vAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }                    
                    {
                        texture && !isInReflectionMode &&
                        <SliderLineComponent label="Rotation W" target={texture} propertyName="wAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                </LineContainerComponent>
                <LineContainerComponent title="SOURCE">
                    <CheckBoxLineComponent label="Embed static texture" isSelected={() => this.state.isEmbedded} onSelect={value => {
                        this.setState({isEmbedded: value});
                        this.props.node.texture = null;
                        this.updateAfterTextureLoad();
                    }}/>
                    {
                        isInReflectionMode &&
                        <CheckBoxLineComponent label="Load as cube texture" isSelected={() => this.state.loadAsCubeTexture} 
                            onSelect={value => this.setState({loadAsCubeTexture: value})}/> 
                    }
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
            </div>
        );
    }
}