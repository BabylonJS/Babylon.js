import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faPen } from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash, faSquare } from "@fortawesome/free-regular-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import type { GlobalState } from "../../globalState";

import "core/Rendering/boundingBoxRenderer";

interface IMeshTreeItemComponentProps {
    mesh: AbstractMesh;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
}

export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, { isBoundingBoxEnabled: boolean; isVisible: boolean }> {
    constructor(props: IMeshTreeItemComponentProps) {
        super(props);

        const mesh = this.props.mesh;

        this.state = { isBoundingBoxEnabled: mesh.showBoundingBox, isVisible: this.props.mesh.isVisible };
    }

    showBoundingBox(): void {
        const mesh = this.props.mesh;
        mesh.showBoundingBox = !this.state.isBoundingBoxEnabled;
        this.props.globalState.onPropertyChangedObservable.notifyObservers({
            object: mesh,
            property: "showBoundingBox",
            value: mesh.showBoundingBox,
            initialValue: !mesh.showBoundingBox,
        });
        this.setState({ isBoundingBoxEnabled: !this.state.isBoundingBoxEnabled });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.mesh.isVisible = newState;
        this.props.globalState.onPropertyChangedObservable.notifyObservers({ object: this.props.mesh, property: "isVisible", value: newState, initialValue: !newState });
    }

    // mesh.name can fail the type check when we're in javascript, so
    // we can check to avoid crashing
    private _getNameForLabel(): string {
        return typeof this.props.mesh.name === "string" ? this.props.mesh.name : "no name";
    }

    private _editGeometry(): void {
        const mesh = this.props.mesh;
        mesh._internalMetadata.nodeGeometry.edit({
            nodeGeometryEditorConfig: {
                backgroundColor: mesh.getScene().clearColor,
                hostMesh: mesh,
                hostScene: mesh.getScene(),
            },
        });
    }

    override render() {
        const mesh = this.props.mesh;

        const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />;

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={this._getNameForLabel()} onClick={() => this.props.onClick()} icon={faCube} color="dodgerblue" />
                {mesh._internalMetadata && mesh._internalMetadata.nodeGeometry && (
                    <div className="edit icon" onClick={() => this._editGeometry()} title="Edit Node Geometry">
                        <FontAwesomeIcon icon={faPen} />
                    </div>
                )}
                <div
                    className={this.state.isBoundingBoxEnabled ? "bounding-box selected icon" : "bounding-box icon"}
                    onClick={() => this.showBoundingBox()}
                    title="Show/Hide bounding box"
                >
                    <FontAwesomeIcon icon={faSquare} />
                </div>
                <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide mesh">
                    {visibilityElement}
                </div>
                {<ExtensionsComponent target={mesh} extensibilityGroups={this.props.extensibilityGroups} />}
            </div>
        );
    }
}
