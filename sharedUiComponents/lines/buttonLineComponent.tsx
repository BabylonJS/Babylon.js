import * as React from "react";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
    icon? : string;
}

export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    render() {

        return (
            <div className="buttonLine">
                {this.props.icon && <img src={this.props.icon} className="icon"/>}
                <button onClick={() => this.props.onClick()}>{this.props.label}</button>
            </div>
        );
    }
}
