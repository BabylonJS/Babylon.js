import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import type { Container } from "gui/2D/controls/container";

import clipContentsIcon from "shared-ui-components/imgs/clipContentsIcon.svg";

interface IContainerPropertyGridComponentProps {
    containers: Container[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
    render() {
        const containers = this.props.containers;
        return (
            <>
                <CheckBoxLineComponent
                    label="CLIP CONTENT"
                    iconLabel="Clip Content"
                    icon={clipContentsIcon}
                    target={makeTargetsProxy(containers, this.props.onPropertyChangedObservable)}
                    propertyName="clipContent"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    label="CLIP CHILDREN"
                    iconLabel="Clip Children"
                    icon={clipContentsIcon}
                    target={makeTargetsProxy(containers, this.props.onPropertyChangedObservable)}
                    propertyName="clipChildren"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </>
        );
    }
}
