import type { MenuButtonProps, MenuCheckedValueChangeData, MenuCheckedValueChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

import type { IGizmoService } from "../services/gizmoService";
import type { GizmoMode } from "../services/gizmoService";

import { makeStyles, Menu, MenuItemRadio, MenuList, MenuPopover, MenuTrigger, SplitButton, tokens, Tooltip } from "@fluentui/react-components";
import { ArrowExpandRegular, ArrowRotateClockwiseRegular, CubeRegular, GlobeRegular, SelectObjectRegular } from "@fluentui/react-icons";
import { useCallback } from "react";

import { GizmoCoordinatesMode } from "core/Gizmos/gizmo";
import { TranslateIcon } from "shared-ui-components/fluent/icons";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useObservableState } from "../hooks/observableHooks";

const useStyles = makeStyles({
    coordinatesModeButton: {
        margin: `0 0 0 ${tokens.spacingHorizontalXS}`,
    },
    coordinatesModeMenu: {
        minWidth: 0,
    },
});

export const GizmoToolbar: FunctionComponent<{ gizmoService: IGizmoService }> = (props) => {
    const { gizmoService } = props;

    const classes = useStyles();

    const gizmoMode = useObservableState(() => gizmoService.gizmoMode, gizmoService.onGizmoModeChanged);
    const coordinatesMode = useObservableState(() => gizmoService.coordinatesMode, gizmoService.onCoordinatesModeChanged);

    const updateGizmoMode = useCallback(
        (mode: GizmoMode) => {
            gizmoService.gizmoMode = gizmoService.gizmoMode === mode ? undefined : mode;
        },
        [gizmoService]
    );

    const onCoordinatesModeChange = useCallback(
        (e: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => {
            gizmoService.coordinatesMode = Number(data.checkedItems[0]);
        },
        [gizmoService]
    );

    const toggleCoordinatesMode = useCallback(() => {
        gizmoService.coordinatesMode = coordinatesMode === GizmoCoordinatesMode.Local ? GizmoCoordinatesMode.World : GizmoCoordinatesMode.Local;
    }, [gizmoService, coordinatesMode]);

    return (
        <>
            <ToggleButton title="Translate" checkedIcon={TranslateIcon} value={gizmoMode === "translate"} onChange={() => updateGizmoMode("translate")} />
            <ToggleButton title="Rotate" checkedIcon={ArrowRotateClockwiseRegular} value={gizmoMode === "rotate"} onChange={() => updateGizmoMode("rotate")} />
            <ToggleButton title="Scale" checkedIcon={ArrowExpandRegular} value={gizmoMode === "scale"} onChange={() => updateGizmoMode("scale")} />
            <ToggleButton title="Bounding Box" checkedIcon={SelectObjectRegular} value={gizmoMode === "boundingBox"} onChange={() => updateGizmoMode("boundingBox")} />
            <Collapse visible={!!gizmoMode} orientation="horizontal">
                {/* TODO: gehalper factor this into a shared component */}
                <Menu positioning="below-end" checkedValues={{ coordinatesMode: [coordinatesMode.toString()] }} onCheckedValueChange={onCoordinatesModeChange}>
                    <MenuTrigger disableButtonEnhancement={true}>
                        {(triggerProps: MenuButtonProps) => (
                            <Tooltip content="Coordinates Mode" relationship="label">
                                <SplitButton
                                    className={classes.coordinatesModeButton}
                                    menuButton={triggerProps}
                                    primaryActionButton={{
                                        onClick: toggleCoordinatesMode,
                                    }}
                                    size="small"
                                    appearance="transparent"
                                    shape="rounded"
                                    icon={coordinatesMode === GizmoCoordinatesMode.Local ? <CubeRegular /> : <GlobeRegular />}
                                ></SplitButton>
                            </Tooltip>
                        )}
                    </MenuTrigger>

                    <MenuPopover className={classes.coordinatesModeMenu}>
                        <MenuList>
                            <MenuItemRadio name="coordinatesMode" value={GizmoCoordinatesMode.Local.toString()}>
                                Local
                            </MenuItemRadio>
                            <MenuItemRadio name="coordinatesMode" value={GizmoCoordinatesMode.World.toString()}>
                                World
                            </MenuItemRadio>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </Collapse>
        </>
    );
};
