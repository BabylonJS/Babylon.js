/** @internal */
// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
export var __IGLTFExporterExtension = 0; // I am here to allow dts to be created

/**
 * Interface for extending the exporter
 * @internal
 */
export interface IGLTFExporterExtension {
    /**
     * The name of this extension
     */
    readonly name: string;
    /**
     * Defines whether this extension is enabled
     */
    enabled: boolean;

    /**
     * Defines whether this extension is required
     */
    required: boolean;
}
