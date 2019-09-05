
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

interface ITexturePropertyTabComponentProps {
    globalState: GlobalState;
    node: TextureNodeModel;
}

export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps, {isEmbedded: boolean}> {

    constructor(props: ITexturePropertyTabComponentProps) {
        super(props);

        let texture = this.props.node.texture as BaseTexture;

        this.state = {isEmbedded: !texture || texture.name.substring(0, 4) !== "http"};
    }


    updateAftertextureLoad() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

	/**
	 * Replaces the texture of the node
	 * @param file the file of the texture to use
	 */
    replaceTexture(file: File) {
        if (!this.props.node) {
            return;
        }

        let texture = this.props.node.texture as BaseTexture;
        if (!texture) {
            this.props.node.texture = new Texture(null, this.props.globalState.nodeMaterial.getScene(), false, false);
            texture = this.props.node.texture;
        }

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

                    (texture as Texture).updateURL(base64data, extension, () => this.updateAftertextureLoad());
                } else {
                    (texture as Texture).updateURL(base64data, null, () => this.updateAftertextureLoad());
                }
            }
        }, undefined, true);
    }

    replaceTextureWithUrl(url: string) {
        let texture = this.props.node.texture as BaseTexture;
        if (!texture) {
            this.props.node.texture = new Texture(url, this.props.globalState.nodeMaterial.getScene(), false, false, undefined, () => {
                this.updateAftertextureLoad();
            });
            return;
        }

        (texture as Texture).updateURL(url, null, () => this.updateAftertextureLoad());
    }

    render() {
        let url = "";

        let texture = this.props.node.texture as BaseTexture;
        if (texture && texture.name && texture.name.substring(0, 4) === "http") {
            url = texture.name;
        }

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value="Texture" />
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.node.block!} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>

                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Auto select UV" propertyName="autoSelectUV" target={this.props.node.block!} />
                </LineContainerComponent>
                <LineContainerComponent title="SOURCE">
                    <CheckBoxLineComponent label="Embed texture" isSelected={() => this.state.isEmbedded} onSelect={value => {
                        this.setState({isEmbedded: value});
                        this.props.node.texture = null;
                        this.updateAftertextureLoad();
                    }}/>
                    {
                        this.state.isEmbedded &&
                        <FileButtonLineComponent label="Upload" onClick={(file) => this.replaceTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
                    }
                    {
                        !this.state.isEmbedded &&
                        <TextInputLineComponent label="Link" globalState={this.props.globalState} value={url} onChange={newUrl => this.replaceTextureWithUrl(newUrl)}/>
                    }
                </LineContainerComponent>
            </div>
        );
    }
}