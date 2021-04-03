import { Engine } from "babylonjs/Engines/engine";
import * as React from "react";
import { GlobalState } from '../globalState';
import { Utilities } from '../tools/utilities';

interface ICommandDropdownComponentProps {
    globalState: GlobalState;
    icon?: string; 
    tooltip: string;
    defaultValue?: string;
    items: {
        label: string, 
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

        this.state = {isExpanded: false, activeState: Utilities.ReadStringFromStore(this.props.tooltip, this.props.defaultValue!)};

        this.props.globalState.OnNewDropdownButtonClicked.add((source) => {
            if (source === this) {
                return;
            }

            this.setState({isExpanded: false});
        });
    }    

    public render() {
        var engineVersion = Engine.Version.split("-")[0];

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
                            this.props.globalState.OnNewDropdownButtonClicked.notifyObservers(this);
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
                                <img src={"imgs/" + this.props.icon + ".svg"}/>
                            </div>
                        }
                        {
                            !this.props.icon &&
                            <div className="command-dropdown-active">
                                {
                                    this.state.activeState === "Latest" ? engineVersion : this.state.activeState
                                }
                            </div>
                        }
                    </div>
                    {
                            this.state.isExpanded &&
                            <div className={"command-dropdown-content sub1" + (this.props.toRight ? " toRight" : "")}>
                                {
                                    this.props.items.map(m => {
                                        return (
                                            <div className={"command-dropdown-label" + (m.isActive ? " active" : "")} key={m.label} onClick={() => {
                                                if (!m.onClick) {
                                                    let newValue = !Utilities.ReadBoolFromStore(m.storeKey!, (m.defaultValue as boolean) || false);
                                                    Utilities.StoreBoolToStore(m.storeKey!, newValue);
                                                    this.forceUpdate();
                                                    m.onCheck!(newValue);
                                                    return;
                                                }
                                                if (!m.subItems) {
                                                    m.onClick();
                                                    Utilities.StoreStringToStore(this.props.tooltip, m.label);
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
                                                            Utilities.StoreBoolToStore(m.storeKey!, evt.target.checked);
                                                            this.forceUpdate();
                                                            m.onCheck!(evt.target.checked);
                                                        }}
                                                        checked={Utilities.ReadBoolFromStore(m.storeKey!, (m.defaultValue as boolean) || false)}/>
                                                }
                                                {
                                                    m.subItems &&
                                                    <div className="command-dropdown-arrow">
                                                        {">"}
                                                    </div>
                                                }
                                                {
                                                    m.subItems &&
                                                    <div className={"sub-items " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
                                                        {
                                                            m.subItems.map(s => {
                                                                return (
                                                                    <div key={s} className={"sub-item" + (Utilities.ReadStringFromStore(m.storeKey!, m.defaultValue as string) === s ? " checked" : "")}  
                                                                    onClick={() => {
                                                                        Utilities.StoreStringToStore(m.storeKey!, s);                                                                        
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
                                    })
                                }
                            </div>
                        }
                </div>
            </>
        );
    }
}