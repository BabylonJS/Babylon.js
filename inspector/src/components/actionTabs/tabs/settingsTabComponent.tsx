import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { CheckBoxLineComponent } from '../../../sharedUiComponents/lines/checkBoxLineComponent';
import { LineContainerComponent } from '../../../sharedUiComponents/lines/lineContainerComponent';

export class SettingsTabComponent extends PaneComponent {

    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render() {
        const state = this.props.globalState;

        return (
            <div className="pane">
                <LineContainerComponent title="UI" selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Only display Euler values" target={state} propertyName="onlyUseEulers" />
                    <CheckBoxLineComponent label="Ignore backfaces when picking" target={state} propertyName="ignoreBackfacesForPicking" />
                </LineContainerComponent>
            </div>
        );
    }
}
