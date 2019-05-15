
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { GenericNodeModel } from '../../diagram/generic/genericNodeModel';
import { Vector2LineComponent } from '../../../sharedComponents/vector2LineComponent';
import { InputNodeModel } from '../../diagram/input/inputNodeModel';

interface IVector2PropertyTabComponentProps {
    globalState: GlobalState;
    node: GenericNodeModel | InputNodeModel;
}

export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {

    render() {
        return (
            <Vector2LineComponent label="Value" target={this.props.node} propertyName="vector2"></Vector2LineComponent>
        );
    }
}