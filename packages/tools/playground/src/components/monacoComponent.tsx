import * as React from "react";
import { MonacoManager } from "../tools/monacoManager";
import type { GlobalState } from "../globalState";

import "../scss/monaco.scss";

interface IMonacoComponentProps {
    className: string;
    refObject: React.RefObject<HTMLDivElement>;
    globalState: GlobalState;
}
export class MonacoComponent extends React.Component<IMonacoComponentProps> {
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
    }

    override componentDidMount() {
        const hostElement = this.props.refObject.current!;
        this._monacoManager.setupMonacoAsync(hostElement, true);
    }

    public override render() {
        return <div id="monacoHost" ref={this.props.refObject} className={this.props.className}></div>;
    }
}
