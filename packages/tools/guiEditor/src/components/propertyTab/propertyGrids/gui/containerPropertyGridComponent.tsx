import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import type { Container } from "gui/2D/controls/container";

import clipContentsIcon from "shared-ui-components/imgs/clipContentsIcon.svg";
import clipChildrenIcon from "shared-ui-components/imgs/clipChildrenIcon.svg";
import autoStretchWidthIcon from "shared-ui-components/imgs/autoStretchWidthIcon.svg";
import autoStretchHeightIcon from "shared-ui-components/imgs/autoStretchHeightIcon.svg";
import adtIcon from "../../../../imgs/adtIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";

interface IContainerPropertyGridComponentProps {
    containers: Container[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
    render() {
        const { containers, onPropertyChangedObservable } = this.props;
        const proxy = makeTargetsProxy(containers, onPropertyChangedObservable);
        return (
            <>
                <div className="ge-divider">
                    <IconComponent icon={clipContentsIcon} label={"Clips content outside the bounding box of this control"} />
                    <CheckBoxLineComponent label="CLIP CONTENT" target={proxy} propertyName="clipContent" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={clipChildrenIcon} label={"Clips child controls to this control's shape"} />
                    <CheckBoxLineComponent label="CLIP CHILDREN" target={proxy} propertyName="clipChildren" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={autoStretchWidthIcon} label={"Makes the container's width automatically adapt to its children"} />
                    <CheckBoxLineComponent label="ADAPT WIDTH TO CHILDREN" target={proxy} propertyName="adaptWidthToChildren" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={autoStretchHeightIcon} label={"Makes the container's height automatically adapt to its children"} />
                    <CheckBoxLineComponent label="ADAPT HEIGHT TO CHILDREN" target={proxy} propertyName="adaptHeightToChildren" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={adtIcon} label={"Delegates picking to children controls"} />
                    <CheckBoxLineComponent label="DELEGATE PICKING TO CHILDREN" target={proxy} propertyName="delegatePickingToChildren" />
                </div>
            </>
        );
    }
}
