import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';
import { EffectLayer } from "babylonjs/Layers/effectLayer";

interface IEffectLayerItemComponenttProps {
    layer: EffectLayer,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class EffectLayerItemComponent extends React.Component<IEffectLayerItemComponenttProps> {
    constructor(props: IEffectLayerItemComponenttProps) {
        super(props);
    }

    render() {
        return (
            <div className="effectLayerTools">
                <TreeItemLabelComponent label={this.props.layer.name} onClick={() => this.props.onClick()} icon={faSun} color="Plum" />
                {
                    <ExtensionsComponent target={this.props.layer} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}