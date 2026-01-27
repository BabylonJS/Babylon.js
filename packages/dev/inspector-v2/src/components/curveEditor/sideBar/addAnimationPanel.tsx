import type { FunctionComponent } from "react";
import type { IAnimationKey } from "core/Animations/animationKey";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import { makeStyles, tokens, Input, Label, Dropdown, Option } from "@fluentui/react-components";
import { useCallback, useState, useMemo, useEffect } from "react";
import { Animation } from "core/Animations/animation";
import { Quaternion, Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";

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
    typeDisplay: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
        fontSize: tokens.fontSizeBase300,
    },
});

const ANIMATION_TYPES = ["Float", "Vector2", "Vector3", "Quaternion", "Color3", "Color4"] as const;
const LOOP_MODES = ["Cycle", "Relative", "Relative from current", "Constant"] as const;
const MODES = ["List", "Custom"] as const;

type AddAnimationPanelProps = {
    onClose: () => void;
};

/**
 * Panel for adding new animations
 * @returns The add animation panel component
 */
export const AddAnimationPanel: FunctionComponent<AddAnimationPanelProps> = ({ onClose }) => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();

    const [name, setName] = useState("");
    const [mode, setMode] = useState<(typeof MODES)[number]>("List");
    const [customProperty, setCustomProperty] = useState("");
    const [selectedProperty, setSelectedProperty] = useState("");
    const [animationType, setAnimationType] = useState<(typeof ANIMATION_TYPES)[number]>("Float");
    const [loopMode, setLoopMode] = useState<(typeof LOOP_MODES)[number]>("Cycle");

    // Get animatable properties from target
    const properties = useMemo(() => {
        const result: string[] = [];

        if (!state.target) {
            return result;
        }

        let target = state.target as object | null;
        const source = state.target as unknown as Record<string, unknown>;

        while (target !== null) {
            const descriptors = Object.getOwnPropertyDescriptors(target);
            for (const property in descriptors) {
                const descriptor = descriptors[property];
                // Skip private properties and null/undefined values
                if (property[0] === "_" || source[property] === null || source[property] === undefined) {
                    continue;
                }

                const value = source[property] as Record<string, unknown>;

                // Skip non-animatable values (must be number, vector, quaternion, or color)
                if (value.r === undefined && value.x === undefined && isNaN(parseFloat(value as unknown as string))) {
                    continue;
                }

                // Skip duplicates
                if (result.indexOf(property) !== -1) {
                    continue;
                }

                // Skip read-only properties
                if (!descriptor.writable && !descriptor.set) {
                    continue;
                }

                result.push(property);
            }

            target = Object.getPrototypeOf(target);
        }

        result.sort();

        // Move common properties to the top
        const main = ["scaling", "rotation", "position"];
        for (const mainProperty of main) {
            const index = result.indexOf(mainProperty);
            if (index !== -1) {
                result.splice(index, 1);
                result.unshift(mainProperty);
            }
        }

        return result;
    }, [state.target]);

    // Set initial selected property when properties change
    useEffect(() => {
        if (properties.length > 0 && !selectedProperty) {
            setSelectedProperty(properties[0]);
        }
    }, [properties, selectedProperty]);

    // Infer type from selected property value
    const inferredType = useMemo((): (typeof ANIMATION_TYPES)[number] => {
        if (mode === "Custom" || !state.target || !selectedProperty) {
            return animationType;
        }

        const source = state.target as unknown as Record<string, unknown>;
        const value = source[selectedProperty];

        if (value === null || value === undefined) {
            return "Float";
        }

        if (!isNaN(parseFloat(value as string))) {
            return "Float";
        }

        const valueObj = value as { getClassName?: () => string };
        if (valueObj.getClassName) {
            const className = valueObj.getClassName();
            if (ANIMATION_TYPES.includes(className as (typeof ANIMATION_TYPES)[number])) {
                return className as (typeof ANIMATION_TYPES)[number];
            }
        }

        return "Float";
    }, [mode, state.target, selectedProperty, animationType]);

    const isCustomMode = mode === "Custom" || properties.length === 0;
    const currentProperty = isCustomMode ? customProperty : selectedProperty;
    const currentType = isCustomMode ? animationType : inferredType;

    // Get FPS from existing animations or default to 60
    const fps = useMemo(() => {
        if (state.animations && state.animations.length) {
            const anim = state.useTargetAnimations ? (state.animations[0] as TargetedAnimation).animation : (state.animations[0] as Animation);
            return anim.framePerSecond;
        }
        return 60;
    }, [state.animations, state.useTargetAnimations]);

    // Get min/max frame from existing animations
    const { minFrame, maxFrame } = useMemo(() => {
        let min = 0;
        let max = 100;

        if (state.animations) {
            for (const anim of state.animations) {
                const innerAnim = state.useTargetAnimations ? (anim as TargetedAnimation).animation : (anim as Animation);
                const keys = innerAnim.getKeys();
                if (keys.length) {
                    min = Math.min(min, keys[0].frame);
                    max = Math.max(max, keys[keys.length - 1].frame);
                }
            }
        }

        return { minFrame: min, maxFrame: max };
    }, [state.animations, state.useTargetAnimations]);

    // Validation for the create button
    const isValid = name.trim() !== "" && currentProperty.trim() !== "";

    const createAnimation = useCallback(() => {
        if (!name || !currentProperty) {
            return;
        }

        let dataType = 0;
        let loopModeValue = 0;
        let defaultValue0: unknown;
        let defaultValue1: unknown;
        let defaultTangent0: unknown;
        let defaultTangent1: unknown;

        // Set data type and default values
        switch (currentType) {
            case "Float":
                dataType = Animation.ANIMATIONTYPE_FLOAT;
                defaultValue0 = 0;
                defaultValue1 = 1;
                defaultTangent0 = 0;
                defaultTangent1 = 0;
                break;
            case "Vector2":
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
                defaultValue0 = Vector2.Zero();
                defaultValue1 = new Vector2(1, 1);
                defaultTangent0 = new Vector2(0, 0);
                defaultTangent1 = new Vector2(0, 0);
                break;
            case "Vector3":
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
                defaultValue0 = Vector3.Zero();
                defaultValue1 = new Vector3(1, 1, 1);
                defaultTangent0 = new Vector3(0, 0, 0);
                defaultTangent1 = new Vector3(0, 0, 0);
                break;
            case "Quaternion":
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
                defaultValue0 = Quaternion.Zero();
                defaultValue1 = new Quaternion(1, 1, 1, 0);
                defaultTangent0 = new Quaternion(0, 0, 0, 0);
                defaultTangent1 = new Quaternion(0, 0, 0, 0);
                break;
            case "Color3":
                dataType = Animation.ANIMATIONTYPE_COLOR3;
                defaultValue0 = Color3.Black();
                defaultValue1 = Color3.White();
                defaultTangent0 = new Color3(0, 0, 0);
                defaultTangent1 = new Color3(0, 0, 0);
                break;
            case "Color4":
                dataType = Animation.ANIMATIONTYPE_COLOR4;
                defaultValue0 = new Color4(0, 0, 0, 0);
                defaultValue1 = new Color4(1, 1, 1, 1);
                defaultTangent0 = new Color4(0, 0, 0, 0);
                defaultTangent1 = new Color4(0, 0, 0, 0);
                break;
        }

        // Set loop mode
        switch (loopMode) {
            case "Cycle":
                loopModeValue = Animation.ANIMATIONLOOPMODE_CYCLE;
                break;
            case "Relative":
                loopModeValue = Animation.ANIMATIONLOOPMODE_RELATIVE;
                break;
            case "Relative from current":
                loopModeValue = Animation.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT;
                break;
            case "Constant":
                loopModeValue = Animation.ANIMATIONLOOPMODE_CONSTANT;
                break;
        }

        // Create the animation
        const animation = new Animation(name, currentProperty, fps, dataType, loopModeValue);

        const keys: IAnimationKey[] = [
            {
                frame: minFrame,
                value: defaultValue0,
                inTangent: defaultTangent0,
                outTangent: defaultTangent0,
            },
            {
                frame: maxFrame,
                value: defaultValue1,
                inTangent: defaultTangent1,
                outTangent: defaultTangent1,
            },
        ];

        animation.setKeys(keys);

        // Add to target animations
        if (state.target) {
            if (!state.target.animations || state.target.animations.length === 0) {
                state.target.animations = [animation];
            } else {
                state.target.animations = [...state.target.animations, animation];
            }
        }

        // Close first so AnimationList mounts, then notify
        onClose();
        observables.onAnimationsLoaded.notifyObservers();
    }, [name, currentProperty, currentType, loopMode, fps, minFrame, maxFrame, state, observables, onClose]);

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <span className={styles.title}>Add Animation</span>
            </div>

            <div className={styles.form}>
                <div className={styles.row}>
                    <Label>Display Name</Label>
                    <Input value={name} onChange={(_, data) => setName(data.value)} placeholder="Animation name" />
                </div>

                <div className={styles.row}>
                    <Label>Mode</Label>
                    <Dropdown
                        value={mode}
                        selectedOptions={[mode]}
                        onOptionSelect={(_, data) => setMode(data.optionValue as (typeof MODES)[number])}
                        disabled={properties.length === 0}
                    >
                        {MODES.map((m) => (
                            <Option key={m} value={m}>
                                {m}
                            </Option>
                        ))}
                    </Dropdown>
                </div>

                <div className={styles.row}>
                    <Label>Property</Label>
                    {isCustomMode ? (
                        <Input value={customProperty} onChange={(_, data) => setCustomProperty(data.value)} placeholder="e.g., position, rotation, scaling" />
                    ) : (
                        <Dropdown value={selectedProperty} selectedOptions={[selectedProperty]} onOptionSelect={(_, data) => setSelectedProperty(data.optionValue as string)}>
                            {properties.map((prop) => (
                                <Option key={prop} value={prop}>
                                    {prop}
                                </Option>
                            ))}
                        </Dropdown>
                    )}
                </div>

                <div className={styles.row}>
                    <Label>Type</Label>
                    {isCustomMode ? (
                        <Dropdown
                            value={animationType}
                            selectedOptions={[animationType]}
                            onOptionSelect={(_, data) => setAnimationType(data.optionValue as (typeof ANIMATION_TYPES)[number])}
                        >
                            {ANIMATION_TYPES.map((type) => (
                                <Option key={type} value={type}>
                                    {type}
                                </Option>
                            ))}
                        </Dropdown>
                    ) : (
                        <div className={styles.typeDisplay}>{inferredType}</div>
                    )}
                </div>

                <div className={styles.row}>
                    <Label>Loop Mode</Label>
                    <Dropdown value={loopMode} selectedOptions={[loopMode]} onOptionSelect={(_, data) => setLoopMode(data.optionValue as (typeof LOOP_MODES)[number])}>
                        {LOOP_MODES.map((lm) => (
                            <Option key={lm} value={lm}>
                                {lm}
                            </Option>
                        ))}
                    </Dropdown>
                </div>
            </div>

            <div className={styles.buttons}>
                <Button appearance="primary" onClick={createAnimation} disabled={!isValid} label="Create" />
                <Button appearance="subtle" onClick={onClose} label="Cancel" />
            </div>
        </div>
    );
};
