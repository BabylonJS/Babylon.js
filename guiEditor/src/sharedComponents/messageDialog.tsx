import * as React from "react";

import { GlobalState } from '../globalState';

interface IMessageDialogComponentProps {
    globalState: GlobalState
}

export class MessageDialogComponent extends React.Component<IMessageDialogComponentProps, { message: string, isError: boolean }> {
    constructor(props: IMessageDialogComponentProps) {
        super(props);

        this.state = {message: "", isError: false};

        this.props.globalState.onErrorMessageDialogRequiredObservable.add((message: string) => {
            this.setState({message: message, isError: true});
        });
    }

    render() {
        if (!this.state.message) {
            return null;
        }

        return (
            <div className="dialog-container">
                <div className="dialog">
                    <div className="dialog-message">
                        {
                            this.state.message
                        }
                    </div>
                    <div className="dialog-buttons">
                        <div className={"dialog-button-ok" + (this.state.isError ? " error" : "")} onClick={() => this.setState({message: ""})}>
                            OK
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
