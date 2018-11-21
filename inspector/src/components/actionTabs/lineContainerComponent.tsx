import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface ILineContainerComponentProps {
    title: string,
    children: any[] | any,
    closed?: boolean
}

const localStorageAvailable = function () {
    const test = '_____';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}();

export class LineContainerComponent extends React.Component<ILineContainerComponentProps, { isExpanded: boolean }> {
    constructor(props: ILineContainerComponentProps) {
        super(props);

        let initialState: boolean;

        if (localStorageAvailable && localStorage.getItem(this.props.title) !== null) {
            initialState = localStorage.getItem(this.props.title) === "true";
        } else {
            initialState = !this.props.closed;
        }

        this.state = { isExpanded: initialState };
    }

    switchExpandedState(): void {
        if (localStorageAvailable) {
            localStorage.setItem(this.props.title, !this.state.isExpanded ? "true" : "false");
        }
        this.setState({ isExpanded: !this.state.isExpanded });
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
        )
    }

    render() {
        if (!this.state.isExpanded) {
            return (
                <div className="paneContainer">
                    {
                        this.renderHeader()
                    }
                </div>
            )
        }

        return (
            <div className="paneContainer">
                {
                    this.renderHeader()
                }
                <div className="paneList">
                    {this.props.children}
                </div >
            </div>
        );
    }
}
