import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { faBone } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { Bone } from 'babylonjs/Bones/bone';

interface IBoneTreeItemComponenttProps {
    bone: Bone,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class BoneTreeItemComponent extends React.Component<IBoneTreeItemComponenttProps> {
    constructor(props: IBoneTreeItemComponenttProps) {
        super(props);
    }


    render() {
        const bone = this.props.bone;
        return (
            <div className="skeletonTools">
                <TreeItemLabelComponent label={bone.name || "no name"} onClick={() => this.props.onClick()} icon={faBone} color="lightgray" />
                {
                    <ExtensionsComponent target={bone} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}