import * as React from "react";
import * as ReactDOM from "react-dom";
import { Logger } from "core/Misc/logger";
import { CreatePopup } from "shared-ui-components/popupHelper";
import type { PropsWithChildren } from "react";

export interface IPopupComponentProps {
    id: string;
    title: string;
    size: { width: number; height: number };
    onOpen?: (window: Window) => void;
    onClose: (window: Window) => void;
    onResize?: (window: Window) => void;
    onKeyUp?: (evt: KeyboardEvent) => void;
    onKeyDown?: (evt: KeyboardEvent) => void;
}

export class PopupComponent extends React.Component<PropsWithChildren<IPopupComponentProps>, { isComponentMounted: boolean; blockedByBrowser: boolean }> {
    private _container: HTMLDivElement | null;
    private _window: Window | null;
    private _host: HTMLDivElement;

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

    override componentDidMount() {
        this.openPopup();
        this.setState({ isComponentMounted: true });
    }

    onBeforeUnloadListener = () => {
        if (this._window) {
            this._window.close();
        }
    };

    openPopup() {
        const { title, size, onClose, onOpen } = this.props;

        this._container = CreatePopup(title, { onWindowCreateCallback: (w) => (this._window = w), width: size.width, height: size.height });

        if (this._container) {
            this._host = this._container.ownerDocument.createElement("div");

            this._host.id = "host";
            this._host.style.width = "auto";
            this._container.appendChild(this._host);
        }

        window.addEventListener("beforeunload", this.onBeforeUnloadListener);

        if (this._window) {
            if (onOpen) {
                onOpen(this._window);
            }
            this._window.addEventListener("keyup", (evt) => {
                if (this.props.onKeyUp) {
                    this.props.onKeyUp(evt);
                }
            });

            this._window.addEventListener("keydown", (evt) => {
                if (this.props.onKeyDown) {
                    this.props.onKeyDown(evt);
                }
            });

            this._window.addEventListener("beforeunload", () => this._window && onClose(this._window));
            this._window.addEventListener("resize", () => {
                if (this.props.onResize) {
                    this._window && this.props.onResize(this._window);
                }
            });
        } else {
            if (!this._window) {
                this.setState({ blockedByBrowser: true }, () => {
                    if (this.state.blockedByBrowser) {
                        Logger.Warn("Popup window couldn't be created");
                    }
                });
            }
        }
    }

    override componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onBeforeUnloadListener);
        if (this._window) {
            this._window.close();
        }
    }

    getWindow() {
        return this._window;
    }

    override render() {
        if (!this.state.isComponentMounted || this._container === null) {
            return null;
        }
        return ReactDOM.createPortal(this.props.children, this._host);
    }
}
