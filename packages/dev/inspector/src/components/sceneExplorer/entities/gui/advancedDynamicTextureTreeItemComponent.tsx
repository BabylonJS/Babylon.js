import type { Nullable } from "core/types";
import type { Observer, Observable } from "core/Misc/observable";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";

import type { Control } from "gui/2D/controls/control";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

import { faImage, faCrosshairs, faPen } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EditAdvancedDynamicTexture } from "./guiTools";

interface IAdvancedDynamicTextureTreeItemComponentProps {
    texture: AdvancedDynamicTexture;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onSelectionChangedObservable?: Observable<any>;
    onClick: () => void;
}

export class AdvancedDynamicTextureTreeItemComponent extends React.Component<IAdvancedDynamicTextureTreeItemComponentProps, { isInPickingMode: boolean }> {
    private _onControlPickedObserver: Nullable<Observer<Control>>;

    constructor(props: IAdvancedDynamicTextureTreeItemComponentProps) {
        super(props);

        this.state = { isInPickingMode: false };
    }

    componentWillUnmount() {
        const adt = this.props.texture;

        if (this._onControlPickedObserver) {
            adt.onControlPickedObservable.remove(this._onControlPickedObserver);
            this._onControlPickedObserver = null;
        }
    }

    onPickingMode() {
        const adt = this.props.texture;

        if (this._onControlPickedObserver) {
            adt.onControlPickedObservable.remove(this._onControlPickedObserver);
            this._onControlPickedObserver = null;
        }

        if (!this.state.isInPickingMode) {
            this._onControlPickedObserver = adt.onControlPickedObservable.add((control) => {
                if (!this.props.onSelectionChangedObservable) {
                    return;
                }

                if (control.getClassName() === "ScrollViewerWindow") {
                    control = control.getAscendantOfClass("ScrollViewer")!;
                }

                this.props.onSelectionChangedObservable.notifyObservers(control);
            });
        }

        this.setState({ isInPickingMode: !this.state.isInPickingMode });
    }

    render() {
        return (
            <div className="adtextureTools">
                <TreeItemLabelComponent label={this.props.texture.name} onClick={() => this.props.onClick()} icon={faImage} color="mediumpurple" />
                <div className={"icon edit"} onClick={() => EditAdvancedDynamicTexture(this.props.texture, true)} title="Edit">
                    <FontAwesomeIcon icon={faPen} />
                </div>
                <div
                    className={this.state.isInPickingMode ? "pickingMode selected icon" : "pickingMode icon"}
                    onClick={() => this.onPickingMode()}
                    title="Turn picking mode on/off"
                >
                    <FontAwesomeIcon icon={faCrosshairs} />
                </div>
                <ExtensionsComponent target={this.props.texture} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        );
    }
}
