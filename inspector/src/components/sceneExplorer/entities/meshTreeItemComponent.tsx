import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash, faSquare } from '@fortawesome/free-regular-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { GlobalState } from '../../globalState';

interface IMeshTreeItemComponentProps {
    mesh: AbstractMesh;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
}

export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, { isBoundingBoxEnabled: boolean, isVisible: boolean }> {
    constructor(props: IMeshTreeItemComponentProps) {
        super(props);

        const mesh = this.props.mesh;

        this.state = { isBoundingBoxEnabled: mesh.showBoundingBox, isVisible: this.props.mesh.isVisible };
    }

    showBoundingBox(): void {
        const mesh = this.props.mesh;
        mesh.showBoundingBox = !this.state.isBoundingBoxEnabled;
        this.setState({ isBoundingBoxEnabled: !this.state.isBoundingBoxEnabled });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.mesh.isVisible = newState;
    }

    render() {
        const mesh = this.props.mesh;

        const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />;

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={mesh.name} onClick={() => this.props.onClick()} icon={faCube} color="dodgerblue" />
                <div className={this.state.isBoundingBoxEnabled ? "bounding-box selected icon" : "bounding-box icon"} onClick={() => this.showBoundingBox()} title="Show/Hide bounding box">
                    <FontAwesomeIcon icon={faSquare} />
                </div>
                <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide mesh">
                    {visibilityElement}
                </div>
                {
                    <ExtensionsComponent target={mesh} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        );
    }
}