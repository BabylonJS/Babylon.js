import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { faGhost } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';
import { Sprite } from 'babylonjs/Sprites/sprite';

interface ISpriteTreeItemComponentProps {
    sprite: Sprite,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class SpriteTreeItemComponent extends React.Component<ISpriteTreeItemComponentProps> {
    constructor(props: ISpriteTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="spriteTools">
                <TreeItemLabelComponent label={this.props.sprite.name || "No name"} onClick={() => this.props.onClick()} icon={faGhost} color="blanchedalmond" />
                {
                    <ExtensionsComponent target={this.props.sprite} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}