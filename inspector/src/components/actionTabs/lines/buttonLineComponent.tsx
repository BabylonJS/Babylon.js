import * as React from "react";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
}

export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    render() {

        return (
            <div className="buttonLine">
                <button onClick={() => this.props.onClick()}>{this.props.label}</button>
            </div>
        );
    }
}
