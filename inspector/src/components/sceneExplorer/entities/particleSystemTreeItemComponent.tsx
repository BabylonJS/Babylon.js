import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { faBraille } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';

interface IParticleSystemTreeItemComponentProps {
    system: IParticleSystem,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class ParticleSystemTreeItemComponent extends React.Component<IParticleSystemTreeItemComponentProps> {
    constructor(props: IParticleSystemTreeItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="particleSystemTools">
                <TreeItemLabelComponent label={this.props.system.name || "Particle system"} onClick={() => this.props.onClick()} icon={faBraille} color="crimson" />
                {
                    <ExtensionsComponent target={this.props.system} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}