import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import * as React from "react";
import { Nullable } from "babylonjs/types";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

interface IExtensionsComponentProps {
    target: any,
    extensibilityGroups?: IExplorerExtensibilityGroup[]
}

export class ExtensionsComponent extends React.Component<IExtensionsComponentProps, { popupVisible: boolean }> {
    private _popup: Nullable<HTMLDivElement>;
    private extensionRef: React.RefObject<HTMLDivElement>;

    constructor(props: IExtensionsComponentProps) {
        super(props);

        this.state = { popupVisible: false };
        this.extensionRef = React.createRef();
    }

    showPopup() {
        this.setState({ popupVisible: true });
    }

    componentDidMount() {
        if (!this._popup) {
            return;
        }
        this._popup.focus();
    }

    componentDidUpdate() {
        if (!this._popup) {
            return;
        }
        this._popup.focus();
    }

    render() {
        if (!this.props.extensibilityGroups) {
            return null;
        }

        let options = [];

        for (var group of this.props.extensibilityGroups) {
            if (group.predicate(this.props.target)) {
                options.push(...group.entries);
            }
        }

        if (options.length === 0) {
            return null;
        }

        return (
            <div ref={this.extensionRef} className="extensions" onClick={() => this.showPopup()}>
                <div title="Additional options" className="icon">
                    <FontAwesomeIcon icon={faEllipsisH} />
                </div>
                <div ref={(input) => { this._popup = input }} tabIndex={-1} className={this.state.popupVisible ? "popup show" : "popup"} onBlur={() => this.setState({ popupVisible: false })}>
                    {
                        options.map(extensibility => {
                            return (
                                <div key={extensibility.label} className="popupMenu" onClick={() => extensibility.action(this.props.target)}>
                                    {extensibility.label}
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        )
    }
}