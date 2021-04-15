import * as React from "react";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
    isDisabled?: boolean;
}

export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    render() {

        return (
            <div className={"buttonLine" + (this.props.isDisabled ? " disabled" : "")}>
                <button onClick={() => {
                    if (this.props.isDisabled) {
                        return;
                    }
                    this.props.onClick();
                }}>{this.props.label}</button>
            </div>
        );
    }
}
