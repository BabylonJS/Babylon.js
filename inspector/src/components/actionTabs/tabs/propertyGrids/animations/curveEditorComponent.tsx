import * as React from "react";

import { DraggableWindowComponent } from './draggableWindowComponent';

interface ICurveEditorComponentProps {
    isOpen: boolean;
    close: Function;
}

export class CurveEditorComponent extends React.Component<ICurveEditorComponentProps, {isOpen: boolean}> {

    constructor(props: ICurveEditorComponentProps) {
        super(props);
    }

    render() {
        return (
            <DraggableWindowComponent label="Curve Editor" isOpen={this.props.isOpen} closeWindow={this.props.close}>
                <div>
                    Contents of Curve Editor
                </div>
            </DraggableWindowComponent>
        );
    }
}