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

    private _CopyStyles(sourceDoc: HTMLDocument, targetDoc: HTMLDocument) {
        for (var index = 0; index < sourceDoc.styleSheets.length; index++) {
            var styleSheet: any = sourceDoc.styleSheets[index];
            try {
                if (styleSheet.cssRules) { // for <style> elements
                    const newStyleEl = sourceDoc.createElement('style');

                    for (var cssRule of styleSheet.cssRules) {
                        // write the text of each rule into the body of the style element
                        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                    }

                    targetDoc.head!.appendChild(newStyleEl);
                } else if (styleSheet.href) { // for <link> elements loading CSS from a URL
                    const newLinkEl = sourceDoc.createElement('link');

                    newLinkEl.rel = 'stylesheet';
                    newLinkEl.href = styleSheet.href;
                    targetDoc.head!.appendChild(newLinkEl);
                }
            } catch (e) {
                console.log(e);
            }

        }
    }

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
            this._CopyStyles(window.document, this._window.document);
            this._window.document.body.innerHTML = "";
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