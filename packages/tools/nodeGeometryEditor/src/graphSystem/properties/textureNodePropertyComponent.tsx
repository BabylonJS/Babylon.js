import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { GeometryTextureBlock } from "core/Meshes/Node/Blocks/Textures/geometryTextureBlock";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";

export class TexturePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    async loadTextureData(file: File) {
        const block = this.props.nodeData.data as GeometryTextureBlock;
        await block.loadTextureFromFileAsync(file);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
    }

    removeData() {
        const block = this.props.nodeData.data as GeometryTextureBlock;
        block.cleanData();
        this.forceUpdate();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    override render() {
        const block = this.props.nodeData.data as GeometryTextureBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <FileButtonLine label="Load" onClick={(file) => this.loadTextureData(file)} accept=".jpg, .png, .tga, .exr" />
                    {block.textureData && <ButtonLineComponent label="Remove" onClick={() => this.removeData()} />}
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
                </LineContainerComponent>
            </div>
        );
    }
}
