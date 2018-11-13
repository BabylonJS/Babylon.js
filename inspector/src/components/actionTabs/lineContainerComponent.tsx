import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface ILineContainerComponentProps {
    title: string,
    children: any[] | any,
    closed?: boolean
}

export class LineContainerComponent extends React.Component<ILineContainerComponentProps, { isExpanded: boolean }> {
    constructor(props: ILineContainerComponentProps) {
        super(props);

        this.state = { isExpanded: !this.props.closed };
    }

    switchExpandedState(): void {
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
