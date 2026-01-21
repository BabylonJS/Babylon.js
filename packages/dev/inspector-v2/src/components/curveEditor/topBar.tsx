import type { FunctionComponent } from "react";

import { makeStyles, tokens, Divider } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";
import {
    AddRegular,
    DeleteRegular,
    FullScreenMaximizeRegular,
    ArrowMinimizeRegular,
    LineHorizontal1Regular,
    ChevronDoubleRightRegular,
    ChevronDoubleLeftRegular,
} from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";
import { useCurveEditor } from "./curveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground3,
        height: "40px",
        boxSizing: "border-box",
    },
    title: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase300,
        marginRight: tokens.spacingHorizontalM,
    },
    inputGroup: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    inputLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    spinButton: {
        width: "80px",
    },
    buttonGroup: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS,
    },
    divider: {
        height: "24px",
    },
});

/**
 * Top toolbar for the curve editor with frame/value inputs and action buttons
 * @returns The top bar component
 */
export const TopBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();

    const [keyFrameValue, setKeyFrameValue] = useState<number | null>(null);
    const [keyValue, setKeyValue] = useState<number | null>(null);
    const [frameControlEnabled, setFrameControlEnabled] = useState(false);
    const [valueControlEnabled, setValueControlEnabled] = useState(false);

    const hasActiveAnimations = state.activeAnimations.length > 0;
    const hasActiveKeyPoints = state.activeKeyPoints && state.activeKeyPoints.length > 0;

    // Subscribe to observables
    useEffect(() => {
        const onFrameSetObserver = observables.onFrameSet.add((newFrameValue) => {
            setKeyFrameValue(Math.round(newFrameValue));
        });

        const onValueSetObserver = observables.onValueSet.add((newValue) => {
            setKeyValue(parseFloat(newValue.toFixed(2)));
        });

        const onActiveAnimationChangedObserver = observables.onActiveAnimationChanged.add(() => {
            // Only reset values if there are no active key points selected
            // This prevents values from being cleared during drag operations
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                setKeyFrameValue(null);
                setKeyValue(null);
            }
        });

        const onActiveKeyPointChangedObserver = observables.onActiveKeyPointChanged.add(() => {
            const numKeys = state.activeKeyPoints?.length || 0;
            // TODO: Properly type KeyPointComponent to access curve.animation
            const numAnims = numKeys;

            const frameEnabled = (numKeys === 1 && numAnims === 1) || (numKeys > 1 && numAnims > 1);
            setFrameControlEnabled(frameEnabled);
            setValueControlEnabled(numKeys > 0);
            // Don't reset values here - they are set by onFrameSet/onValueSet observers
        });

        return () => {
            observables.onFrameSet.remove(onFrameSetObserver);
            observables.onValueSet.remove(onValueSetObserver);
            observables.onActiveAnimationChanged.remove(onActiveAnimationChangedObserver);
            observables.onActiveKeyPointChanged.remove(onActiveKeyPointChangedObserver);
        };
    }, [observables, state.activeKeyPoints]);

    const handleFrameChange = useCallback(
        (value: number) => {
            if (value !== 0) {
                observables.onFrameManuallyEntered.notifyObservers(value);
            }
        },
        [observables]
    );

    const handleValueChange = useCallback(
        (value: number) => {
            observables.onValueManuallyEntered.notifyObservers(value);
        },
        [observables]
    );

    return (
        <div className={styles.root}>
            <span className={styles.title}>{state.title}</span>

            <Divider vertical className={styles.divider} />

            {/* Frame Input */}
            <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>Frame:</span>
                <SpinButton className={styles.spinButton} value={keyFrameValue ?? 0} onChange={handleFrameChange} disabled={!hasActiveAnimations || !frameControlEnabled} />
            </div>

            {/* Value Input */}
            <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>Value:</span>
                <SpinButton className={styles.spinButton} value={keyValue ?? 0} onChange={handleValueChange} disabled={!hasActiveAnimations || !valueControlEnabled} step={0.1} />
            </div>

            <Divider vertical className={styles.divider} />

            {/* Key Actions */}
            <div className={styles.buttonGroup}>
                <Button
                    icon={AddRegular}
                    appearance="subtle"
                    disabled={!hasActiveAnimations}
                    onClick={() => observables.onCreateOrUpdateKeyPointRequired.notifyObservers()}
                    title="New key"
                />
                <Button
                    icon={DeleteRegular}
                    appearance="subtle"
                    disabled={!hasActiveKeyPoints}
                    onClick={() => observables.onDeleteKeyActiveKeyPoints.notifyObservers()}
                    title="Delete key"
                />
                <Button icon={FullScreenMaximizeRegular} appearance="subtle" onClick={() => observables.onFrameRequired.notifyObservers()} title="Frame canvas" />
            </div>

            <Divider vertical className={styles.divider} />

            {/* Tangent Actions */}
            <div className={styles.buttonGroup}>
                <Button
                    icon={ArrowMinimizeRegular}
                    appearance="subtle"
                    disabled={!hasActiveKeyPoints}
                    onClick={() => observables.onFlattenTangentRequired.notifyObservers()}
                    title="Flatten tangent"
                />
                <Button
                    icon={LineHorizontal1Regular}
                    appearance="subtle"
                    disabled={!hasActiveKeyPoints}
                    onClick={() => observables.onLinearTangentRequired.notifyObservers()}
                    title="Linear tangent"
                />
                <Button
                    icon={ChevronDoubleLeftRegular}
                    appearance="subtle"
                    disabled={!hasActiveKeyPoints}
                    onClick={() => observables.onBreakTangentRequired.notifyObservers()}
                    title="Break tangent"
                />
                <Button
                    icon={ChevronDoubleRightRegular}
                    appearance="subtle"
                    disabled={!hasActiveKeyPoints}
                    onClick={() => observables.onUnifyTangentRequired.notifyObservers()}
                    title="Unify tangent"
                />
            </div>
        </div>
    );
};
