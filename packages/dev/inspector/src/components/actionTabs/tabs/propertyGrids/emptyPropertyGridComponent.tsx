import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../globalState";
import { CustomPropertyGridComponent } from "./customPropertyGridComponent";

interface IEmptyPropertyGridComponentProps {
    globalState: GlobalState;
    item: { inspectableCustomProperties: any };
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class EmptyPropertyGridComponent extends React.Component<IEmptyPropertyGridComponentProps> {
    constructor(props: IEmptyPropertyGridComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="pane">
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    target={this.props.item}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
