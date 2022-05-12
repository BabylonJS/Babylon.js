import * as React from "react";
import type { GlobalState } from "../globalState";
import type { Nullable } from "core/types";

import "../scss/errorDisplay.scss";

interface IErrorDisplayComponentProps {
    globalState: GlobalState;
}

export class CompilationError {
    message:
        | string
        | {
              messageText: string;
          };
    lineNumber?: number;
    columnNumber?: number;
}

export class ErrorDisplayComponent extends React.Component<IErrorDisplayComponentProps, { error: Nullable<CompilationError> }> {
    public constructor(props: IErrorDisplayComponentProps) {
        super(props);

        this.state = { error: null };

        this.props.globalState.onErrorObservable.add((err) => {
            this.setState({ error: err });
        });
    }

    private _onClick() {
        if (this.state.error && this.state.error.lineNumber && this.state.error.columnNumber) {
            const position = {
                lineNumber: this.state.error.lineNumber,
                column: this.state.error.columnNumber,
            };

            this.props.globalState.onNavigateRequiredObservable.notifyObservers(position);
        }
        this.setState({ error: null });
    }

    public render() {
        if (!this.state.error) {
            return null;
        }

        return (
            <div className="error-display" onClick={() => this._onClick()}>
                {typeof this.state.error === "string" && this.state.error}
                {this.state.error.lineNumber && this.state.error.columnNumber && `Error at [${this.state.error.lineNumber}, ${this.state.error.columnNumber}]: `}
                {this.state.error.message && (typeof this.state.error.message === "string" ? this.state.error.message : this.state.error.message.messageText)}
            </div>
        );
    }
}
