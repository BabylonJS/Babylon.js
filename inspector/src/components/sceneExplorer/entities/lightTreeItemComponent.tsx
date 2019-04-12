import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Light } from "babylonjs/Lights/light";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faEye } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb as faLightbubRegular } from '@fortawesome/free-regular-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { GlobalState } from "../../globalState";

interface ILightTreeItemComponentProps {
    light: Light,
    extensibilityGroups?: IExplorerExtensibilityGroup[]
    onClick: () => void,
    globalState: GlobalState
}

export class LightTreeItemComponent extends React.Component<ILightTreeItemComponentProps, { isEnabled: boolean, isGizmoEnabled:boolean }> {
    constructor(props: ILightTreeItemComponentProps) {
        super(props);

        const light = this.props.light;

        this.state = { isEnabled: light.isEnabled(), isGizmoEnabled: (light.reservedDataStore && light.reservedDataStore.lightGizmo) };
    }

    switchIsEnabled(): void {
        const light = this.props.light;

        light.setEnabled(!light.isEnabled());

        this.setState({ isEnabled: light.isEnabled() });
    }

    toggleGizmo(): void {
        const light = this.props.light;
        if(light.reservedDataStore && light.reservedDataStore.lightGizmo){
            if (light.getScene().reservedDataStore && light.getScene().reservedDataStore.gizmoManager) {
                light.getScene().reservedDataStore.gizmoManager.attachToMesh(null);
            }
            this.props.globalState.enableLightGizmo(light, false);
            this.setState({ isGizmoEnabled: false });
        }else{
            this.props.globalState.enableLightGizmo(light, true);
            this.setState({ isGizmoEnabled: true });
        }
    }

    render() {
        const isEnabledElement = this.state.isEnabled ? <FontAwesomeIcon icon={faLightbubRegular} /> : <FontAwesomeIcon icon={faLightbubRegular} className="isNotActive" />;
        const isGizmoEnabled = (this.state.isGizmoEnabled || (this.props.light && this.props.light.reservedDataStore && this.props.light.reservedDataStore.lightGizmo)) ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEye} className="isNotActive" />;

        return (
            <div className="lightTools">
                <TreeItemLabelComponent label={this.props.light.name} onClick={() => this.props.onClick()} icon={faLightbulb} color="yellow" />
                <div className="visibility icon" onClick={() => this.switchIsEnabled()} title="Turn on/off the light">
                    {isEnabledElement}
                </div>
                <div className="enableGizmo icon" onClick={() => this.toggleGizmo()} title="Turn on/off the light's gizmo">
                    {isGizmoEnabled}
                </div>
                {
                    <ExtensionsComponent target={this.props.light} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}