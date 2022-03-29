import * as React from "react";

interface IIconComponentProps {
    icon: string;
    label?: string;
}

export class IconComponent extends React.Component<IIconComponentProps> {
    render() {
        return <img src={this.props.icon} title={this.props.label} alt={this.props.label} color="black" className="icon" onDragStart={(evt) => evt.preventDefault()} />;
    }
}
