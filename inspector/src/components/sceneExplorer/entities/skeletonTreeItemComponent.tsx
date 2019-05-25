import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { faSkull } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { Skeleton } from 'babylonjs/Bones/skeleton';

interface ISkeletonTreeItemComponentProps {
    skeleton: Skeleton,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class SkeletonTreeItemComponent extends React.Component<ISkeletonTreeItemComponentProps> {
    constructor(props: ISkeletonTreeItemComponentProps) {
        super(props);
    }


    render() {
        const skeleton = this.props.skeleton;
        return (
            <div className="skeletonTools">
                <TreeItemLabelComponent label={skeleton.name || "no name"} onClick={() => this.props.onClick()} icon={faSkull} color="gray" />
                {
                    <ExtensionsComponent target={skeleton} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}