import * as React from "react";
import { DataStorage } from "core/Misc/dataStorage";
import type { ISelectedLineContainer } from "./iSelectedLineContainer";
import downArrow from "./downArrow.svg";

interface ILineContainerComponentProps {
    selection?: ISelectedLineContainer;
    title: string;
    children: any[] | any;
    closed?: boolean;
}

export class LineContainerComponent extends React.Component<ILineContainerComponentProps, { isExpanded: boolean; isHighlighted: boolean }> {
    constructor(props: ILineContainerComponentProps) {
        super(props);

        const initialState = DataStorage.ReadBoolean(this.props.title, !this.props.closed);

        this.state = { isExpanded: initialState, isHighlighted: false };
    }

    switchExpandedState(): void {
        const newState = !this.state.isExpanded;

        DataStorage.WriteBoolean(this.props.title, newState);

        this.setState({ isExpanded: newState });
    }

    renderHeader() {
        const className = this.state.isExpanded ? "collapse" : "collapse closed";

        return (
            <div className="header" onClick={() => this.switchExpandedState()}>
                <div className="title">{this.props.title}</div>
                <div className={className}>
                    <img className="img" title={this.props.title} src={downArrow} />
                </div>
            </div>
        );
    }

    componentDidMount() {
        if (!this.props.selection) {
            return;
        }

        if (this.props.selection.selectedLineContainerTitles.length === 0 && this.props.selection.selectedLineContainerTitlesNoFocus.length === 0) {
            return;
        }

        if (this.props.selection.selectedLineContainerTitles.indexOf(this.props.title) > -1) {
            setTimeout(() => {
                this.props.selection!.selectedLineContainerTitles = [];
            });

            this.setState({ isExpanded: true, isHighlighted: true });

            window.setTimeout(() => {
                this.setState({ isHighlighted: false });
            }, 5000);
        } else if (this.props.selection.selectedLineContainerTitlesNoFocus.indexOf(this.props.title) > -1) {
            this.setState({ isExpanded: true, isHighlighted: false });
        } else {
            this.setState({ isExpanded: false });
        }
    }

    render() {
        if (!this.state.isExpanded) {
            return (
                <div className="paneContainer">
                    <div className="paneContainer-content">{this.renderHeader()}</div>
                </div>
            );
        }

        return (
            <div className="paneContainer">
                <div className="paneContainer-content">
                    {this.renderHeader()}
                    <div className="paneList">{this.props.children}</div>
                </div>
                <div className={"paneContainer-highlight-border" + (!this.state.isHighlighted ? " transparent" : "")}></div>
            </div>
        );
    }
}
