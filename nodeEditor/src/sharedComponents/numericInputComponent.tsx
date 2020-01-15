import * as React from "react";
import { GlobalState } from '../globalState';

interface INumericInputComponentProps {
    label: string;
    value: number;
    step?: number;
    onChange: (value: number) => void;
    globalState: GlobalState;
}

export class NumericInputComponent extends React.Component<INumericInputComponentProps, { value: string }> {

    static defaultProps = {
        step: 1,
    };

    private _localChange = false;
    constructor(props: INumericInputComponentProps) {
        super(props);

        this.state = { value: this.props.value.toFixed(3) }
    }

    shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        if (nextProps.value.toString() !== nextState.value) {
            nextState.value = nextProps.value.toFixed(3);
            return true;
        }
        return false;
    }

    updateValue(evt: any) {
        let value = evt.target.value;

        if (/[^0-9\.\-]/g.test(value)) {
            return;
        }

        let valueAsNumber = parseFloat(value);

        this._localChange = true;
        this.setState({ value: value });

        if (isNaN(valueAsNumber)) {
            return;
        }

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
                <input type="number" 
                    onFocus={() => this.props.globalState.blockKeyboardEvents = true}
                    onBlur={evt => {
                        this.props.globalState.blockKeyboardEvents = false;
                    }}
                    step={this.props.step} className="numeric-input" value={this.state.value} onChange={evt => this.updateValue(evt)} />
            </div>
        )
    }
}
