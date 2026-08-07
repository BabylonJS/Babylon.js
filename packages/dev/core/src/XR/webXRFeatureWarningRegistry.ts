import { type IWebXRFeature } from "./webXRFeaturesManager";

let _FeaturesWithSpecificDisableWarning: WeakSet<IWebXRFeature> | undefined;

/**
 * Records that a feature used the warning-emitting intentional-disable path.
 * @param feature the feature that reported its intentional disable
 * @internal
 */
export function _MarkWebXRFeatureWithSpecificDisableWarning(feature: IWebXRFeature): void {
    (_FeaturesWithSpecificDisableWarning ??= new WeakSet()).add(feature);
}

/**
 * Clears and returns whether a feature used the warning-emitting intentional-disable path.
 * @param feature the feature to query
 * @returns whether the feature reported its intentional disable since the previous query
 * @internal
 */
export function _ConsumeWebXRFeatureSpecificDisableWarning(feature: IWebXRFeature): boolean {
    return _FeaturesWithSpecificDisableWarning?.delete(feature) ?? false;
}
