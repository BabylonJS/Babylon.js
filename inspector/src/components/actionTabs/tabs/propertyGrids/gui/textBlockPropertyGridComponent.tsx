import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { TextBlock } from "babylonjs-gui";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { LockObject } from "../lockObject";

interface ITextBlockPropertyGridComponentProps {
    textBlock: TextBlock,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
    constructor(props: ITextBlockPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const textBlock = this.props.textBlock;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={textBlock} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="TEXTBLOCK">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Text" target={textBlock} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}