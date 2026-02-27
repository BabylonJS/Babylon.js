import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";

export class TextureSourcePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    async _prepareImgToLoadAsync(url: string) {
        return await new Promise<string>((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                ctx!.drawImage(img, 0, 0);
                resolve(canvas.toDataURL());
            };

            img.onerror = () => {
                reject(new Error("Failed to load image"));
            };

            img.src = url;
        });
    }

    async loadTextureFromFileAsync(imageFile: File) {
        return await this._prepareImgToLoadAsync(URL.createObjectURL(imageFile));
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async loadTextureData(file: File) {
        const block = this.props.nodeData.data as ParticleTextureSourceBlock;
        block.textureDataUrl = await this.loadTextureFromFileAsync(file);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
    }

    removeData() {
        const block = this.props.nodeData.data as ParticleTextureSourceBlock;
        block.textureDataUrl = "";
        this.forceUpdate();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    override render() {
        const block = this.props.nodeData.data as ParticleTextureSourceBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <FileButtonLine label="Load" onClick={async (file) => await this.loadTextureData(file)} accept=".jpg, .png, .tga, .exr" />
                    {block.textureDataUrl && <ButtonLineComponent label="Remove" onClick={() => this.removeData()} />}
                </LineContainerComponent>
                <LineContainerComponent title="ADVANCED">
                    <CheckBoxLineComponent
                        label="Serialized cached data"
                        target={block}
                        propertyName="serializedCachedData"
                        onValueChanged={() => {
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                    />
                    <CheckBoxLineComponent
                        label="Invert Y"
                        target={block}
                        propertyName="invertY"
                        onValueChanged={() => {
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
