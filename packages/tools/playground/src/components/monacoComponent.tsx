import * as React from "react";
import { MonacoManager } from "../tools/monacoManager";
import type { GlobalState } from "../globalState";

import "../scss/monaco.scss";

interface IMonacoComponentProps {
    className?: string;
    refObject: React.RefObject<HTMLDivElement>;
    globalState: GlobalState;
}
export class MonacoComponent extends React.Component<IMonacoComponentProps> {
    private readonly _mutationObserver: MutationObserver;
    private _monacoManager: MonacoManager;

    public constructor(props: IMonacoComponentProps) {
        super(props);

        this._monacoManager = new MonacoManager(this.props.globalState);

        this.props.globalState.onEditorFullcreenRequiredObservable.add(() => {
            const editorDiv = this.props.refObject.current! as any;
            if (editorDiv.requestFullscreen) {
                editorDiv.requestFullscreen();
                // iOS 12 introduced the ewbkit prefixed version of the Fullscreen API. Not needed since 16.4
            } else if (editorDiv.webkitRequestFullscreen) {
                editorDiv.webkitRequestFullscreen();
            }
        });

        // NOTE: This is a workaround currently needed when using Fluent. Specifically, Fluent currently manages focus (handling tab key events),
        // and only excludes elements with `contentEditable` set to `"true"`. Monaco does not set this attribute on textareas by default. Probably
        // Fluent should be checking `isContentEditable` instead as `contentEditable` can be set to `"inherit"`, in which case `isContentEditable`
        // is inherited from the parent element. If it worked this way, then we could simply set `contentEditable` to `"true"` on the monacoHost
        // div in this file.
        this._mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If the added node is a textarea
                        if ((node as HTMLElement).tagName === "TEXTAREA") {
                            (node as HTMLTextAreaElement).contentEditable = "true";
                        }
                        // If the added node contains textareas as descendants
                        (node as HTMLElement).querySelectorAll?.("textarea").forEach((textArea) => {
                            textArea.contentEditable = "true";
                        });
                    }
                }
            }
        });
    }

    override componentDidMount() {
        const hostElement = this.props.refObject.current!;
        this._mutationObserver.observe(hostElement, { childList: true, subtree: true });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._monacoManager.setupMonacoAsync(hostElement, true);
    }

    override componentWillUnmount(): void {
        this._mutationObserver.disconnect();
    }

    public override render() {
        return <div id="monacoHost" ref={this.props.refObject} className={this.props.className}></div>;
    }
}
