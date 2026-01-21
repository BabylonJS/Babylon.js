import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import { makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";
import { ChevronDownRegular, ChevronRightRegular, SettingsRegular, DeleteRegular, CircleSmallFilled } from "@fluentui/react-icons";
import { Animation as AnimationEnum } from "core/Animations/animation";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { useCurveEditor } from "../curveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
    },
    entry: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        cursor: "pointer",
        borderRadius: tokens.borderRadiusMedium,
        color: tokens.colorNeutralForeground1,
        "&:hover": {
            backgroundColor: tokens.colorSubtleBackgroundHover,
        },
    },
    entryActive: {
        backgroundColor: tokens.colorSubtleBackgroundSelected,
        color: tokens.colorNeutralForeground1,
        "&:hover": {
            backgroundColor: tokens.colorSubtleBackgroundSelected,
        },
    },
    chevron: {
        width: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    name: {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: tokens.fontSizeBase200,
        color: "inherit",
    },
    actions: {
        display: "flex",
        flexDirection: "row",
        gap: tokens.spacingHorizontalXXS,
        opacity: 0,
    },
    actionsVisible: {
        opacity: 1,
    },
    subEntry: {
        paddingLeft: tokens.spacingHorizontalL,
    },
    subEntryDisabled: {
        opacity: 0.5,
    },
    colorDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        marginRight: tokens.spacingHorizontalXS,
    },
});

type AnimationEntryProps = {
    /** The animation to display */
    animation: Animation;
};

/**
 * Single animation entry in the list
 * @returns Animation entry component
 */
const AnimationEntry: FunctionComponent<AnimationEntryProps> = ({ animation }) => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isActive = state.activeAnimations.indexOf(animation) !== -1;
    const isExpandable = animation.dataType !== AnimationEnum.ANIMATIONTYPE_FLOAT;

    const handleClick = useCallback(
        (evt: React.MouseEvent) => {
            if (!evt.ctrlKey) {
                actions.setActiveAnimations([animation]);
                actions.resetAllActiveChannels();
            } else {
                const index = state.activeAnimations.indexOf(animation);
                if (index !== -1) {
                    actions.setActiveAnimations((prev) => prev.filter((a) => a !== animation));
                } else {
                    actions.setActiveAnimations((prev) => [...prev, animation]);
                }
            }
            actions.disableChannel(animation);
            observables.onActiveAnimationChanged.notifyObservers({});
        },
        [animation, actions, observables, state.activeAnimations]
    );

    const handleExpandClick = useCallback((evt?: React.MouseEvent) => {
        evt?.stopPropagation();
        setIsExpanded((prev) => !prev);
    }, []);

    const handleGear = useCallback(
        (evt?: React.MouseEvent) => {
            evt?.stopPropagation();
            observables.onEditAnimationRequired.notifyObservers(animation);
        },
        [animation, observables]
    );

    const handleDelete = useCallback(
        (evt?: React.MouseEvent) => {
            evt?.stopPropagation();
            observables.onDeleteAnimation.notifyObservers(animation);
        },
        [animation, observables]
    );

    const getSubEntries = () => {
        switch (animation.dataType) {
            case AnimationEnum.ANIMATIONTYPE_COLOR3:
                return [
                    { name: "Red", color: "#DB3E3E" },
                    { name: "Green", color: "#51E22D" },
                    { name: "Blue", color: "#00A3FF" },
                ];
            case AnimationEnum.ANIMATIONTYPE_COLOR4:
                return [
                    { name: "Red", color: "#DB3E3E" },
                    { name: "Green", color: "#51E22D" },
                    { name: "Blue", color: "#00A3FF" },
                    { name: "Alpha", color: "#FFFFFF" },
                ];
            case AnimationEnum.ANIMATIONTYPE_VECTOR2:
                return [
                    { name: "X", color: "#DB3E3E" },
                    { name: "Y", color: "#51E22D" },
                ];
            case AnimationEnum.ANIMATIONTYPE_VECTOR3:
                return [
                    { name: "X", color: "#DB3E3E" },
                    { name: "Y", color: "#51E22D" },
                    { name: "Z", color: "#00A3FF" },
                ];
            case AnimationEnum.ANIMATIONTYPE_QUATERNION:
                return [
                    { name: "X", color: "#DB3E3E" },
                    { name: "Y", color: "#51E22D" },
                    { name: "Z", color: "#00A3FF" },
                    { name: "W", color: "#8700FF" },
                ];
            default:
                return [];
        }
    };

    return (
        <div className={styles.root}>
            <div
                className={`${styles.entry} ${isActive ? styles.entryActive : ""}`}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={styles.chevron}>
                    {isExpandable ? (
                        <Button icon={isExpanded ? ChevronDownRegular : ChevronRightRegular} appearance="transparent" onClick={handleExpandClick} />
                    ) : (
                        <CircleSmallFilled />
                    )}
                </div>
                <span className={styles.name}>{animation.name}</span>
                <div className={`${styles.actions} ${isHovered ? styles.actionsVisible : ""}`}>
                    <Tooltip content="Edit animation" relationship="label">
                        <Button icon={SettingsRegular} appearance="transparent" onClick={handleGear} />
                    </Tooltip>
                    <Tooltip content="Delete animation" relationship="label">
                        <Button icon={DeleteRegular} appearance="transparent" onClick={handleDelete} />
                    </Tooltip>
                </div>
            </div>
            {isExpanded && getSubEntries().map((sub) => <AnimationSubEntry key={sub.name} animation={animation} subName={sub.name} color={sub.color} />)}
        </div>
    );
};

type AnimationSubEntryProps = {
    /** The animation */
    animation: Animation;
    /** The sub-entry name (X, Y, Z, R, G, B, etc.) */
    subName: string;
    /** The color for this channel */
    color: string;
};

/**
 * Sub-entry for vector/color animations (X, Y, Z, R, G, B, etc.)
 * @returns Animation sub-entry component
 */
const AnimationSubEntry: FunctionComponent<AnimationSubEntryProps> = ({ animation, subName, color }) => {
    const styles = useStyles();
    const { actions, observables } = useCurveEditor();

    const activeChannel = actions.getActiveChannel(animation);
    const isThisChannelActive = activeChannel === color;
    const isEnabled = activeChannel === undefined || isThisChannelActive;

    const handleClick = useCallback(() => {
        if (isThisChannelActive) {
            // Clicking on the already-active channel disables filtering (shows all)
            actions.disableChannel(animation);
        } else {
            // Clicking on a channel enables only that channel
            actions.enableChannel(animation, color);
        }
        observables.onActiveAnimationChanged.notifyObservers({});
    }, [animation, color, isThisChannelActive, actions, observables]);

    return (
        <div className={`${styles.entry} ${styles.subEntry} ${!isEnabled ? styles.subEntryDisabled : ""}`} onClick={handleClick}>
            <div className={styles.colorDot} style={{ backgroundColor: color }} />
            <span className={styles.name}>{subName}</span>
        </div>
    );
};

/**
 * Animation list component showing all animations
 * @returns Animation list component
 */
export const AnimationList: FunctionComponent = () => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();

    const [, forceUpdate] = useState({});

    // Subscribe to observables
    useEffect(() => {
        const onAnimationsLoaded = observables.onAnimationsLoaded.add(() => {
            forceUpdate({});
        });

        return () => {
            observables.onAnimationsLoaded.remove(onAnimationsLoaded);
        };
    }, [observables]);

    // Get animations from target if available (for dynamically added animations), otherwise from state
    const animations = state.target?.animations ?? state.animations;

    return (
        <div className={styles.root}>
            {animations?.map((a: Animation | TargetedAnimation, i: number) => {
                const animation = state.useTargetAnimations ? (a as TargetedAnimation).animation : (a as Animation);
                return <AnimationEntry key={animation.uniqueId ?? i} animation={animation} />;
            })}
        </div>
    );
};
