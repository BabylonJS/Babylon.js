import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { faFilm } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface IAnimationGroupItemComponentProps {
    animationGroup: AnimationGroup,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class AnimationGroupItemComponent extends React.Component<IAnimationGroupItemComponentProps> {
    constructor(props: IAnimationGroupItemComponentProps) {
        super(props);
    }


    render() {
        const animationGroup = this.props.animationGroup;
        return (
            <div className="animationGroupTools">
                <TreeItemLabelComponent label={animationGroup.name} onClick={() => this.props.onClick()} icon={faFilm} color="cornflowerblue" />
                {
                    <ExtensionsComponent target={animationGroup} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}