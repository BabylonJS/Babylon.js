import * as React from "react";
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';

var iconUp = require("../img/icon-up.svg");
var iconDown = require("../img/icon-down.svg");

interface IDropUpButtonProps {
    globalState: GlobalState;
    enabled: boolean;
    icon?: any;
    label: string;
    options: string[];
    activeEntry: () => string;
    selectedOption?: string;
    onOptionPicked: (option: string, index: number) => void;
}

export class DropUpButton extends React.Component<IDropUpButtonProps, {isOpen: boolean}> {
    private _onClickInterceptorClickedObserver: Nullable<Observer<void>>;

    public constructor(props: IDropUpButtonProps) {    
        super(props);

        this.state = {isOpen: false};

        this._onClickInterceptorClickedObserver = props.globalState.onClickInterceptorClicked.add(() => {
            this.setState({isOpen: false});
        });
    }

    componentWillUnmount() {
        this.props.globalState.onClickInterceptorClicked.remove(this._onClickInterceptorClickedObserver);
    }

    switchDropUp() {
        this.props.globalState.onRequestClickInterceptor.notifyObservers();
        this.setState({isOpen: !this.state.isOpen});
    }

    clickOption(option: string, index: number) {
        this.switchDropUp()
        this.props.onOptionPicked(option, index);
    }

    public render() {
        if (!this.props.enabled) {
            return null;
        }

        return (
            <div className="dropup">
                {
                    this.props.icon &&
                    <div className={"button" + (this.state.isOpen ? " active" : "")} onClick={() => this.switchDropUp()}>
                        <img src={this.props.icon} alt={this.props.label} title={this.props.label}  />
                    </div>
                }
                {
                    this.props.selectedOption &&
                    <div className={"button long" + (this.state.isOpen ? " active" : "")} onClick={() => this.switchDropUp()}> 
                        {
                            this.state.isOpen &&
                            <img className="button-icon" src={iconDown} alt="Close the list" title="Close the list"  />
                        }            
                        {
                            !this.state.isOpen &&
                            <img className="button-icon" src={iconUp} alt="Open the list" title="Open the list"  />
                        }           
                        <div className="button-text" title={this.props.selectedOption}>
                            {this.props.selectedOption}
                        </div>                           
                    </div>
                }
                {
                    this.state.isOpen &&
                    <div className={"dropup-content" + (this.props.selectedOption ? " long-mode" : "")}>
                    {
                        this.props.options.map((o, i) => {
                            return(
                                <div key={o} onClick={() => this.clickOption(o, i)} className="dropup-content-line">
                                    <div style={{
                                        opacity: this.props.activeEntry() === o ? "1.0" : "0.8",
                                        fontSize: this.props.activeEntry() === o ? "var(--active-font-size)" : "var(--font-size)"
                                    }}>
                                        {o}
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
}