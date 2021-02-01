import * as React from "react";
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';

require("../scss/errorDisplay.scss");

interface IErrorDisplayComponentProps {
    globalState: GlobalState;
}

export class CompilationError {
    message: string;
    lineNumber?: number;
    columnNumber?: number;
}

export class ErrorDisplayComponent extends React.Component<IErrorDisplayComponentProps, {error: Nullable<CompilationError>}> {    
    
    public constructor(props: IErrorDisplayComponentProps) {
        super(props);

        this.state = {error: null};

        this.props.globalState.onErrorObservable.add((err) => {
            this.setState({error: err});
        });
    }

    private _onClick() {
        if (this.state.error && this.state.error.lineNumber && this.state.error.columnNumber) {
            const position = {
                lineNumber: this.state.error.lineNumber,
                column: this.state.error.columnNumber
            };

            this.props.globalState.onNavigateRequiredObservable.notifyObservers(position);
        }
        this.setState({error: null});
    }

    public render() {

        if (!this.state.error) {
            return null;
        }

        return (
            <div className="error-display" onClick={() => this._onClick()}>
                {
                    this.state.error.lineNumber && this.state.error.columnNumber &&
                    `Error at [${this.state.error.lineNumber}, ${this.state.error.columnNumber}]: `
                }
                {this.state.error.message}
            </div>
        )
    }
}