import { faImage } from '@fortawesome/free-solid-svg-icons';
import { Texture } from "babylonjs";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { IExtensibilityGroup } from "../../../inspector";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';

interface ITextureTreeItemComponentProps {
    texture: Texture,
    extensibilityGroups?: IExtensibilityGroup[],
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
                {
                    <ExtensionsComponent target={this.props.texture} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}