import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StackPanel } from "gui/2D/controls/stackPanel";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import alignVerticalIcon from "shared-ui-components/imgs/alignVerticalIcon.svg";
import stackPanelSpacingIcon from "shared-ui-components/imgs/stackPanelSpacingIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { ValueAndUnit } from "gui/2D/valueAndUnit";
import { CoordinateHelper } from "../../../../diagram/coordinateHelper";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface IStackPanelPropertyGridComponentProps {
    stackPanels: StackPanel[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
    constructor(props: IStackPanelPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { stackPanels, lockObject, onPropertyChangedObservable } = this.props;
        const proxy = makeTargetsProxy(stackPanels, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={lockObject}
                    controls={stackPanels}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="STACKPANEL" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={alignVerticalIcon} label={"Determines if children are stacked horizontally or vertically"} />
                    <CheckBoxLineComponent
                        label={proxy.isVertical ? "ALIGNMENT: VERTICAL" : "ALIGNMENT: HORIZONTAL"}
                        target={proxy}
                        propertyName="isVertical"
                        onValueChanged={() => {
                            for (const panel of stackPanels) {
                                for (const child of panel.children) {
                                    if (proxy.isVertical) {
                                        child.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_CENTER;
                                        child._left.value = 0;
                                        if (child._height.unit === ValueAndUnit.UNITMODE_PERCENTAGE) {
                                            CoordinateHelper.ConvertToPixels(child, ["height"]);
                                        }
                                    } else {
                                        child.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_CENTER;
                                        child._top.value = 0;
                                        if (child._width.unit === ValueAndUnit.UNITMODE_PERCENTAGE) {
                                            CoordinateHelper.ConvertToPixels(child, ["width"]);
                                        }
                                    }
                                }
                            }
                            this.forceUpdate();
                        }}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={stackPanelSpacingIcon} label={"Spacing between children"} />
                    <FloatLineComponent
                        lockObject={lockObject}
                        label=" "
                        target={proxy}
                        propertyName="spacing"
                        onChange={() => stackPanels.forEach((panel) => panel._markAsDirty())}
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        min={0}
                    />
                </div>
                <ContainerPropertyGridComponent containers={stackPanels} onPropertyChangedObservable={onPropertyChangedObservable} />
            </div>
        );
    }
}
