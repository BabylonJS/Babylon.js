import type { FunctionComponent } from "react";

import type { ClusteredLightContainer } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { Badge, makeStyles } from "@fluentui/react-components";
import { useCallback } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { useObservableArray } from "../../../hooks/useObservableArray";
import { BoundProperty } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

const useStyles = makeStyles({
    lightsListDiv: {
        display: "flex",
        flexDirection: "column",
    },
});

export const ClusteredLightContainerSetupProperties: FunctionComponent<{ context: ClusteredLightContainer }> = ({ context: container }) => {
    return (
        <>
            <BooleanBadgePropertyLine label="Is Supported" value={container.isSupported} />
            <BoundProperty label="Horizontal Tiles" component={NumberInputPropertyLine} target={container} propertyKey="horizontalTiles" step={1} min={1} forceInt />
            <BoundProperty label="Vertical Tiles" component={NumberInputPropertyLine} target={container} propertyKey="verticalTiles" step={1} min={1} forceInt />
            <BoundProperty label="Depth Slices" component={NumberInputPropertyLine} target={container} propertyKey="depthSlices" step={1} min={1} forceInt />
            <BoundProperty label="Max Range" component={NumberInputPropertyLine} target={container} propertyKey="maxRange" min={1} />
        </>
    );
};

export const ClusteredLightContainerLightsProperties: FunctionComponent<{ container: ClusteredLightContainer; selectionService: ISelectionService }> = ({
    container,
    selectionService,
}) => {
    const classes = useStyles();

    const lights = useObservableArray(
        container,
        useCallback(() => container.lights, [container]),
        "addLight",
        "removeLight"
    );

    return (
        <PropertyLine
            label="Lights"
            expandedContent={
                <div className={classes.lightsListDiv}>
                    {lights.map((light) => (
                        <LinkToEntityPropertyLine key={light.uniqueId} label={light.getClassName()} entity={light} selectionService={selectionService} />
                    ))}
                </div>
            }
        >
            <Badge appearance="filled">{lights.length}</Badge>
        </PropertyLine>
    );
};
