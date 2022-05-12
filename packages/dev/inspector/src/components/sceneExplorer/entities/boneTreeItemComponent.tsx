import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { faBone } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import type { Bone } from "core/Bones/bone";

interface IBoneTreeItemComponentProps {
    bone: Bone;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class BoneTreeItemComponent extends React.Component<IBoneTreeItemComponentProps> {
    constructor(props: IBoneTreeItemComponentProps) {
        super(props);
    }

    render() {
        const bone = this.props.bone;
        return (
            <div className="skeletonTools">
                <TreeItemLabelComponent label={bone.name || "no name"} onClick={() => this.props.onClick()} icon={faBone} color="lightgray" />
                {<ExtensionsComponent target={bone} extensibilityGroups={this.props.extensibilityGroups} />}
            </div>
        );
    }
}
