import * as React from "react";

export interface IIconButtonLineComponentProps {
    icon: string;
    onClick: () => void;
    tooltip: string;
}

export class IconButtonLineComponent extends React.Component<IIconButtonLineComponentProps> {
    constructor(props: IIconButtonLineComponentProps) {
        super(props);
    }

    render() {

        return (
            <div title={this.props.tooltip} className={`icon ${this.props.icon}`} onClick={() => this.props.onClick()} />
        );
    }
}
