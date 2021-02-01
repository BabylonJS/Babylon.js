import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { faMusic } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { Sound } from 'babylonjs/Audio/sound';

interface ISoundTreeItemComponentProps {
    sound: Sound;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class SoundTreeItemComponent extends React.Component<ISoundTreeItemComponentProps> {
    constructor(props: ISoundTreeItemComponentProps) {
        super(props);
    }

    render() {
        const sound = this.props.sound;

        return (
            <div className="soundTools">
                <TreeItemLabelComponent label={sound.name} onClick={() => this.props.onClick()} icon={faMusic} color="teal" />
                {
                    <ExtensionsComponent target={sound} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        );
    }
}