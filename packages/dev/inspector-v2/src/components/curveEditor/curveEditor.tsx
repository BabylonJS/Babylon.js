import { type FunctionComponent, useMemo } from "react";
import { type Nullable } from "core/types";
import { type Animation } from "core/Animations/animation";
import { type TargetedAnimation, type AnimationGroup } from "core/Animations/animationGroup";
import { type Scene } from "core/scene";
import { type IAnimatable } from "core/Animations/animatable.interface";

import { SideBar } from "./sideBar";
import { NormalizedCurveEditor } from "./normalizedCurveEditor";
import { BabylonCurveEditorProvider } from "./curveEditorContext";
import { CreateBabylonCurveEditorSource } from "./curveEditorSource";

/**
 * Props for the CurveEditor component
 */
export type CurveEditorProps = {
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
};

/**
 * Animation Curve Editor component for editing animation keyframes and curves
 * @param props - The component props
 * @returns The curve editor component
 */
export const CurveEditor: FunctionComponent<CurveEditorProps> = (props) => {
    const { scene, target, animations, rootAnimationGroup, title, useTargetAnimations } = props;

    return (
        <BabylonCurveEditorProvider target={target} animations={animations} useTargetAnimations={useTargetAnimations}>
            <BabylonCurveEditorHost
                scene={scene}
                target={target}
                animations={animations}
                rootAnimationGroup={rootAnimationGroup}
                title={title}
                useTargetAnimations={useTargetAnimations}
            />
        </BabylonCurveEditorProvider>
    );
};

const BabylonCurveEditorHost: FunctionComponent<CurveEditorProps> = (props) => {
    const { scene, target, animations, rootAnimationGroup, title, useTargetAnimations } = props;
    const source = useMemo(
        () =>
            CreateBabylonCurveEditorSource({
                scene,
                target,
                animations,
                rootAnimationGroup,
                useTargetAnimations,
            }),
        [scene, target, animations, rootAnimationGroup, useTargetAnimations]
    );

    return <NormalizedCurveEditor source={source} title={title} sideBar={<SideBar />} />;
};
