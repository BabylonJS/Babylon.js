import * as React from "react";
import type { HTMLTwinItem } from "./htmlTwinItem";
import type { Scene } from "core/scene";
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";
import { HTMLTwinSceneTree } from "./htmlTwinSceneTree";

interface IHTMLTwinHostComponentProps {
    scene: Scene;
    options?: IHTMLTwinRendererOptions;
}
interface IHTMLTwinHostComponentState {
    a11yTreeItems: HTMLTwinItem[];
}

export class HTMLTwinHostComponent extends React.Component<IHTMLTwinHostComponentProps, IHTMLTwinHostComponentState> {
    private _options: IHTMLTwinRendererOptions;

    constructor(props: IHTMLTwinHostComponentProps) {
        super(props);
        this._options = props.options ?? {
            addAllControls: true,
        };
    }

    override render() {
        return (
            <div id={"accessibility-host"}>
                <HTMLTwinSceneTree scene={this.props.scene} options={this._options} />
            </div>
        );
    }
}
