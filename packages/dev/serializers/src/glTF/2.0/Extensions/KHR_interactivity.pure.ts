import { type IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";

const NAME = "KHR_interactivity";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_interactivity)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_interactivity implements IGLTFExporterExtensionV2 {
    /** The extension name. */
    public readonly name = NAME;
    /** Whether this extension is enabled for the current export. */
    public readonly enabled: boolean;
    /** Whether this extension is required for the exported asset. */
    public readonly required: boolean;

    /**
     * @param _exporter owning glTF exporter
     */
    public constructor(private _exporter: GLTFExporter) {
        this.enabled = !!_exporter.options.khrInteractivity;
        this.required = _exporter.options.khrInteractivity?.required ?? false;
    }

    /** @internal */
    public dispose(): void {
        (this._exporter as any) = null;
    }

    /** @internal */
    public get wasUsed(): boolean {
        return this.enabled;
    }

    /** @internal */
    public onExporting(): void {
        const provider = this._exporter.options.khrInteractivity;
        if (!provider) {
            return;
        }
        const extension = provider.build({
            getNodeCount: () => this._exporter._nodes.length,
            getNodeIndex: (node) => this._exporter._getNodeIndex(node),
            getAnimationIndex: (animationGroup) => this._exporter._getAnimationIndex(animationGroup),
            getCameraIndex: (camera) => this._exporter._getCameraIndex(camera),
            getMaterialIndex: (material) => this._exporter._getMaterialIndex(material),
            getRootIndex: (collection, entity) => this._exporter._getRootIndex(collection, entity),
            setNodeExtension: (nodeIndex, extensionName, value) => this._exporter._setNodeExtension(nodeIndex, extensionName, value),
        });
        this._exporter._glTF.extensions![NAME] = extension;
        for (const extensionName of provider.additionalExtensionsUsed) {
            this._exporter._glTF.extensionsUsed ||= [];
            if (this._exporter._glTF.extensionsUsed.indexOf(extensionName) === -1) {
                this._exporter._glTF.extensionsUsed.push(extensionName);
            }
        }
        for (const extensionName of provider.additionalExtensionsRequired) {
            this._exporter._glTF.extensionsUsed ||= [];
            if (this._exporter._glTF.extensionsUsed.indexOf(extensionName) === -1) {
                this._exporter._glTF.extensionsUsed.push(extensionName);
            }
            this._exporter._glTF.extensionsRequired ||= [];
            if (this._exporter._glTF.extensionsRequired.indexOf(extensionName) === -1) {
                this._exporter._glTF.extensionsRequired.push(extensionName);
            }
        }
    }
}

let _Registered = false;

/**
 * Registers the KHR_interactivity glTF serializer extension with the {@link GLTFExporter}.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_interactivity(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;
    GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_interactivity(exporter), 200);
}
