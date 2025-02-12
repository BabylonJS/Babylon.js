import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { GlobalState } from "../../globalState";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { NodeMaterialDebugBlock } from "core/Materials/Node/Blocks/debugBlock";

export class DebugNodePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    refreshAll() {
        const globalState = this.props.stateManager.data as GlobalState;
        const block = this.props.nodeData.data as NodeMaterialDebugBlock;
        const material = globalState.nodeMaterial;

        globalState.debugBlocksToRefresh = material.attachedBlocks.filter((b) => b.getClassName() === "NodeMaterialDebugBlock" && b !== block) as NodeMaterialDebugBlock[];
        globalState.debugBlocksToRefresh.unshift(block); // Add first to get back to it
    }

    override render() {
        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <ButtonLineComponent label="Refresh all" onClick={() => this.refreshAll()} />
                </LineContainerComponent>
            </div>
        );
    }
}
