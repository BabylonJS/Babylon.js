import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Material } from "babylonjs/Materials/material";
import { faBrush, faPen } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';

interface IMaterialTreeItemComponentProps {
    material: Material | NodeMaterial,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class MaterialTreeItemComponent extends React.Component<IMaterialTreeItemComponentProps> {
    constructor(props: IMaterialTreeItemComponentProps) {
        super(props);
    }

    render() {

        const nmeIcon = this.props.material.getClassName() === "NodeMaterial" ?
            <div className="icon" onClick={() => {(this.props.material as NodeMaterial).edit()}} title="Node Material Editor" color="white">
            <FontAwesomeIcon icon={faPen} />
            </div> : null;

        return (
            <div className="materialTools">
                <TreeItemLabelComponent label={this.props.material.name} onClick={() => this.props.onClick()} icon={faBrush} color="orange" />
                {
                   <ExtensionsComponent target={this.props.material} extensibilityGroups={this.props.extensibilityGroups} />
                }
                {nmeIcon}
            </div>
        )
    }
}