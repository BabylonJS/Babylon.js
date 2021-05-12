import * as React from "react";
import { GlobalState } from '../globalState';

interface ICommandButtonComponentProps {
    globalState: GlobalState;
    tooltip: string;   
    shortcut?: string;
    icon: string; 
    isActive: boolean;
    onClick: () => void;
}

export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {    
  
    public constructor(props: ICommandButtonComponentProps) {
        super(props);
    }    

    public render() {
        return (
            <div className={`command-button ${this.props.isActive ? "active" : ""}`} onClick={this.props.onClick} title={`${this.props.tooltip} ${this.props.shortcut ? "\n" + this.props.shortcut : ""}`}>
                <div className={`command-button-icon ${this.props.isActive ? "active" : ""}`}>
                    <img src={this.props.icon} color="white" className={this.props.isActive ? "active" : ""}/>
                </div>
                <div className="command-label">
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}