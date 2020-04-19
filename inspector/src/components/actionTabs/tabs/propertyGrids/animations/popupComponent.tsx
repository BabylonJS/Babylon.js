import * as React from "react";
import * as ReactDOM from 'react-dom';

interface IPopupComponentProps {
    id: string,
    title: string,
    size: { width: number, height: number },
    onOpen: (window: Window) => void,
    onClose: (window: Window) => void,
}

export class PopupComponent extends React.Component<IPopupComponentProps, { isComponentMounted: boolean, blockedByBrowser: boolean }> {

    private _container: HTMLDivElement;
    private _window: Window | null;

    constructor(props: IPopupComponentProps) {
        super(props);

        this._container = document.createElement('div')
        this._container.id = this.props.id;
        this._window;

        this.state = {
            isComponentMounted: false,
            blockedByBrowser: false,
        }
    }

    componentDidMount() {
        this.openPopup()
        this.setState({ isComponentMounted: true });
    }

    openPopup() {
        const { title, size, onOpen, onClose } = this.props

        const windowCreationOptionsList = {
            width: size.width,
            height: size.height,
            top: (window.innerHeight - size.width) / 2 + window.screenY,
            left: (window.innerWidth - size.height) / 2 + window.screenX
        };

        var windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map(
                (key) => key + '=' + (windowCreationOptionsList as any)[key]
            )
            .join(',');

        this._window = window.open("", title, windowCreationOptions);

        if (this._window) {
            this._window.document.title = title;
            this._window.document.body.appendChild(this._container);
            onOpen(this._window);
            this._window.addEventListener('beforeunload', () => this._window && onClose(this._window));

        } else {

            if (!this._window) {
                this.setState({ blockedByBrowser: true }, () => {
                    if (this.state.blockedByBrowser) {
                        alert("You might have blocked popups in your browser");
                        console.warn("Popup window couldn't be created");
                    }
                });
            }
        }

    }

    componentWillUnmount() {
        if (this._window) {
            this._window.close()
        }
    }

    render() {
        if (!this.state.isComponentMounted) return null
        return ReactDOM.createPortal(this.props.children, this._container)
    }

}