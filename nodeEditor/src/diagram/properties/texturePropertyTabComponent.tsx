
import * as React from "react";
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
import { ReflectionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectionBlock';
import { RefractionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/refractionBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from './genericNodePropertyComponent';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';

type ReflectionTexture = ReflectionTextureBlock | ReflectionBlock | RefractionBlock;

type AnyTexture = TextureBlock | ReflectionTexture | CurrentScreenBlock | ParticleTextureBlock;

export class TexturePropertyTabComponent extends React.Component<IPropertyComponentProps, {isEmbedded: boolean, loadAsCubeTexture: boolean}> {

    get textureBlock(): AnyTexture {
        return this.props.block as AnyTexture;
    }

    constructor(props: IPropertyComponentProps) {
        super(props);

        let texture = this.textureBlock.texture as BaseTexture;

        this.state = {isEmbedded: !texture || texture.name.substring(0, 4) === "data", loadAsCubeTexture: texture && texture.isCube};
    }

    UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: {isEmbedded: boolean, loadAsCubeTexture: boolean}) {
        if (nextProps.block !== this.props.block) {
            let texture = (nextProps.block as AnyTexture).texture as BaseTexture;

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
        let texture = this.textureBlock.texture as BaseTexture;

        if (texture) {
            texture.dispose();
            (texture as any) = null;
            this.textureBlock.texture = null;
        }

        this.updateAfterTextureLoad();
    }

    _prepareTexture() {
        let texture = this.textureBlock.texture as BaseTexture;

        if (texture && texture.isCube !== this.state.loadAsCubeTexture) {
            texture.dispose();
            (texture as any) = null;
        }

        if (!texture) {
            if (!this.state.loadAsCubeTexture) {
                this.textureBlock.texture = new Texture(null, this.props.globalState.nodeMaterial.getScene(), false, 
                    this.textureBlock instanceof ReflectionTextureBlock || this.textureBlock instanceof ReflectionBlock || this.textureBlock instanceof RefractionBlock || this.props.globalState.mode === NodeMaterialModes.PostProcess);
                texture = this.textureBlock.texture;
                texture.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
            } else {
                this.textureBlock.texture = new CubeTexture("", this.props.globalState.nodeMaterial.getScene());
                texture = this.textureBlock.texture;
                texture.coordinatesMode = Texture.CUBIC_MODE;
            }
        }  
    }

	/**
	 * Replaces the texture of the node
	 * @param file the file of the texture to use
	 */
    replaceTexture(file: File) {
        this._prepareTexture();

        let texture = this.textureBlock.texture as BaseTexture;
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

        let texture = this.textureBlock.texture as BaseTexture;       
        if (texture.isCube || this.textureBlock instanceof ReflectionTextureBlock || this.textureBlock instanceof ReflectionBlock || this.textureBlock instanceof RefractionBlock) {
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

        let texture = this.textureBlock.texture as BaseTexture;
        if (texture && texture.name && texture.name.substring(0, 4) !== "data") {
            url = texture.name;
        }

        url = url.replace(/\?nocache=\d+/, "");

        let isInReflectionMode = this.textureBlock instanceof ReflectionTextureBlock || this.textureBlock instanceof ReflectionBlock || this.textureBlock instanceof RefractionBlock;
        let isFrozenTexture = this.textureBlock instanceof CurrentScreenBlock || this.textureBlock instanceof ParticleTextureBlock;

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
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Auto select UV" propertyName="autoSelectUV" target={this.props.block} onValueChanged={() => {                        
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                    }}/> 
                    {
                        texture && !isInReflectionMode &&
                        <CheckBoxLineComponent label="Convert to gamma space" propertyName="convertToGammaSpace" target={this.props.block} onValueChanged={() => {                        
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}/>
                    }
                    {
                        texture && !isInReflectionMode &&
                        <CheckBoxLineComponent label="Convert to linear space" propertyName="convertToLinearSpace" target={this.props.block} onValueChanged={() => {                        
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}/>
                    }
                    {
                        texture && isInReflectionMode &&
                        <OptionsLineComponent label="Reflection mode" options={reflectionModeOptions} target={texture} propertyName="coordinatesMode" onSelect={(value: any) => {
                            texture.coordinatesMode = value;
                            this.forceUpdate();
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }                    
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <CheckBoxLineComponent label="Clamp U" isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <CheckBoxLineComponent label="Clamp V" isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE} onSelect={(value) => {
                            texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }        
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Offset U" target={texture} propertyName="uOffset" 
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Offset V" target={texture} propertyName="vOffset"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Scale U" target={texture} propertyName="uScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <FloatLineComponent globalState={this.props.globalState} label="Scale V" target={texture} propertyName="vScale"
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <SliderLineComponent label="Rotation U" target={texture} propertyName="uAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
                        <SliderLineComponent label="Rotation V" target={texture} propertyName="vAng" minimum={0} maximum={Math.PI * 2} useEuler={true} step={0.1}
                        onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        }}
                        />
                    }                    
                    {
                        texture && !isInReflectionMode && !isFrozenTexture &&
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
                        this.textureBlock.texture = null;
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
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
            </div>
        );
    }
}