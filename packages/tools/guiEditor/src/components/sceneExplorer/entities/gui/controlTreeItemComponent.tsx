import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { Control } from "gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from "react";
import type { GlobalState } from "../../../../globalState";
import { DragOverLocation } from "../../../../globalState";
import type { Grid } from "gui/2D/controls/grid";
import { Container } from "gui/2D/controls/container";
import { ControlTypes } from "../../../../controlTypes";

import visibilityNotActiveIcon from "../../../../imgs/visibilityNotActiveIcon.svg";
import visibilityActiveIcon from "../../../../imgs/visibilityActiveIcon.svg";
import makeComponentIcon from "../../../../imgs/makeComponentIcon.svg";
import makeChildOfContainerIcon from "../../../../imgs/makeChildOfContainerIcon.svg";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
    isHovered: boolean;
    isDragOver: boolean;
    dragOverLocation: DragOverLocation;
    onRenamingStateChanged: (renaming: boolean) => void;
}

export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, { isActive: boolean; isVisible: boolean; isRenaming: boolean }> {
    private _onIsVisibleChangedObserver: Nullable<Observer<boolean>>;
    constructor(props: IControlTreeItemComponentProps) {
        super(props);

        const control = this.props.control;

        this.state = { isActive: control.isHighlighted, isVisible: control.isVisible, isRenaming: false };

        this._onIsVisibleChangedObserver = control.onIsVisibleChangedObservable.add((isVisible) => {
            this.setState({ isVisible });
        });
    }

    override componentWillUnmount() {
        if (this._onIsVisibleChangedObserver) {
            this.props.control.onIsVisibleChangedObservable.remove(this._onIsVisibleChangedObserver);
        }
    }

    highlight() {
        const control = this.props.control;
        control.isHighlighted = !control.isHighlighted;

        this.setState({ isActive: control.isHighlighted });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.control.isVisible = newState;
    }

    onRename(name: string) {
        this.props.control.name = name;
        this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    }

    override render() {
        const control = this.props.control;

        let bracket = "";
        if (control.parent?.typeName === "Grid") {
            bracket = (control.parent as Grid).getChildCellInfo(this.props.control);
        }
        const draggingSelf = this.props.globalState.draggedControl === control;
        const controlType = ControlTypes.find((type) => type.className === control.getClassName());
        return (
            <div className="controlTools">
                {controlType && (
                    <div className="controlType icon">
                        <img src={controlType.icon} alt={controlType.className} />
                    </div>
                )}
                <TreeItemLabelComponent
                    label={control.name}
                    bracket={bracket}
                    onClick={() => this.props.onClick()}
                    onChange={(name) => this.onRename(name)}
                    setRenaming={(renaming) => {
                        this.setState({ isRenaming: renaming });
                        this.props.onRenamingStateChanged(renaming);
                    }}
                    renaming={this.state.isRenaming}
                />
                {!draggingSelf && this.props.isDragOver && this.props.dragOverLocation == DragOverLocation.CENTER && control instanceof Container && (
                    <>
                        <div className="makeChild icon" onClick={() => this.highlight()} title="Make Child">
                            <img src={makeChildOfContainerIcon} />
                        </div>
                    </>
                )}
                {!this.state.isRenaming && this.props.isHovered && this.props.globalState.draggedControl === null && this.props.dragOverLocation == DragOverLocation.NONE && (
                    <>
                        <div className="addComponent icon" onClick={() => this.highlight()} title="Add component (Not Implemented)">
                            <img src={makeComponentIcon} />
                        </div>
                        <div className="visibility icon" onClick={() => this.switchVisibility()} title="Set isVisible">
                            <img src={this.state.isVisible ? visibilityActiveIcon : visibilityNotActiveIcon} />
                        </div>
                    </>
                )}
                <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        );
    }
}
