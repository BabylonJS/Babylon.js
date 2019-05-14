
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { TexturePropertyTabComponent } from './properties/texturePropertyTabComponent';
import { GenericNodeModel } from '../diagram/generic/genericNodeModel';
import { Vector2PropertyTabComponent } from './properties/vector2PropertyTabComponent';
require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, { currentNode: Nullable<GenericNodeModel> }> {

    constructor(props: IPropertyTabComponentProps) {
        super(props)

        this.state = { currentNode: null };
    }

    componentWillMount() {
        this.props.globalState.onSelectionChangedObservable.add(block => {
            this.setState({ currentNode: block });
        });
    }

    render() {
        if (this.state.currentNode) {
            if (this.state.currentNode.texture) {
                return (
                    <div id="propertyTab">
                        <TexturePropertyTabComponent globalState={this.props.globalState} node={this.state.currentNode} />
                    </div>
                );
            }
            if (this.state.currentNode.vector2) {
                return (
                    <div id="propertyTab">
                        <Vector2PropertyTabComponent globalState={this.props.globalState} node={this.state.currentNode} />
                    </div>
                );
            }
        }

        return (
            <div id="propertyTab" />
        );
    }
}