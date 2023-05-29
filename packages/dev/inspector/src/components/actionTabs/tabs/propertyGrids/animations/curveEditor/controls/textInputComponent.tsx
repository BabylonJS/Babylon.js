import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context } from "../context";

interface ITextInputComponentProps {
    globalState: GlobalState;
    context: Context;
    id?: string;
    className?: string;
    tooltip?: string;
    value: string;
    isNumber?: boolean;
    complement?: string;
    onValueAsNumberChanged?: (value: number, isFocused: boolean) => void;
    disabled?: boolean;
}

interface ITextInputComponentState {
    value: string;
    isFocused: boolean;
}

export class TextInputComponent extends React.Component<ITextInputComponentProps, ITextInputComponentState> {
    private _lastKnownGoodValue: string;

    constructor(props: ITextInputComponentProps) {
        super(props);

        this.state = { value: this.props.value, isFocused: false };
    }

    private _onChange(value: string) {
        if (this.props.isNumber) {
            const valueAsNumber = parseFloat(value);

            if (!isNaN(valueAsNumber)) {
                if (this.props.onValueAsNumberChanged) {
                    this.props.onValueAsNumberChanged(valueAsNumber, true);
                }
                this._lastKnownGoodValue = valueAsNumber.toString();
            } else if (value !== "-" && value !== "") {
                return;
            }
        }

        this._lastKnownGoodValue = value;
        this.setState({ value: value });
    }

    private _onBlur() {
        this.props.context.focusedInput = false;

        if (this.props.isNumber) {
            const valueAsNumber = parseFloat(this.state.value);

            if (!isNaN(valueAsNumber)) {
                if (this.props.onValueAsNumberChanged) {
                    this.props.onValueAsNumberChanged(valueAsNumber, false);
                }
                this.setState({ value: valueAsNumber.toString(), isFocused: false });
            } else {
                this.setState({ value: this._lastKnownGoodValue, isFocused: false });
            }
            return;
        }

        this.setState({ isFocused: false });
    }

    private _onFocus() {
        this.props.context.focusedInput = true;
        this.setState({ isFocused: true });
    }

    shouldComponentUpdate(newProps: ITextInputComponentProps, newState: ITextInputComponentState) {
        if (newProps !== this.props) {
            newState.value = newProps.value;
        }

        return true;
    }

    private _onKeyPress(evt: React.KeyboardEvent<HTMLInputElement>) {
        if (evt.key === "Enter") {
            const valueAsNumber = parseFloat(this.state.value);

            if (!isNaN(valueAsNumber)) {
                if (this.props.onValueAsNumberChanged) {
                    this.props.onValueAsNumberChanged(valueAsNumber, false);
                }
            }
        }
    }

    public render() {
        return (
            <input
                type="text"
                title={this.props.tooltip}
                onFocus={() => this._onFocus()}
                onBlur={() => this._onBlur()}
                className={"text-input" + (this.props.className ? " " + this.props.className : "")}
                onChange={(evt) => this._onChange(this.props.complement ? evt.target.value.replace(this.props.complement, "") : evt.target.value)}
                onKeyPress={(evt) => this._onKeyPress(evt)}
                value={(this.state.value || "") + (!this.state.isFocused && this.props.complement ? this.props.complement : "")}
                id={this.props.id}
                disabled={this.props.disabled}
            ></input>
        );
    }
}
