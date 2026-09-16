import { type IValueGradient } from "core/Misc/gradients";
import { type IParticleSystem } from "core/Particles/IParticleSystem";
import { type Nullable } from "core/types";

/**
 * Sorts a particle system's owning gradient array before refreshing its derived state.
 * @param system The particle system to refresh.
 * @param gradients The owning gradient array to sort.
 */
export function SortAndRefreshParticleGradients(system: IParticleSystem, gradients: Nullable<IValueGradient[]>): void {
    gradients?.sort((left, right) => {
        if (left.gradient < right.gradient) {
            return -1;
        }

        if (left.gradient > right.gradient) {
            return 1;
        }

        return 0;
    });
    system.forceRefreshGradients();
}
