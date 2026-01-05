import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { Material } from "core/Materials/material";
import { faBrush, faPen } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";

interface IMaterialTreeItemComponentProps {
    material: Material | NodeMaterial;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class MaterialTreeItemComponent extends React.Component<IMaterialTreeItemComponentProps> {
    constructor(props: IMaterialTreeItemComponentProps) {
        super(props);
    }

    override render() {
        const nmeIcon =
            this.props.material.getClassName() === "NodeMaterial" ? (
                <div
                    className="icon"
                    onClick={() => {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        (this.props.material as NodeMaterial).edit({ nodeEditorConfig: { backgroundColor: this.props.material.getScene().clearColor } });
                    }}
                    title="Node Material Editor"
                    color="white"
                >
                    <FontAwesomeIcon icon={faPen} />
                </div>
            ) : null;

        return (
            <div className="materialTools">
                <TreeItemLabelComponent label={this.props.material.name} onClick={() => this.props.onClick()} icon={faBrush} color="orange" />
                {<ExtensionsComponent target={this.props.material} extensibilityGroups={this.props.extensibilityGroups} />}
                {nmeIcon}
            </div>
        );
    }
}
