import { useMemo, type FunctionComponent } from "react";
// eslint-disable-next-line import/no-internal-modules
import type { ViewerElement, ViewerDetails, Viewer } from "viewer/index";

import * as styles from "./configurator.module.scss";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

export const Configurator: FunctionComponent<{ viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerElement, viewerDetails, viewer } = props;
    const lockObject = useMemo(() => new LockObject(), []);

    return (
        <div className={styles["ConfiguratorContainer"]}>
            <LineContainerComponent title="SECTION 1">
                <TextInputLineComponent label="Text Input, single" value="Value" />
                <TextInputLineComponent label="Text Input, multiline" multilines={true} value="Value" />
                <ButtonLineComponent label="Button" onClick={() => {}} />
            </LineContainerComponent>
            <LineContainerComponent title="SECTION 2">
                <CheckBoxLineComponent
                    label="Checkbox"
                    isSelected={() => {
                        return true;
                    }}
                    onSelect={(value: boolean) => {}}
                />
                <SliderLineComponent label="Slider" minimum={0} maximum={1} step={0.05} decimalCount={2} target={viewerDetails.scene} lockObject={lockObject} />
            </LineContainerComponent>
        </div>
    );
};
