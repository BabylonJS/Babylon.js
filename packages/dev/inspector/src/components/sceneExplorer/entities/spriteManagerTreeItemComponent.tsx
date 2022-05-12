import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";

import { faAddressBook } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import type { SpriteManager } from "core/Sprites/spriteManager";

interface ISpriteManagerTreeItemComponentProps {
    spriteManager: SpriteManager;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class SpriteManagerTreeItemComponent extends React.Component<ISpriteManagerTreeItemComponentProps> {
    constructor(props: ISpriteManagerTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="spriteManagerTools">
                <TreeItemLabelComponent label={this.props.spriteManager.name || "No name"} onClick={() => this.props.onClick()} icon={faAddressBook} color="blanchedalmond" />
                {<ExtensionsComponent target={this.props.spriteManager} extensibilityGroups={this.props.extensibilityGroups} />}
            </div>
        );
    }
}
