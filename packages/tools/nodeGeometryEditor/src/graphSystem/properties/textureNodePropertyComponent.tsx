import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { GeometryTextureBlock } from "core/Meshes/Node/Blocks/Textures/geometryTextureBlock";
import { FileButtonLineComponent } from "../../sharedComponents/fileButtonLineComponent";

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

    render() {
        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <FileButtonLineComponent label="Load" onClick={(file) => this.loadTextureData(file)} accept=".jpg, .png" />
                </LineContainerComponent>
            </div>
        );
    }
}
