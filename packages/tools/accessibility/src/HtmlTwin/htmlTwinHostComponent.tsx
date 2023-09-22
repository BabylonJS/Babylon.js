import * as React from "react";
import type { HTMLTwinItem } from "./htmlTwinItem";
import type { Scene } from "core/scene";
import type { Observable, Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
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
    private _observersMap = new Map<Observable<any>, Nullable<Observer<any>>>();
    private _options: IHTMLTwinRendererOptions;

    constructor(props: IHTMLTwinHostComponentProps) {
        super(props);
        this._options = props.options ?? {
            addAllControls: true,
        };
        this.state = { a11yTreeItems: [] };
    }

    componentDidUpdate(prevProps: Readonly<IHTMLTwinHostComponentProps>, prevState: Readonly<IHTMLTwinHostComponentState>, snapshot?: any): void {
        // If we changed scenes, we have to re-attach observers to the new scene.
        if (prevProps.scene !== this.props.scene) {
            //todo
        }
    }

    componentDidMount() {
        //todo
    }

    componentWillUnmount() {
        //todo
    }

    render() {
        return (
            <div id={"accessibility-host"}>
                <HTMLTwinSceneTree scene={this.props.scene} />
            </div>
        );
    }
}
