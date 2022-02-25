import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { CommandButtonComponent } from "../../../commandButtonComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");
const addImageButtonIcon: string = require("../../../../sharedUiComponents/imgs/addImageButtonIcon.svg");
const addTextButtonIcon: string = require("../../../../sharedUiComponents/imgs/addTextButtonIcon.svg");

interface IButtonPropertyGridComponentProps {
    rectangles: Rectangle[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onAddComponent: (newComponent: string) => void;
}

export class ButtonPropertyGridComponent extends React.Component<IButtonPropertyGridComponentProps> {
    constructor(props: IButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const {rectangles, lockObject, onPropertyChangedObservable, onAddComponent} = this.props;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={rectangles} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <ContainerPropertyGridComponent containers={rectangles} onPropertyChangedObservable={onPropertyChangedObservable}/>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Stroke Weight"
                        icon={strokeWeightIcon}
                        lockObject={lockObject}
                        label=""
                        target={makeTargetsProxy(rectangles, onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel="Corner Radius"
                        icon={conerRadiusIcon}
                        lockObject={lockObject}
                        label=""
                        target={makeTargetsProxy(rectangles, onPropertyChangedObservable)}
                        propertyName="cornerRadius"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                    />
                </div>
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
            </div>
        );
    }
}
