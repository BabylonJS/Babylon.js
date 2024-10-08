import * as React from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { Tools } from "core/Misc/tools";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { Texture } from "core/Materials/Textures/texture";
import type { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { GlobalState } from "../../globalState";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";

export class ImageSourcePropertyTabComponent extends React.Component<IPropertyComponentProps, { isEmbedded: boolean }> {
    get imageSourceBlock(): ImageSourceBlock {
        return this.props.nodeData.data as ImageSourceBlock;
    }

    constructor(props: IPropertyComponentProps) {
        super(props);

        const texture = this.imageSourceBlock.texture as BaseTexture;

        this.state = { isEmbedded: !texture || texture.name.substring(0, 4) === "data" };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    override UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: { isEmbedded: boolean; loadAsCubeTexture: boolean }) {
        if (nextProps.nodeData.data !== this.props.nodeData.data) {
            const texture = (nextProps.nodeData.data as ImageSourceBlock).texture as BaseTexture;

            nextState.isEmbedded = !texture || texture.name.substring(0, 4) === "data";
            nextState.loadAsCubeTexture = texture && texture.isCube;
        }
    }

    private _generateRandomForCache() {
        return "xxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
            const r = (Math.random() * 10) | 0;
            return r.toString();
        });
    }

    updateAfterTextureLoad() {
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as NodeMaterialBlock);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
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
            this.imageSourceBlock.texture = new Texture(null, (this.props.stateManager.data as GlobalState).nodeMaterial.getScene(), false, false);
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

        const texture = this.imageSourceBlock.texture as BaseTexture;
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;

                    let extension: string | undefined = undefined;
                    if (file.name.toLowerCase().indexOf(".dds") > 0) {
                        extension = ".dds";
                    } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                        extension = ".env";
                    }
                    (texture as Texture).updateURL(base64data, extension, () => this.updateAfterTextureLoad());
                };
            },
            undefined,
            true
        );
    }

    replaceTextureWithUrl(url: string) {
        this._prepareTexture();

        const texture = this.imageSourceBlock.texture as BaseTexture;
        (texture as Texture).updateURL(url, null, () => this.updateAfterTextureLoad());
    }

    override render() {
        let url = "";
        const block = this.props.nodeData.data as NodeMaterialBlock;

        const texture = this.imageSourceBlock.texture as BaseTexture;
        if (texture && texture.name && texture.name.substring(0, 4) !== "data") {
            url = texture.name;
        }

        url = url.replace(/\?nocache=\d+/, "");

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

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    {texture && texture.updateSamplingMode && (
                        <OptionsLine
                            label="Sampling"
                            options={samplingMode}
                            target={texture}
                            noDirectUpdate={true}
                            propertyName="samplingMode"
                            onSelect={(value) => {
                                texture.updateSamplingMode(value as number);
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <CheckBoxLineComponent
                            label="Clamp U"
                            isSelected={() => texture.wrapU === Texture.CLAMP_ADDRESSMODE}
                            onSelect={(value) => {
                                texture.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <CheckBoxLineComponent
                            label="Clamp V"
                            isSelected={() => texture.wrapV === Texture.CLAMP_ADDRESSMODE}
                            onSelect={(value) => {
                                texture.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Offset U"
                            target={texture}
                            propertyName="uOffset"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Offset V"
                            target={texture}
                            propertyName="vOffset"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Scale U"
                            target={texture}
                            propertyName="uScale"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Scale V"
                            target={texture}
                            propertyName="vScale"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation U"
                            target={texture}
                            propertyName="uAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation V"
                            target={texture}
                            propertyName="vAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation W"
                            target={texture}
                            propertyName="wAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="SOURCE">
                    <CheckBoxLineComponent
                        label="Embed static texture"
                        isSelected={() => this.state.isEmbedded}
                        onSelect={(value) => {
                            this.setState({ isEmbedded: value });
                            this.imageSourceBlock.texture = null;
                            this.updateAfterTextureLoad();
                        }}
                    />
                    {this.state.isEmbedded && <FileButtonLine label="Upload" onClick={(file) => this.replaceTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />}
                    {!this.state.isEmbedded && (
                        <TextInputLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Link"
                            value={url}
                            onChange={(newUrl) => this.replaceTextureWithUrl(newUrl)}
                        />
                    )}
                    {!this.state.isEmbedded && url && (
                        <ButtonLineComponent label="Refresh" onClick={() => this.replaceTextureWithUrl(url + "?nocache=" + this._generateRandomForCache())} />
                    )}
                    {texture && <ButtonLineComponent label="Remove" onClick={() => this.removeTexture()} />}
                </LineContainerComponent>
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </div>
        );
    }
}
