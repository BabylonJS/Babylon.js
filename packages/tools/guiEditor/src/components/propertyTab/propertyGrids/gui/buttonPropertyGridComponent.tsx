import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Rectangle } from "gui/2D/controls/rectangle";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import { CommandButtonComponent } from "../../../commandButtonComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import cornerRadiusIcon from "shared-ui-components/imgs/conerRadiusIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import addImageButtonIcon from "shared-ui-components/imgs/addImageButtonIcon.svg";
import addTextButtonIcon from "shared-ui-components/imgs/addTextButtonIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import type { GlobalState } from "../../../../globalState";

interface IButtonPropertyGridComponentProps {
    rectangles: Rectangle[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onAddComponent: (newComponent: string) => void;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class ButtonPropertyGridComponent extends React.Component<IButtonPropertyGridComponentProps> {
    constructor(props: IButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { rectangles, lockObject, onPropertyChangedObservable, onAddComponent } = this.props;
        const proxy = makeTargetsProxy(rectangles, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={lockObject}
                    controls={rectangles}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="BUTTON" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <CommandButtonComponent
                        tooltip="Add TextBlock"
                        icon={addTextButtonIcon}
                        shortcut=""
                        isActive={false}
                        onClick={() => {
                            onAddComponent("Text");
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Add Image"
                        icon={addImageButtonIcon}
                        shortcut=""
                        isActive={false}
                        onClick={() => {
                            onAddComponent("ButtonImage");
                        }}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Stroke Weight"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        propertyName="thickness"
                        unit={<UnitButton unit="PX" locked />}
                        min={0}
                        digits={2}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={cornerRadiusIcon} label={"Corner Radius"} />
                    <FloatLineComponent
                        lockObject={lockObject}
                        label=""
                        target={proxy}
                        propertyName="cornerRadius"
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        min={0}
                        digits={2}
                    />
                </div>
                <ContainerPropertyGridComponent containers={rectangles} onPropertyChangedObservable={onPropertyChangedObservable} />
            </div>
        );
    }
}
