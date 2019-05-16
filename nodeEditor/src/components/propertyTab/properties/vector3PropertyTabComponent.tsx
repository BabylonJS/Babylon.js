
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { GenericNodeModel } from '../../diagram/generic/genericNodeModel';
import { Vector3LineComponent } from '../../../sharedComponents/vector3LineComponent';
import { InputNodeModel } from '../../diagram/input/inputNodeModel';

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    node: GenericNodeModel | InputNodeModel;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {

    render() {
        return (
            <Vector3LineComponent label="Value" target={this.props.node} propertyName="vector3"></Vector3LineComponent>
        );
    }
}