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
            <div className="command-button" onClick={this.props.onClick} title={this.props.tooltip + (this.props.shortcut ? "\n" + this.props.shortcut : "")}>
                <img src={"imgs/" + this.props.icon + ".svg"} className={this.props.isActive ? "active" : ""}/>
                <div className="command-label">
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}