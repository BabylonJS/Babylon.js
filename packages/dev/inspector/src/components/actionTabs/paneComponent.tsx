import * as React from "react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { GlobalState } from "../../components/globalState";

export interface IPaneComponentProps {
    title: string;
    icon: IconDefinition;
    scene: Scene;
    selectedEntity?: any;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    globalState: GlobalState;
}

export class PaneComponent extends React.Component<IPaneComponentProps, { tag: any }> {
    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render(): JSX.Element | null {
        return <div className="pane"></div>;
    }
}
