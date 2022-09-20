import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { DisplayGrid } from "gui/2D/controls/displayGrid";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import displayGridLine1Icon from "shared-ui-components/imgs/displayGridLine1Icon.svg";
import frequencyIcon from "shared-ui-components/imgs/frequencyIcon.svg";
import displayGridLine2Icon from "shared-ui-components/imgs/displayGridLine2Icon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import type { GlobalState } from "../../../../globalState";

interface IDisplayGridPropertyGridComponentProps {
    displayGrids: DisplayGrid[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class DisplayGridPropertyGridComponent extends React.Component<IDisplayGridPropertyGridComponentProps> {
    constructor(props: IDisplayGridPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { displayGrids, lockObject, onPropertyChangedObservable } = this.props;
        const proxy = makeTargetsProxy(displayGrids, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={lockObject}
                    controls={displayGrids}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="DISPLAY GRID" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={sizeIcon} label="Cell Size" />
                    <FloatLineComponent
                        min={1}
                        isInteger={true}
                        lockObject={lockObject}
                        label="W"
                        target={proxy}
                        propertyName="cellWidth"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                        unit={<UnitButton locked unit="PX" />}
                        arrows
                    />
                    <FloatLineComponent
                        min={1}
                        isInteger={true}
                        lockObject={lockObject}
                        label="H"
                        target={proxy}
                        propertyName="cellHeight"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                        unit={<UnitButton locked unit="PX" />}
                        arrows
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={displayGridLine1Icon} label="Show Minor Lines" />
                    <CheckBoxLineComponent label="SHOW MINOR LINES" onValueChanged={() => this.forceUpdate()} target={proxy} propertyName="_displayMinorLines" />
                </div>
                {proxy._displayMinorLines && (
                    <>
                        <div className="ge-divider double">
                            <IconComponent icon={strokeWeightIcon} label="Minor Line Tickness" />
                            <FloatLineComponent
                                min={1}
                                isInteger={true}
                                lockObject={lockObject}
                                label=""
                                target={proxy}
                                propertyName="minorLineTickness"
                                onPropertyChangedObservable={onPropertyChangedObservable}
                                unit={<UnitButton locked unit="PX" />}
                                arrows
                            />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={colorIcon} label="Minor Line Color" />
                            <ColorLineComponent
                                lockObject={lockObject}
                                label=""
                                target={proxy}
                                propertyName="minorLineColor"
                                onPropertyChangedObservable={onPropertyChangedObservable}
                            />
                        </div>
                    </>
                )}
                <div className="ge-divider">
                    <IconComponent icon={displayGridLine2Icon} label="Show Major Lines" />
                    <CheckBoxLineComponent label="SHOW MAJOR LINES" onValueChanged={() => this.forceUpdate()} target={proxy} propertyName="_displayMajorLines" />
                </div>
                {proxy._displayMajorLines && (
                    <>
                        <div className="ge-divider double">
                            <IconComponent icon={strokeWeightIcon} label="Major Line Tickness" />
                            <FloatLineComponent
                                min={1}
                                isInteger={true}
                                lockObject={lockObject}
                                label=""
                                target={proxy}
                                propertyName="majorLineTickness"
                                onPropertyChangedObservable={onPropertyChangedObservable}
                                unit={<UnitButton locked unit="PX" />}
                                arrows
                            />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={colorIcon} label="Major Line Color" />
                            <ColorLineComponent
                                lockObject={lockObject}
                                label=""
                                target={proxy}
                                propertyName="majorLineColor"
                                onPropertyChangedObservable={onPropertyChangedObservable}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={frequencyIcon} label="Major Line Frequency" />
                            <FloatLineComponent
                                min={1}
                                isInteger={true}
                                lockObject={lockObject}
                                label=""
                                target={proxy}
                                propertyName="majorLineFrequency"
                                onPropertyChangedObservable={onPropertyChangedObservable}
                                arrows
                            />
                        </div>
                    </>
                )}
            </div>
        );
    }
}
