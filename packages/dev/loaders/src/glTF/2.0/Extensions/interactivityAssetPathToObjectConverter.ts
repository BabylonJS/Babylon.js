import { type IObjectInfo, type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { type IGLTF } from "../glTFLoaderInterfaces";

/**
 * Path prefix of the KHR_interactivity asset-capability pointers (spec §4.1 Asset Capabilities).
 */
export const InteractivityAssetCapabilitiesPrefix = "/extensions/KHR_interactivity/asset/";

/**
 * Path prefix of the KHR_interactivity runtime-limit pointers (spec §4.2 Implementation-Specific Runtime Limits).
 */
export const InteractivityLimitsPrefix = "/extensions/KHR_interactivity/limits/";

/**
 * Highest glTF version this loader can present an asset with.
 */
const MaxSupportedGltfVersion = { major: 2, minor: 0 };

/**
 * The spec allows an implementation to report the maximum `int` value for a runtime limit it does not enforce or
 * does not want to disclose. Babylon imposes no hard cap on any of these features.
 */
const UndisclosedRuntimeLimit = 2147483647;

const RuntimeLimits: Record<string, number> = {
    maxActiveAnimations: UndisclosedRuntimeLimit,
    maxActiveDelays: UndisclosedRuntimeLimit,
    maxActivePropertyInterpolations: UndisclosedRuntimeLimit,
    maxActiveVariableInterpolations: UndisclosedRuntimeLimit,
};

/**
 * Sentinel target returned by the asset-capability accessors. These pointers are virtual and are not backed by a
 * glTF object, so the accessor uses a non-null sentinel to satisfy callers that expect a truthy target.
 */
const AssetCapabilityTarget = { isKhrInteractivityAssetCapability: true };

/**
 * Resolves the glTF version the asset is presented with: the minimum of the version declared in the glTF JSON and
 * the maximum version this implementation supports.
 * @param version the `asset.version` string from the glTF JSON
 * @returns the effective major and minor version components
 */
function GetEffectiveGltfVersion(version: string | undefined): { major: number; minor: number } {
    const [rawMajor, rawMinor] = (version ?? "").split(".");
    const major = parseInt(rawMajor, 10);
    const minor = parseInt(rawMinor, 10);
    if (isNaN(major)) {
        return MaxSupportedGltfVersion;
    }
    if (major !== MaxSupportedGltfVersion.major) {
        return major < MaxSupportedGltfVersion.major ? { major, minor: isNaN(minor) ? 0 : minor } : MaxSupportedGltfVersion;
    }
    return { major, minor: Math.min(isNaN(minor) ? 0 : minor, MaxSupportedGltfVersion.minor) };
}

/**
 * Path-to-object converter that resolves the virtual KHR_interactivity pointers describing the capabilities of the
 * asset and of the implementation running it:
 *
 *  - `/extensions/KHR_interactivity/asset/majorVersion` and `.../minorVersion` — the glTF version the asset is
 *    presented with.
 *  - `/extensions/KHR_interactivity/asset/extensions/<EXTENSION_NAME>/enabled` — whether the extension is both
 *    listed in `extensionsUsed` and supported by this loader. Reading an extension that is not used or not
 *    supported resolves successfully and yields `false`, so a behavior graph can branch on extension support.
 *  - `/extensions/KHR_interactivity/limits/<LIMIT_NAME>` — the implementation-specific runtime limits.
 *
 * All of these are read-only.
 */
export class InteractivityAssetPathToObjectConverter implements IPathToObjectConverter<IObjectAccessor> {
    /**
     * @param _gltf the loaded glTF, used to read the asset version
     * @param _isExtensionEnabled predicate telling whether a glTF extension is both used by the asset and supported
     * by this loader
     */
    public constructor(
        private _gltf: IGLTF,
        private _isExtensionEnabled: (name: string) => boolean
    ) {}

    /**
     * @param path the JSON Pointer to resolve
     * @returns an object accessor for the addressed capability
     * @throws if the path does not address a known capability, which `pointer/get` surfaces as `isValid = false`
     */
    public convert(path: string): IObjectInfo<IObjectAccessor> {
        const normalized = path.endsWith("/") ? path.slice(0, -1) : path;

        if (normalized.startsWith(InteractivityLimitsPrefix)) {
            const limit = RuntimeLimits[normalized.substring(InteractivityLimitsPrefix.length)];
            if (limit === undefined) {
                throw new Error(`Path ${path} is invalid`);
            }
            return this._createAccessor("number", () => limit);
        }

        const capability = normalized.substring(InteractivityAssetCapabilitiesPrefix.length);
        if (capability === "majorVersion" || capability === "minorVersion") {
            return this._createAccessor("number", () => GetEffectiveGltfVersion(this._gltf.asset?.version)[capability === "majorVersion" ? "major" : "minor"]);
        }

        // `extensions/<EXTENSION_NAME>/enabled`. The extension name itself may not contain a slash.
        const segments = capability.split("/");
        if (segments.length === 3 && segments[0] === "extensions" && segments[2] === "enabled") {
            const extensionName = segments[1];
            return this._createAccessor("boolean", () => this._isExtensionEnabled(extensionName));
        }

        throw new Error(`Path ${path} is invalid`);
    }

    private _createAccessor(type: string, get: () => number | boolean): IObjectInfo<IObjectAccessor> {
        return {
            object: AssetCapabilityTarget,
            info: {
                type,
                isReadOnly: true,
                get,
                getTarget: () => AssetCapabilityTarget,
            },
        };
    }
}
