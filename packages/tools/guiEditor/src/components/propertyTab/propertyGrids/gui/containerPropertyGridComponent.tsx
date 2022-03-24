import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import type { Container } from "gui/2D/controls/container";

import clipContentsIcon from "shared-ui-components/imgs/clipContentsIcon.svg";
import clipChildrenIcon from "shared-ui-components/imgs/clipChildrenIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";

interface IContainerPropertyGridComponentProps {
    containers: Container[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
    render() {
        const containers = this.props.containers;
        return (
            <>
                <div className="ge-divider">
                    <IconComponent icon={clipContentsIcon} label={"Clip Content"} />
                    <CheckBoxLineComponent label="CLIP CONTENT" target={makeTargetsProxy(containers, this.props.onPropertyChangedObservable)} propertyName="clipContent" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={clipChildrenIcon} label={"Clip Children"} />
                    <CheckBoxLineComponent label="CLIP CHILDREN" target={makeTargetsProxy(containers, this.props.onPropertyChangedObservable)} propertyName="clipChildren" />
                </div>
            </>
        );
    }
}
