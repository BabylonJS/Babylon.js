import { describe, expect, it, vi } from "vitest";

import { FactorGradient, type IValueGradient } from "core/Misc/gradients";
import { type IParticleSystem } from "core/Particles/IParticleSystem";
import { type Nullable } from "core/types";
import { SortAndRefreshParticleGradients } from "../../src/components/properties/particles/particleGradientUtils";

const NullableGradientCases: Array<[Nullable<IValueGradient[]>]> = [[null], [[]]];

describe("SortAndRefreshParticleGradients", () => {
    it("sorts the owning gradient array before refreshing the particle system", () => {
        const gradients = [new FactorGradient(0.8, 8), new FactorGradient(0.2, 2), new FactorGradient(0.5, 5)];
        const refreshOrder: number[][] = [];
        const system = {
            forceRefreshGradients: vi.fn(() => {
                refreshOrder.push(gradients.map((gradient) => gradient.gradient));
            }),
        } as unknown as IParticleSystem;

        SortAndRefreshParticleGradients(system, gradients);

        expect(gradients.map((gradient) => gradient.gradient)).toEqual([0.2, 0.5, 0.8]);
        expect(refreshOrder).toEqual([[0.2, 0.5, 0.8]]);
    });

    it.each(NullableGradientCases)("refreshes the particle system when gradients are %j", (gradients) => {
        const forceRefreshGradients = vi.fn();
        const system = { forceRefreshGradients } as unknown as IParticleSystem;

        SortAndRefreshParticleGradients(system, gradients);

        expect(forceRefreshGradients).toHaveBeenCalledOnce();
    });
});
