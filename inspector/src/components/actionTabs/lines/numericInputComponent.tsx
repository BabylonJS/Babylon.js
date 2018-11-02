import * as React from "react";

interface INumericInputComponentProps {
    label: string,
    value: number,
    onChange: (value: number) => void
}

export class NumericInputComponent extends React.Component<INumericInputComponentProps, { value: number }> {
    private _localChange = false;
    constructor(props: INumericInputComponentProps) {
        super(props);

        this.state = { value: this.props.value }
    }

    shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        if (nextProps.value !== nextState.value) {
            nextState.value = nextProps.value;
            return true;
        }
        return false;
    }

    updateValue(evt: any) {
        let valueAsNumber = parseFloat(evt.target.value);

        if (isNaN(valueAsNumber)) {
            return;
        }

        this._localChange = true;
        this.setState({ value: valueAsNumber });
        this.props.onChange(valueAsNumber);
    }


    render() {
        return (
            <div className="numeric">
                {
                    this.props.label &&
                    <div className="numeric-label">
                        {`${this.props.label}: `}
                    </div>
                }
                <input className="numeric-input" value={this.state.value} type="number" onChange={evt => this.updateValue(evt)} step="0.1" />
            </div>
        )
    }
}