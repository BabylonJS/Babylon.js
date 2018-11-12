import { AbstractMesh, Mesh, IExplorerExtensibilityGroup } from "babylonjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faVectorSquare } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface IMeshTreeItemComponentProps {
    mesh: AbstractMesh,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, { isGizmoEnabled: boolean, isVisible: boolean }> {
    constructor(props: IMeshTreeItemComponentProps) {
        super(props);

        const mesh = this.props.mesh;

        this.state = { isGizmoEnabled: mesh.metadata && mesh.metadata.gizmo, isVisible: this.props.mesh.isVisible }
    }

    showGizmos(): void {
        const mesh = this.props.mesh;

        if (!this.state.isGizmoEnabled) {

            if (!mesh.metadata) {
                mesh.metadata = {};
            }
            mesh.metadata.previousParent = mesh.parent;

            if (mesh.metadata.previousParent) {
                if (!mesh.metadata.previousParent.metadata) {
                    mesh.metadata.previousParent.metadata = {};
                }

                if (!mesh.metadata.previousParent.metadata.detachedChildren) {
                    mesh.metadata.previousParent.metadata.detachedChildren = [];
                }

                mesh.metadata.previousParent.metadata.detachedChildren.push(mesh);
            }

            // Connect to gizmo
            const dummy = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(mesh as Mesh);
            dummy.metadata = { hidden: true };
            const gizmo = new BABYLON.BoundingBoxGizmo(BABYLON.Color3.FromHexString("#0984e3"));
            gizmo.attachedMesh = dummy;

            gizmo.updateBoundingBox();

            gizmo.fixedDragMeshScreenSize = true;
            mesh.metadata.gizmo = gizmo;

            var pointerDragBehavior = new BABYLON.PointerDragBehavior();
            pointerDragBehavior.useObjectOrienationForDragging = false;

            dummy.addBehavior(pointerDragBehavior);

            mesh.metadata.pointerDragBehavior = pointerDragBehavior;
            mesh.metadata.dummy = dummy;

            this.setState({ isGizmoEnabled: true });
            return;
        }

        const previousParent = mesh.metadata.previousParent;
        mesh.removeBehavior(mesh.metadata.pointerDragBehavior);
        mesh.metadata.gizmo.dispose();
        mesh.metadata.gizmo = null;
        mesh.setParent(previousParent);
        mesh.metadata.dummy.dispose();
        mesh.metadata.dummy = null;

        if (previousParent && previousParent.metadata) {
            previousParent.metadata.detachedChildren = null;
        }

        mesh.metadata.previousParent = null;
        mesh.metadata.pointerDragBehavior = null;

        this.setState({ isGizmoEnabled: false });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.mesh.isVisible = newState;
    }

    render() {
        const mesh = this.props.mesh;

        const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={mesh.name} onClick={() => this.props.onClick()} icon={faCube} color="dodgerblue" />
                <div className={this.state.isGizmoEnabled ? "gizmo selected icon" : "gizmo icon"} onClick={() => this.showGizmos()} title="Show/Hide position gizmo">
                    <FontAwesomeIcon icon={faVectorSquare} />
                </div>
                <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide mesh">
                    {visibilityElement}
                </div>
                {
                    <ExtensionsComponent target={mesh} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}