import * as React from "react";
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Scene, Observable } from "babylonjs";
import { PropertyChangedEvent } from "../propertyChangedEvent";

export interface IPaneComponentProps {
    title: string,
    icon: IconDefinition, scene: Scene,
    selectedEntity?: any,
    onSelectionChangeObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PaneComponent extends React.Component<IPaneComponentProps, { tag: any }> {
    constructor(props: IPaneComponentProps) {
        super(props);
    }

    render(): JSX.Element | null {
        return (
            <div className="pane">
            </div>
        );
    }
}
