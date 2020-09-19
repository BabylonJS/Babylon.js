import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { faFilm } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ITargetedAnimationItemComponentProps {
    targetedAnimation: TargetedAnimation,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class TargetedAnimationItemComponent extends React.Component<ITargetedAnimationItemComponentProps> {
    constructor(props: ITargetedAnimationItemComponentProps) {
        super(props);
    }


    render() {
        const targetedAnimation = this.props.targetedAnimation;
        return (
            <div className="targetedAnimationTools">
                <TreeItemLabelComponent label={targetedAnimation.animation.name} onClick={() => this.props.onClick()} icon={faFilm} color="cornflowerblue" />
                {
                    <ExtensionsComponent target={targetedAnimation} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}