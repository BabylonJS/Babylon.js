import { type Nullable } from "../types";
import { type LensFlareSystem } from "./lensFlareSystem";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Removes the given lens flare system from this scene.
         * @param toRemove The lens flare system to remove
         * @returns The index of the removed lens flare system
         */
        removeLensFlareSystem(toRemove: LensFlareSystem): number;

        /**
         * Adds the given lens flare system to this scene
         * @param newLensFlareSystem The lens flare system to add
         */
        addLensFlareSystem(newLensFlareSystem: LensFlareSystem): void;

        /**
         * Gets a lens flare system using its name
         * @param name defines the name to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemByName(name: string): Nullable<LensFlareSystem>;

        /**
         * Gets a lens flare system using its Id
         * @param id defines the Id to look for
         * @returns the lens flare system or null if not found
         * @deprecated Please use getLensFlareSystemById instead
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        getLensFlareSystemByID(id: string): Nullable<LensFlareSystem>;

        /**
         * Gets a lens flare system using its Id
         * @param id defines the Id to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemById(id: string): Nullable<LensFlareSystem>;
    }
}
