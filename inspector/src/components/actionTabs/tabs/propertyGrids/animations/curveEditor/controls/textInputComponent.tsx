import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../Context";

interface ITextInputComponentProps {
    globalState: GlobalState;
    context: Context;
    id?: string;
    className?: string;
    tooltip?: string;
    value: string;
    isNumber?: boolean;
    onValueAsNumberChanged?: (value: number) => void;
}

interface ITextInputComponentState {
    value: string;
}

export class TextInputComponent extends React.Component<
ITextInputComponentProps,
ITextInputComponentState
> {
    private _lastKnownGoodValue: string;

    constructor(props: ITextInputComponentProps) {
        super(props);

        this.state = { value: this.props.value};
    }

    private _onChange(value: string) {
        if (this.props.isNumber) {
            let valueAsNumber = parseFloat(value);

            if (!isNaN(valueAsNumber)) {
                if (this.props.onValueAsNumberChanged) {
                    this.props.onValueAsNumberChanged(valueAsNumber);
                }
                this._lastKnownGoodValue = valueAsNumber.toString();
            } else {
                return;
            }
        }

        this.setState({value: value});
        this._lastKnownGoodValue = value;
    }

    private _onBlur() {
        if (this.props.isNumber) {
            let valueAsNumber = parseFloat(this.state.value);

            if (!isNaN(valueAsNumber)) {
                this.setState({value: valueAsNumber.toString()});
            } else {
                this.setState({value: this._lastKnownGoodValue});
            }
        }
    }

    shouldComponentUpdate(newProps: ITextInputComponentProps, newState: ITextInputComponentState) {
        if (newProps !== this.props) {
            newState.value = newProps.value;
        }
        
        return true;
    }

    public render() {
        return (
            <input 
                type="text"
                title={this.props.tooltip}
                onBlur={() => this._onBlur()}
                className={"text-input" + (this.props.className ? " " + this.props.className : "")} 
                onChange={evt => this._onChange(evt.target.value)}
                value={this.state.value || ""}
                id={this.props.id}>
            </input>
        );
    }
}