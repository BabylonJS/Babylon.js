import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { GlobalState } from '../../components/globalState';

interface ILineContainerComponentProps {
    globalState: GlobalState;
    title: string;
    children: any[] | any;
    closed?: boolean;
}

export class LineContainerComponent extends React.Component<ILineContainerComponentProps, { isExpanded: boolean, isHighlighted: boolean }> {
    private static _InMemoryStorage: { [key: string]: boolean };

    constructor(props: ILineContainerComponentProps) {
        super(props);

        let initialState: boolean;

        try {
            if (LineContainerComponent._InMemoryStorage && LineContainerComponent._InMemoryStorage[this.props.title] !== undefined) {
                initialState = LineContainerComponent._InMemoryStorage[this.props.title];
            } else if (typeof (Storage) !== "undefined" && localStorage.getItem(this.props.title) !== null) {
                initialState = localStorage.getItem(this.props.title) === "true";
            } else {
                initialState = !this.props.closed;
            }
        }
        catch (e) {
            LineContainerComponent._InMemoryStorage = {};
            LineContainerComponent._InMemoryStorage[this.props.title] = !this.props.closed
            initialState = !this.props.closed;
        }

        this.state = { isExpanded: initialState, isHighlighted: false };
    }

    switchExpandedState(): void {
        const newState = !this.state.isExpanded;

        try {
            if (LineContainerComponent._InMemoryStorage) {
                LineContainerComponent._InMemoryStorage[this.props.title] = newState;
            } else if (typeof (Storage) !== "undefined") {
                localStorage.setItem(this.props.title, newState ? "true" : "false");
            }
        }
        catch (e) {
            LineContainerComponent._InMemoryStorage = {};
            LineContainerComponent._InMemoryStorage[this.props.title] = newState;
        }

        this.setState({ isExpanded: newState });
    }

    componentDidMount() {
        if (!this.props.globalState.selectedLineContainerTitle) {
            return;
        }

        if (this.props.globalState.selectedLineContainerTitle === this.props.title) {
            setTimeout(() => {
                this.props.globalState.selectedLineContainerTitle = "";
            });

            this.setState({ isExpanded: true, isHighlighted: true });

            window.setTimeout(() => {
                this.setState({ isHighlighted: false });
            }, 5000);
        } else {
            this.setState({isExpanded: false});
        }        
    }

    renderHeader() {
        const className = this.state.isExpanded ? "collapse" : "collapse closed";

        return (
            <div className="header" onClick={() => this.switchExpandedState()}>
                <div className="title">
                    {this.props.title}
                </div>
                <div className={className}>
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
            </div>
        );
    }

    render() {
        if (!this.state.isExpanded) {
            return (
                <div className="paneContainer">
                    <div className="paneContainer-content">
                        {
                            this.renderHeader()
                        }
                    </div>
                </div>
            );
        }

        return (
            <div className="paneContainer">
                <div className="paneContainer-content">
                    {
                        this.renderHeader()
                    }
                    <div className="paneList">
                        {this.props.children}
                    </div >
                </div>
                <div className={"paneContainer-highlight-border" + (!this.state.isHighlighted ? " transparent" : "")}>
                </div>
            </div>
        );
    }
}
