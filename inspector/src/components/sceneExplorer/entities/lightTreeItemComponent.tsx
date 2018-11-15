import { Light, IExplorerExtensibilityGroup } from "babylonjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb as faLightbubRegular } from '@fortawesome/free-regular-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ILightTreeItemComponentProps {
    light: Light,
    extensibilityGroups?: IExplorerExtensibilityGroup[]
    onClick: () => void
}

export class LightTreeItemComponent extends React.Component<ILightTreeItemComponentProps, { isEnabled: boolean }> {
    constructor(props: ILightTreeItemComponentProps) {
        super(props);

        const light = this.props.light;

        this.state = { isEnabled: light.isEnabled() };
    }

    switchIsEnabled(): void {
        const light = this.props.light;

        light.setEnabled(!light.isEnabled());

        this.setState({ isEnabled: light.isEnabled() });
    }

    render() {
        const isEnabledElement = this.state.isEnabled ? <FontAwesomeIcon icon={faLightbubRegular} /> : <FontAwesomeIcon icon={faLightbubRegular} className="isNotActive" />;

        return (
            <div className="lightTools">
                <TreeItemLabelComponent label={this.props.light.name} onClick={() => this.props.onClick()} icon={faLightbulb} color="yellow" />
                <div className="enableLight icon" onClick={() => this.switchIsEnabled()} title="Turn on/off the light">
                    {isEnabledElement}
                </div>
                {
                    <ExtensionsComponent target={this.props.light} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}