export interface IEnvironmentMapConfiguration {
    /**
     * Environment map texture path in relative to the asset folder.
     */
    texture: string;

    /**
     * Default rotation to apply to the environment map.
     */
    rotationY: number;

    /**
     * Tint level of the main color on the environment map.
     */
    tintLevel: number;

    /**
     * The environment's main color.
     */
    mainColor?: { r?: number, g?: number, b?: number };
}