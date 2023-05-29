import * as React from "react";
import type { GlobalState } from "../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

import iconUp from "../img/icon-up.svg";
import iconDown from "../img/icon-down.svg";

interface IDropUpButtonProps {
    globalState: GlobalState;
    enabled: boolean;
    icon?: any;
    iconLabel?: string;
    label: string;
    options: string[];
    activeEntry: () => string;
    selectedOption?: string;
    onOptionPicked: (option: string, index: number) => void;
    searchPlaceholder?: string;
}

export class DropUpButton extends React.Component<IDropUpButtonProps, { isOpen: boolean; searchText: string }> {
    private _onClickInterceptorClickedObserver: Nullable<Observer<void>>;

    public constructor(props: IDropUpButtonProps) {
        super(props);

        this.state = { isOpen: false, searchText: "" };

        this._onClickInterceptorClickedObserver = props.globalState.onClickInterceptorClicked.add(() => {
            this.setState({ isOpen: false });
        });
    }

    componentWillUnmount() {
        this.props.globalState.onClickInterceptorClicked.remove(this._onClickInterceptorClickedObserver);
    }

    switchDropUp() {
        this.props.globalState.onRequestClickInterceptor.notifyObservers();
        this.setState({ isOpen: !this.state.isOpen });
    }

    clickOption(option: string, index: number) {
        this.switchDropUp();
        this.props.onOptionPicked(option, index);
    }

    onChangeSearchText = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const text = evt.target.value;

        this.setState({ searchText: text });
    };

    public render() {
        if (!this.props.enabled) {
            return null;
        }

        const searchPlaceholder = this.props.searchPlaceholder ?? "Search...";

        return (
            <div className="dropup">
                {this.props.icon && (
                    <div className={"button" + (this.state.isOpen ? " active" : "")} onClick={() => this.switchDropUp()}>
                        <img src={this.props.icon} title={this.props.label} alt={this.props.label} />
                    </div>
                )}
                {this.props.selectedOption && (
                    <div className={"button long" + (this.state.isOpen ? " active" : "")} onClick={() => this.switchDropUp()}>
                        {this.state.isOpen && <img className="button-icon" src={iconDown} alt="Close the list" title="Close the list" />}
                        {!this.state.isOpen && <img className="button-icon" src={iconUp} alt="Open the list" title="Open the list" />}
                        <div className="button-text" title={this.props.selectedOption}>
                            {this.props.selectedOption}
                        </div>
                    </div>
                )}
                {this.state.isOpen && (
                    <div className={"dropup-content" + (this.props.selectedOption ? " long-mode" : "")}>
                        <input type="text" placeholder={searchPlaceholder} value={this.state.searchText} onChange={this.onChangeSearchText} />
                        {this.props.options
                            .filter((o) => {
                                return !this.state.searchText || o.toLowerCase().indexOf(this.state.searchText.toLowerCase().trim()) > -1;
                            })
                            .map((o, i) => {
                                return (
                                    <div title={o} key={o} onClick={() => this.clickOption(o, i)} className="dropup-content-line">
                                        <div
                                            style={{
                                                opacity: this.props.activeEntry() === o ? "1.0" : "0.8",
                                                fontSize: this.props.activeEntry() === o ? "var(--active-font-size)" : "var(--font-size)",
                                            }}
                                        >
                                            {o}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        );
    }
}
