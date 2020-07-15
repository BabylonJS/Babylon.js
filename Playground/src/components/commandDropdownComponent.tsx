import * as React from "react";
import { GlobalState } from '../globalState';
import { Utilities } from '../tools/utilities';

interface ICommandDropdownComponentProps {
    globalState: GlobalState;
    icon: string; 
    tooltip: string;
    items: {label: string, onClick?: () => void, onCheck?: (value: boolean) => void, storeKey?: string}[]
}

export class CommandDropdownComponent extends React.Component<ICommandDropdownComponentProps, {isExpanded: boolean}> {    
  
    public constructor(props: ICommandDropdownComponentProps) {
        super(props);

        this.state = {isExpanded: false}
    }    

    public render() {
        return (
            <>
                {
                    this.state.isExpanded &&
                    <div className="command-dropdown-blocker" onClick={() => this.setState({isExpanded: false})}>
                    </div>
                }
                <div className="command-dropdown-root">
                    <div className={"command-dropdown" + (this.state.isExpanded ? " activated" : "")} title={this.props.tooltip} onClick={() => this.setState({isExpanded: !this.state.isExpanded})}>
                        <img src={"imgs/" + this.props.icon + ".svg"}/>
                    </div>
                    {
                            this.state.isExpanded &&
                            <div className="command-dropdown-content sub1">
                                {
                                    this.props.items.map(m => {
                                        return (
                                            <div className="command-dropdown-label" key={m.label} onClick={() => {
                                                if (! m.onClick) {
                                                    let newValue = !Utilities.ReadBoolFromStore(m.storeKey!);
                                                    Utilities.StoreBoolFromStore(m.storeKey!, newValue);
                                                    this.forceUpdate();
                                                    m.onCheck!(newValue);
                                                    return;
                                                }
                                                m.onClick();
                                                this.setState({isExpanded: false});
                                            }} title={m.label}>
                                                <div className="command-dropdown-label-text">
                                                    {m.label}
                                                </div>
                                                {
                                                    m.onCheck && 
                                                    <input type="checkBox" className="command-dropdown-label-check" 
                                                        onChange={(evt) => {
                                                            Utilities.StoreBoolFromStore(m.storeKey!, evt.target.checked);
                                                            this.forceUpdate();
                                                            m.onCheck!(evt.target.checked);
                                                        }}
                                                        checked={Utilities.ReadBoolFromStore(m.storeKey!)}/>
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