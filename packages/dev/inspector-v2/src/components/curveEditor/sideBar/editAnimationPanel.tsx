import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";

import { makeStyles, tokens, Input, Label, Dropdown, Option } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { useCurveEditor } from "../curveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    title: {
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    row: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    buttons: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalM,
    },
});

const LOOP_MODES = [
    { label: "Cycle", value: 1 },
    { label: "Constant", value: 0 },
    { label: "Relative", value: 2 },
    { label: "Relative from current", value: 4 },
] as const;

type EditAnimationPanelProps = {
    animation: Animation;
    onClose: () => void;
};

/**
 * Panel for editing animation properties
 * @returns The edit animation panel component
 */
export const EditAnimationPanel: FunctionComponent<EditAnimationPanelProps> = ({ animation, onClose }) => {
    const styles = useStyles();
    const { observables } = useCurveEditor();

    const [name, setName] = useState(animation.name);
    const [property, setProperty] = useState(animation.targetProperty);
    const [loopMode, setLoopMode] = useState(animation.loopMode ?? 1);

    // Update state when animation changes
    useEffect(() => {
        setName(animation.name);
        setProperty(animation.targetProperty);
        setLoopMode(animation.loopMode ?? 1);
    }, [animation]);

    const isValid = name.trim().length > 0 && property.trim().length > 0;

    const saveChanges = useCallback(() => {
        if (!isValid) {
            return;
        }

        // Update animation properties
        animation.name = name;
        animation.targetProperty = property;
        animation.loopMode = loopMode;

        // Notify observers
        observables.onAnimationsLoaded.notifyObservers();

        onClose();
    }, [isValid, name, property, loopMode, animation, observables, onClose]);

    const getLoopModeLabel = (value: number): string => {
        const mode = LOOP_MODES.find((m) => m.value === value);
        return mode?.label ?? "Cycle";
    };

    return (
        <div className={styles.root}>
            <div className={styles.form}>
                <div className={styles.row}>
                    <Label>Display Name</Label>
                    <Input value={name} onChange={(_, data) => setName(data.value)} placeholder="Animation name" />
                </div>

                <div className={styles.row}>
                    <Label>Property</Label>
                    <Input value={property} onChange={(_, data) => setProperty(data.value)} placeholder="e.g., position, rotation, scaling" />
                </div>

                <div className={styles.row}>
                    <Label>Loop Mode</Label>
                    <Dropdown
                        value={getLoopModeLabel(loopMode)}
                        selectedOptions={[loopMode.toString()]}
                        onOptionSelect={(_, data) => setLoopMode(Number(data.optionValue))}
                        positioning="below"
                        inlinePopup
                    >
                        {LOOP_MODES.map((mode) => (
                            <Option key={mode.value} value={mode.value.toString()}>
                                {mode.label}
                            </Option>
                        ))}
                    </Dropdown>
                </div>
            </div>

            <div className={styles.buttons}>
                <Button appearance="primary" onClick={saveChanges} label="Save" disabled={!isValid} />
                <Button appearance="subtle" onClick={onClose} label="Cancel" />
            </div>
        </div>
    );
};
