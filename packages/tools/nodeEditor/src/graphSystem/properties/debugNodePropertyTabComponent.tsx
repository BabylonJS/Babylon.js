import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GetGenericProperties, GetGeneralProperties } from "./genericNodePropertyComponent";
import type { GlobalState } from "../../globalState";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { NodeMaterialDebugBlock } from "core/Materials/Node/Blocks/debugBlock";
import { PropertyTabComponentBase } from "shared-ui-components/components/propertyTabComponentBase";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";

export class DebugNodePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    refreshAll() {
        const globalState = this.props.stateManager.data as GlobalState;
        const block = this.props.nodeData.data as NodeMaterialDebugBlock;
        const material = globalState.nodeMaterial;

        globalState.debugBlocksToRefresh = material.attachedBlocks.filter((b) => b.getClassName() === "NodeMaterialDebugBlock" && b !== block) as NodeMaterialDebugBlock[];
        globalState.debugBlocksToRefresh.unshift(block); // Add first to get back to it
    }

    override render() {
        const globalState = this.props.stateManager.data as GlobalState;
        const block = this.props.nodeData.data as NodeMaterialDebugBlock;
        return (
            <PropertyTabComponentBase>
                {GetGeneralProperties({ stateManager: this.props.stateManager, nodeData: this.props.nodeData })}
                {GetGenericProperties({ stateManager: this.props.stateManager, nodeData: this.props.nodeData })}
                <LineContainerComponent title="PROPERTIES">
                    {(globalState.forcedDebugBlock === block || globalState.forcedDebugBlock === null) && (
                        <CheckBoxLineComponent
                            label="Keep focused"
                            isSelected={() => globalState.forcedDebugBlock === block}
                            onSelect={(e) => (e ? (globalState.forcedDebugBlock = block) : (globalState.forcedDebugBlock = null))}
                        />
                    )}
                    <ButtonLineComponent label="Refresh all" onClick={() => this.refreshAll()} />
                </LineContainerComponent>
            </PropertyTabComponentBase>
        );
    }
}
