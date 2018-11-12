import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { TextBlock } from "babylonjs-gui";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";

interface ITextBlockPropertyGridComponentProps {
    textBlock: TextBlock,
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
                <CommonControlPropertyGridComponent control={textBlock} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="TEXTBLOCK">
                    <TextInputLineComponent label="Text" target={textBlock} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}