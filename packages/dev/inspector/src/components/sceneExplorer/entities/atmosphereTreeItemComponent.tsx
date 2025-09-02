// Copyright (c) Microsoft Corporation.
// MIT License

import * as React from "react";
import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { ExtensionsComponent } from "../extensionsComponent";
import { faSun } from "@fortawesome/free-solid-svg-icons";
import type { GlobalState } from "../../globalState";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";

interface IAtmosphereTreeItemComponentProps {
    atmosphere: Atmosphere;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
}

/**
 * Component that displays the atmosphere properties in the scene explorer.
 */
export class AtmosphereTreeItemComponent extends React.Component<IAtmosphereTreeItemComponentProps, { isEnabled: boolean }> {
    /**
     * Creates a new instance of the {@link AtmosphereTreeItemComponent}.
     * @param props - The properties for the component.
     */
    constructor(props: IAtmosphereTreeItemComponentProps) {
        super(props);

        const atmosphere = this.props.atmosphere;

        this.state = { isEnabled: atmosphere.isEnabled() };
    }

    /**
     * Toggles the enabled state of the {@link Atmosphere}.
     */
    switchIsEnabled(): void {
        const atmosphere = this.props.atmosphere;
        atmosphere.setEnabled(!atmosphere.isEnabled());
        this.props.globalState.onPropertyChangedObservable.notifyObservers({
            object: atmosphere,
            property: "isEnabled",
            value: atmosphere.isEnabled(),
            initialValue: !atmosphere.isEnabled(),
        });
        this.setState({ isEnabled: atmosphere.isEnabled() });
    }

    /**
     * Renders the component.
     * @returns The JSX element for the component.
     */
    override render() {
        return (
            <div className="atmosphereTools">
                <TreeItemLabelComponent label={this.props.atmosphere.name} onClick={() => this.props.onClick()} icon={faSun} color="yellow" />
                {<ExtensionsComponent target={this.props.atmosphere} extensibilityGroups={this.props.extensibilityGroups} />}
            </div>
        );
    }
}
