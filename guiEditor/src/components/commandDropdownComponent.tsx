import * as React from "react";
import { GlobalState } from '../globalState';
import { FileButtonLineComponent } from "../sharedUiComponents/lines/fileButtonLineComponent";

interface ICommandDropdownComponentProps {
    globalState: GlobalState;
    icon?: string; 
    tooltip: string;
    defaultValue?: string;
    items: {
        label: string,
        icon?: string,
        fileButton?: boolean
        onClick?: () => void, 
        onCheck?: (value: boolean) => void, 
        storeKey?: string, 
        isActive?: boolean,
        defaultValue?: boolean | string;
        subItems?: string[];
    }[];
    toRight?: boolean;    
}

export class CommandDropdownComponent extends React.Component<ICommandDropdownComponentProps, {isExpanded: boolean, activeState: string}> {    
  
    public constructor(props: ICommandDropdownComponentProps) {
        super(props);

        this.state = {isExpanded: false, activeState: ""};
    }    

    public render() {
        return (
            <>
                {
                    this.state.isExpanded &&
                    <div className="command-dropdown-blocker" onClick={() => {
                        this.setState({isExpanded: false});
                    }}>
                    </div>
                }
                <div className="command-dropdown-root">
                    <div className={"command-dropdown" + (this.state.isExpanded ? " activated" : "")} title={this.props.tooltip} 
                        onClick={() => {
                            this.setState({isExpanded: false});;
                            let newState = !this.state.isExpanded;
                            let pgHost = document.getElementById("embed-host");

                            if (pgHost) {
                                pgHost.style.zIndex = newState ? "0" : "10";
                            }

                            this.setState({isExpanded: newState});
                        }}>
                        {
                            this.props.icon &&
                            <div className="command-dropdown-icon">
                                <img src={this.props.icon}/>
                            </div>
                        }                        
                        {
                            !this.props.icon &&
                            <div className="command-dropdown-active">
                            </div>
                        }
                    </div>
                    {
                            this.state.isExpanded &&
                            <div className={"command-dropdown-content sub1" + (this.props.toRight ? " toRight" : "")}>
                                {
                                    this.props.items.map(m => {
                                        if(!m.fileButton)
                                        {
                                        return (
                                            <div className={"command-dropdown-label" + (m.isActive ? " active" : "")} key={m.label} onClick={() => {
                                                if (!m.onClick) {
                                                    this.forceUpdate();
                                                    return;
                                                }
                                                if (!m.subItems) {
                                                    m.onClick();
                                                    
                                                    this.setState({isExpanded: false, activeState: m.label});
                                                }
                                            }} title={m.label}>
                                                <div className="command-dropdown-label-text">
                                                    {(m.isActive ? "> " : "") + m.label}
                                                </div>
                                                {
                                                    m.onCheck && 
                                                    <input type="checkBox" className="command-dropdown-label-check" 
                                                        onChange={(evt) => {
                                                           
                                                            this.forceUpdate();
                                                            m.onCheck!(evt.target.checked);
                                                        }}
                                                        checked={false}/>
                                                }
                                                {
                                                    m.subItems &&
                                                    <div className="command-dropdown-arrow">
                                                        {">"}
                                                    </div>
                                                }
                                                {
                                                    m.subItems &&
                                                    <div className={"sub-items "}>
                                                        {
                                                            m.subItems.map(s => {
                                                                return (
                                                                    <div key={s} className={"sub-item"}  
                                                                    onClick={() => {
                                                                                                                                               
                                                                        m.onClick!();
                                                                        this.setState({isExpanded: false});
                                                                    }}>
                                                                        <div className="sub-item-label">
                                                                            {s}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        )
                                        }
                                        else 
                                        {
                                            return (
                                            <FileButtonLineComponent label="Load" onClick={(file) => m.onClick} accept=".json" />
                                            )
                                        }
                                    })
                                }
                            </div>
                        }
                </div>
            </>
        );
    }
}