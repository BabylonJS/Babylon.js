import * as React from "react";

export interface IColorComponentEntryProps {
    value: number,
    label: string,
    max?: number,
    min?: number,
    onChange: (value: number) => void
}

export class ColorComponentEntry extends React.Component<IColorComponentEntryProps> {
    constructor(props: IColorComponentEntryProps) {
        super(props);
    }

    updateValue(valueString: string) {
        if (/[^0-9\.\-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber = parseInt(valueString);

        if (isNaN(valueAsNumber)) {
            return;
        }
        if(this.props.max != undefined && (valueAsNumber > this.props.max)) {
            valueAsNumber = this.props.max;
        }
        if(this.props.min != undefined && (valueAsNumber < this.props.min)) {
            valueAsNumber = this.props.min;
        }

        this.props.onChange(valueAsNumber);
    }

    public render() {
        return (
            <div className="color-picker-component">
                <div className="color-picker-component-value">
                    <input type="number" step={1} className="numeric-input"
                        value={this.props.value} 
                        onChange={(evt) => this.updateValue(evt.target.value)} />
                </div>                        
                <div className="color-picker-component-label">
                    {
                        this.props.label
                    }
                </div>
            </div>
        )
    }

}