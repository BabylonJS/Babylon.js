/// <reference path="../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>

module BABYLON {
    /**
     * Interface for extending the exporter
     * @hidden
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
}