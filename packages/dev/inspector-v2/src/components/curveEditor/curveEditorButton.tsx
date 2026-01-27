import type { FunctionComponent } from "react";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation, AnimationGroup } from "core/Animations/animationGroup";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";

import { useRef } from "react";
import { EditRegular } from "@fluentui/react-icons";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ChildWindow } from "shared-ui-components/fluent/hoc/childWindow";
import { CurveEditor } from "./curveEditor";

/**
 * Props for the CurveEditorButton component
 */
export type CurveEditorButtonProps = {
    /** The scene */
    scene: Scene;
    /** Target animatable */
    target: Nullable<IAnimatable>;
    /** Animations to edit */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** Root animation group if any */
    rootAnimationGroup?: Nullable<AnimationGroup>;
    /** Editor title */
    title?: string;
    /** Whether using targeted animations */
    useTargetAnimations?: boolean;
    /** Button label */
    label?: string;
};

/**
 * Button component that opens the Animation Curve Editor in a popup window
 * @param props - The component props
 * @returns The button component
 */
export const CurveEditorButton: FunctionComponent<CurveEditorButtonProps> = (props) => {
    const { scene, target, animations, rootAnimationGroup, title, useTargetAnimations, label = "Edit Curves" } = props;

    const childWindow = useRef<ChildWindow>(null);

    return (
        <>
            <ButtonLine
                label={label}
                onClick={() =>
                    childWindow.current?.open({
                        defaultWidth: 1024,
                        defaultHeight: 512,
                        title: title ?? "Animation Curve Editor",
                    })
                }
                icon={EditRegular}
            />
            <ChildWindow id="Animation Curve Editor" imperativeRef={childWindow}>
                <CurveEditor
                    scene={scene}
                    target={target}
                    animations={animations}
                    rootAnimationGroup={rootAnimationGroup}
                    title={title}
                    useTargetAnimations={useTargetAnimations}
                />
            </ChildWindow>
        </>
    );
};
