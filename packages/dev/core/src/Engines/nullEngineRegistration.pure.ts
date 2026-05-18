import { RegisterCoreEngineExtensions, RegisterStandardEngineExtensions, RegisterFullEngineExtensions } from "./engineRegistration.pure";

/**
 * Registers the minimum set of engine extensions required for basic rendering with NullEngine.
 * NullEngine extends Engine, so this delegates to {@link RegisterCoreEngineExtensions}.
 */
export function RegisterCoreNullEngineExtensions(): void {
    RegisterCoreEngineExtensions();
}

/**
 * Registers the standard set of engine extensions needed by most NullEngine scenes.
 * Delegates to {@link RegisterStandardEngineExtensions}.
 */
export function RegisterStandardNullEngineExtensions(): void {
    RegisterStandardEngineExtensions();
}

/**
 * Registers all available engine extensions for the NullEngine.
 * Delegates to {@link RegisterFullEngineExtensions}.
 */
export function RegisterFullNullEngineExtensions(): void {
    RegisterFullEngineExtensions();
}
