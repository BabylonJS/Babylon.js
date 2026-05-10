/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorSceneComponent.pure for tree-shakeable, side-effect-free usage.
 * Note: RegisterShadowGeneratorSceneComponent is called from ShadowGenerator's constructor,
 * passing the ShadowGenerator class to avoid a circular dependency.
 */
export * from "./shadowGeneratorSceneComponent.pure";
