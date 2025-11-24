import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { NodeMaterialSourceBlock } from "core/Particles/Node/Blocks";

export class NodeMaterialSourcePropertyTabComponent extends React.Component<IPropertyComponentProps, { isLoading: boolean }> {
    private _onValueChangedObserver: Nullable<Observer<NodeMaterialSourceBlock>> = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        this.state = { isLoading: false };
    }

    override componentDidMount(): void {
        const block = this.props.nodeData.data as NodeMaterialSourceBlock;
        this._onValueChangedObserver = block.onValueChangedObservable.add(() => {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
            this.forceUpdate();
        });
    }

    override componentWillUnmount(): void {
        const block = this.props.nodeData.data as NodeMaterialSourceBlock;
        if (this._onValueChangedObserver) {
            block.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    async loadMaterialAsync(file: File) {
        this.setState({ isLoading: true });
        const text = await file.text();
        const block = this.props.nodeData.data as NodeMaterialSourceBlock;
        block.setSerializedMaterial(text, file.name);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.setState({ isLoading: false });
        this.forceUpdate();
    }

    removeMaterial() {
        const block = this.props.nodeData.data as NodeMaterialSourceBlock;
        block.clearMaterial();
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    override render() {
        const block = this.props.nodeData.data as NodeMaterialSourceBlock;
        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />

                <LineContainerComponent title="NODE MATERIAL">
                    {block.hasCustomMaterial && <TextLineComponent label="Custom material" value={block.customMaterialName} />}
                    {this.state.isLoading && <TextLineComponent label="Status" value="Loading..." ignoreValue={true} />}
                    {!this.state.isLoading && <FileButtonLine label="Load" onClick={async (file) => await this.loadMaterialAsync(file)} accept=".json" />}
                    {block.hasCustomMaterial && <ButtonLineComponent label="Remove" onClick={() => this.removeMaterial()} />}
                </LineContainerComponent>
            </div>
        );
    }
}
