import * as React from "react";
import * as ReactDOM from "react-dom";
import { Inspector } from "../inspector";

interface IPopupComponentProps {
    id: string;
    title: string;
    size: { width: number; height: number };
    onOpen: (window: Window) => void;
    onClose: (window: Window) => void;
}

export class PopupComponent extends React.Component<IPopupComponentProps, { isComponentMounted: boolean; blockedByBrowser: boolean }> {
    private _container: HTMLDivElement | null;
    private _window: Window | null;
    private _curveEditorHost: HTMLDivElement;

    constructor(props: IPopupComponentProps) {
        super(props);

        this._container = document.createElement("div");
        this._container.id = this.props.id;
        this._window;

        this.state = {
            isComponentMounted: false,
            blockedByBrowser: false,
        };
    }

    componentDidMount() {
        this.openPopup();
        this.setState({ isComponentMounted: true });
    }

    openPopup() {
        const { title, size, onClose, onOpen } = this.props;

        let windowVariableName = `window_${title}`;

        this._container = Inspector._CreatePopup(title, windowVariableName, size.width, size.height);

        if (this._container) {
            this._curveEditorHost = this._container.ownerDocument!.createElement("div");

            this._curveEditorHost.id = "curve-editor-host";
            this._curveEditorHost.style.width = "auto";
            this._container.appendChild(this._curveEditorHost);
        }

        this._window = (Inspector as any)[windowVariableName];

        if (this._window) {
            onOpen(this._window);
            this._window.addEventListener("beforeunload", () => this._window && onClose(this._window));
        } else {
            if (!this._window) {
                this.setState({ blockedByBrowser: true }, () => {
                    if (this.state.blockedByBrowser) {
                        console.warn("Popup window couldn't be created");
                    }
                });
            }
        }
    }

    componentWillUnmount() {
        if (this._window) {
            this._window.close();
        }
    }

    render() {
        if (!this.state.isComponentMounted || this._container === null) {
            return null;
        }
        return ReactDOM.createPortal(this.props.children, this._curveEditorHost);
    }
}
