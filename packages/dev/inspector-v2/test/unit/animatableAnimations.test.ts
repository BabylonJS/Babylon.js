import { describe, it, expect } from "vitest";
import { Animation } from "core/Animations/animation";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { GetAnimationsWithChildren, RemoveAnimationFromOwner, type AnimatableWithChildren } from "../../src/components/curveEditor/animatableAnimations";

function MakeAnimation(name: string): Animation {
    return new Animation(name, "position.x", 30, Animation.ANIMATIONTYPE_FLOAT);
}

// A container (like a skeleton) whose child animatables (like bones) own their own animations.
function MakeContainer(own: Animation[] | null, children: Animation[][]): { container: AnimatableWithChildren; childAnimatables: IAnimatable[] } {
    const childAnimatables = children.map((animations) => ({ animations }) as IAnimatable);
    const container: AnimatableWithChildren = { getAnimatables: () => childAnimatables };
    if (own) {
        container.animations = own;
    }
    return { container, childAnimatables };
}

describe("GetAnimationsWithChildren", () => {
    it("returns child-only tracks when the container has no animations array", () => {
        const a = MakeAnimation("a");
        const b = MakeAnimation("b");
        const { container } = MakeContainer(null, [[a], [b]]);
        expect(GetAnimationsWithChildren(container)).toEqual([a, b]);
    });

    it("returns child tracks when the container has its own empty animations array", () => {
        const a = MakeAnimation("a");
        const { container } = MakeContainer([], [[a]]);
        expect(GetAnimationsWithChildren(container)).toEqual([a]);
    });

    it("returns own tracks first, then child tracks", () => {
        const own = MakeAnimation("own");
        const child = MakeAnimation("child");
        const { container } = MakeContainer([own], [[child]]);
        expect(GetAnimationsWithChildren(container)).toEqual([own, child]);
    });
});

describe("RemoveAnimationFromOwner", () => {
    it("removes a child track from the child that owns it, so it stays gone when the list is rebuilt", () => {
        const a = MakeAnimation("a");
        const b = MakeAnimation("b");
        const { container, childAnimatables } = MakeContainer(null, [[a], [b]]);

        expect(RemoveAnimationFromOwner(container, b)).toBe(true);

        expect(childAnimatables[1].animations).toEqual([]);
        // Reopening the editor rebuilds the list from the owners
        expect(GetAnimationsWithChildren(container)).toEqual([a]);
    });

    it("removes own and child tracks from their respective owners in a mixed container", () => {
        const own = MakeAnimation("own");
        const child = MakeAnimation("child");
        const { container, childAnimatables } = MakeContainer([own], [[child]]);

        expect(RemoveAnimationFromOwner(container, child)).toBe(true);
        expect(container.animations).toEqual([own]);
        expect(childAnimatables[0].animations).toEqual([]);

        expect(RemoveAnimationFromOwner(container, own)).toBe(true);
        expect(GetAnimationsWithChildren(container)).toEqual([]);
    });

    it("returns false and changes nothing for an animation no owner holds", () => {
        const own = MakeAnimation("own");
        const { container } = MakeContainer([own], []);
        expect(RemoveAnimationFromOwner(container, MakeAnimation("other"))).toBe(false);
        expect(container.animations).toEqual([own]);
    });
});
