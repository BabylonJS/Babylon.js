import * as React from "react";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
    icon?: string;
    iconLabel?: string;
    isDisabled?: boolean;
}

export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className={"buttonLine" + (this.props.isDisabled ? " disabled" : "")}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <button onClick={() => this.props.onClick()}>{this.props.label}</button>
            </div>
        );
    }
}
