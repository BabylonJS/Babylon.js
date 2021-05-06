
import { TreeItemLabelComponent } from "./treeItemLabelComponent";
import * as React from "react";
import { ControlTreeItemComponent } from "./entities/gui/controlTreeItemComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { AdvancedDynamicTextureTreeItemComponent } from "./entities/gui/advancedDynamicTextureTreeItemComponent";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { GlobalState } from "../../globalState";

interface ITreeItemSpecializedComponentProps {
    label: string,
    entity?: any,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    globalState: GlobalState,
    onClick?: () => void
}

export class TreeItemSpecializedComponent extends React.Component<ITreeItemSpecializedComponentProps> {
    constructor(props: ITreeItemSpecializedComponentProps) {
        super(props);
    }

    onClick() {
        if (!this.props.onClick) {
            return;
        }

        this.props.onClick();
    }

    render() {
        const entity = this.props.entity;

        if (entity && entity.getClassName) {
            const className = entity.getClassName(); if (className === "AdvancedDynamicTexture") {
                return (<AdvancedDynamicTextureTreeItemComponent onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} extensibilityGroups={this.props.extensibilityGroups} texture={entity as AdvancedDynamicTexture} onClick={() => this.onClick()} />);
            }

            if (entity._host) {
                return (<ControlTreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} control={entity as Control} onClick={() => this.onClick()} />);
            }
        }

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={entity.name} onClick={() => this.onClick()} color="cornflowerblue" />
            </div>
        );
    }
}
