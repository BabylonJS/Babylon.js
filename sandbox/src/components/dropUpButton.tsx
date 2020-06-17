import * as React from "react";
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';


interface IDropUpButtonProps {
    globalState: GlobalState;
    enabled: boolean;
    icon: any;
    label: string;
    options: string[];
    onOptionPicked: (option: string) => void;
}

export class DropUpButton extends React.Component<IDropUpButtonProps, {isOpen: boolean}> {
    private _onClickInterceptorClickedObserver: Nullable<Observer<void>>;

    public constructor(props: IDropUpButtonProps) {    
        super(props);

        this.state = {isOpen: false};

        this._onClickInterceptorClickedObserver = props.globalState.onClickInterceptorClicked.add(() => {
            this.switchDropUp();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onClickInterceptorClicked.remove(this._onClickInterceptorClickedObserver);
    }

    switchDropUp() {
        this.props.globalState.onRequestClickInterceptor.notifyObservers();
        this.setState({isOpen: !this.state.isOpen});
    }

    clickOption(option: string) {
        this.switchDropUp()
        this.props.onOptionPicked(option);
    }

    public render() {
        if (!this.props.enabled) {
            return null;
        }

        return (
            <>
                <div className="button" onClick={() => this.switchDropUp()}>
                    <img src={this.props.icon} alt={this.props.label} title={this.props.label}  />
                </div>
                {
                    this.state.isOpen &&
                    <div className="dropup-content">
                    {
                        this.props.options.map(o => {
                            return(
                                <div key={o} onClick={() => this.clickOption(o)}>
                                    {o}
                                </div>
                            )
                        })
                    }
                    </div>
                }
            </>
        )
    }
}