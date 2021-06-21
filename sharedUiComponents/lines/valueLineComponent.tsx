import * as React from "react";

interface IValueLineComponentProps {
    label: string;
    value: number;
    color?: string;
    fractionDigits?: number;
    units?: string;
    icon? : string;
}

export class ValueLineComponent extends React.Component<IValueLineComponentProps> {
    constructor(props: IValueLineComponentProps) {
        super(props);
    }

    render() {
        const digits = this.props.fractionDigits !== undefined ? this.props.fractionDigits : 2;
        const value = this.props.value.toFixed(digits) + (this.props.units ? " " + this.props.units : "");

        return (
            <div className="textLine">
                {this.props.icon && <img src={this.props.icon} className="icon"/>}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className="value" style={{ color: this.props.color ? this.props.color : "" }}>
                    {value}
                </div>
            </div>
        );
    }
}
