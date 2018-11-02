import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

export interface ICheckBoxLineComponentProps {
    label: string,
    target?: any,
    propertyName?: string,
    isSelected?: () => boolean,
    onSelect?: (value: boolean) => void,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, { isSelected: boolean }> {
    private _localChange = false;
    constructor(props: ICheckBoxLineComponentProps) {
        super(props);

        if (this.props.isSelected) {
            this.state = { isSelected: this.props.isSelected() };
        } else {
            this.state = { isSelected: this.props.target[this.props.propertyName!] };
        }
    }

    shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: { isSelected: boolean }) {
        var currentState: boolean;

        if (this.props.isSelected) {
            currentState = nextProps.isSelected!();
        } else {
            currentState = nextProps.target[nextProps.propertyName!];
        }

        if (currentState !== nextState.isSelected || this._localChange) {
            nextState.isSelected = currentState;
            this._localChange = false;
            return true;
        }
        return false;
    }

    onChange() {
        this._localChange = true;
        if (this.props.onSelect) {
            this.props.onSelect(!this.state.isSelected);
        } else {
            this.props.onPropertyChangedObservable!.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName!,
                value: !this.state.isSelected,
                initialValue: this.state.isSelected
            });

            this.props.target[this.props.propertyName!] = !this.state.isSelected;
        }
        this.setState({ isSelected: !this.state.isSelected });
    }

    render() {
        return (
            <div className="checkBoxLine">
                <div className="label">
                    {this.props.label}
                </div>
                <Toggle
                    className="checkBox"
                    defaultChecked={this.state.isSelected}
                    label=""
                    onText="On"
                    offText="Off"
                    onChange={() => this.onChange()}
                />
            </div>
        );
    }
}
