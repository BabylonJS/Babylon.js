import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { CheckBoxLineComponent } from '../lines/checkBoxLineComponent';

export class SettingsTabComponent extends PaneComponent {

    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render() {
        const state = this.props.globalState;

        return (
            <div className="pane">
                <CheckBoxLineComponent label="Only display Euler values" target={state} propertyName="onlyUseEulers" />
            </div>
        );
    }
}
