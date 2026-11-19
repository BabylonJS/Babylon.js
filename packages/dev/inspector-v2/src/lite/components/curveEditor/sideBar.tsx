import { type FunctionComponent, useCallback } from "react";

import { makeStyles, Text, tokens } from "@fluentui/react-components";

import { Checkbox } from "shared-ui-components/fluent/primitives/checkbox";
import { useCurveEditor } from "../../../components/curveEditor/normalizedCurveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        backgroundColor: tokens.colorNeutralBackground1,
    },
    heading: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
        minHeight: 0,
        overflowY: "auto",
        padding: tokens.spacingVerticalXS,
    },
    entry: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        minHeight: "32px",
        padding: `0 ${tokens.spacingHorizontalXS}`,
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        color: tokens.colorNeutralForeground1,
        "&:hover": {
            backgroundColor: tokens.colorSubtleBackgroundHover,
        },
        "&:focus-within": {
            outline: `2px solid ${tokens.colorStrokeFocus2}`,
            outlineOffset: "-2px",
        },
    },
    checkbox: {
        flexShrink: 0,
    },
    componentColors: {
        display: "flex",
        gap: tokens.spacingHorizontalXXS,
        flexShrink: 0,
    },
    componentColor: {
        width: "8px",
        height: "8px",
        borderRadius: tokens.borderRadiusCircular,
    },
    name: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    empty: {
        padding: tokens.spacingVerticalS,
        color: tokens.colorNeutralForeground3,
    },
});

/**
 * Lists Lite animation tracks and lets users choose which tracks to display.
 * @returns The Lite curve-editor track sidebar
 */
export const LiteCurveEditorSideBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const handleTrackChange = useCallback(
        (uniqueId: string, isActive: boolean) => {
            const activeAnimations = isActive
                ? [...state.activeCurveAnimations, ...state.animations.filter((animation) => animation.uniqueId === uniqueId)]
                : state.activeCurveAnimations.filter((animation) => animation.uniqueId !== uniqueId);
            actions.setActiveCurveAnimations(activeAnimations);
            actions.resetAllActiveChannels();
            observables.onActiveAnimationChanged.notifyObservers({});
        },
        [state.animations, state.activeCurveAnimations, actions, observables]
    );

    return (
        <div className={styles.root} aria-label="Animation tracks">
            <div className={styles.heading}>
                <Text weight="semibold">Tracks</Text>
            </div>
            {state.animations.length > 0 ? (
                <div className={styles.list}>
                    {state.animations.map((animation, index) => {
                        const isActive = state.activeCurveAnimations.some((activeAnimation) => activeAnimation.uniqueId === animation.uniqueId);
                        const label = animation.name || `Track ${index + 1}`;
                        return (
                            <label key={animation.uniqueId} className={styles.entry} title={label}>
                                <Checkbox className={styles.checkbox} value={isActive} onChange={(checked) => handleTrackChange(animation.uniqueId, checked)} />
                                <div className={styles.componentColors} aria-hidden="true">
                                    {animation.components.map((component) => (
                                        <div key={component.name} className={styles.componentColor} style={{ backgroundColor: component.color }} />
                                    ))}
                                </div>
                                <Text className={styles.name}>{label}</Text>
                            </label>
                        );
                    })}
                </div>
            ) : (
                <Text className={styles.empty}>No animation tracks available.</Text>
            )}
        </div>
    );
};
