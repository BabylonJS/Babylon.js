import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Texture } from "babylonjs/Materials/Textures/texture";

import { faImage } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';

interface ITextureTreeItemComponentProps {
    texture: Texture,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class TextureTreeItemComponent extends React.Component<ITextureTreeItemComponentProps> {
    constructor(props: ITextureTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="textureTools">
                <TreeItemLabelComponent label={this.props.texture.name} onClick={() => this.props.onClick()} icon={faImage} color="mediumpurple" />
                <ExtensionsComponent target={this.props.texture} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        )
    }
}