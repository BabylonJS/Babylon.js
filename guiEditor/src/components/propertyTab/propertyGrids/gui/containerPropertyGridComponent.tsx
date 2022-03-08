import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";
import { Container } from "babylonjs-gui/2D/controls/container";

const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");

interface IContainerPropertyGridComponentProps {
    containers: Container[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
    render() {
        const containers = this.props.containers;
        return <>
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
    }
}