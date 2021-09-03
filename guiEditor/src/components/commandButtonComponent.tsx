import * as React from "react";

interface ICommandButtonComponentProps {
    tooltip: string;   
    shortcut?: string;
    icon: string; 
    iconLabel? : string;
    isActive: boolean;
    onClick: () => void;
}

export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {    
  
    public constructor(props: ICommandButtonComponentProps) {
        super(props);
    }    

    public render() {
        return (
            <div className={`command-button ${this.props.isActive ? "active" : ""}`} onClick={this.props.onClick} title={`${this.props.tooltip} ${this.props.shortcut ? " (" + this.props.shortcut + ")" : ""}`}>
                <div className={`command-button-icon ${this.props.isActive ? "active" : ""}`}>
                    <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel}  color="white" className={this.props.isActive ? "active" : ""}/>
                </div>
                <div className="command-label">
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}