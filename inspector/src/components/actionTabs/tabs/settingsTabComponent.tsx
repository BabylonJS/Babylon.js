import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { CheckBoxLineComponent } from '../lines/checkBoxLineComponent';
import { LineContainerComponent } from '../lineContainerComponent';

export class SettingsTabComponent extends PaneComponent {

    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render() {
        const state = this.props.globalState;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="UI">
                    <CheckBoxLineComponent label="Only display Euler values" target={state} propertyName="onlyUseEulers" />
                    <CheckBoxLineComponent label="Ignore backfaces when picking" target={state} propertyName="ignoreBackfacesForPicking" />
                </LineContainerComponent>
            </div>
        );
    }
}
