// 3MF
import { ThreeMfDocumentBuilder, ThreeMfModelBuilder } from "./3mf.builder";
import { ContentTypeFileName, ModelFileName, Object3dDirName, RelationshipDirName, RelationshipFileName, type I3mfDocument } from "./3mf.opc.interfaces";
import type { I3mfModel } from "./3mf.interfaces";
import { ST_Unit } from "./3mf.interfaces";

// XML
import { XmlBuilder } from "../xml/xml.builder";
import { XmlSerializer } from "../xml/xml.serializer";
import { type ByteSink, Utf8XmlWriterToBytes } from "../xml/xml.builder.bytes";

/**
 * Options controlling how meshes are exported into the 3MF model.
 *
 * Notes:
 * - These flags are kept generic here and are expected to be interpreted by the concrete serializer/model builder.
 * - Defaults are set in AbstractThreeMfSerializer.DEFAULT_3MF_EXPORTER_OPTIONS.
 */
export interface IThreeMfSerializerOptions {
    /**
     * define the unit. Default is millimeter
     */
    unit?: ST_Unit;

    /**
     *
     */
    metadata?: Record<string, string>;
}

/**
 * Minimal contract for a 3MF serializer that can stream its output through a sink callback.
 *
 * The sink callback receives:
 * - err: any error produced by the serialization pipeline (if any)
 * - chunk: a chunk of bytes to append to the destination
 * - final: true when this is the last chunk
 *
 * Important:
 * - Implementations should call sink with final=true exactly once, or rely on the underlying zip lib to do so.
 * - Consumers may ignore final if they just buffer everything.
 */
export interface I3mfSerializer<T> {
    serializeAsync(sink: (err: any, chunk: Uint8Array, final: boolean) => void, ...meshes: Array<T>): Promise<void>;
}

/**
 * Base class for 3MF serialization.
 *
 * Responsibilities:
 * - Convert user meshes to a 3MF model (toModel).
 * - Wrap the 3MF document parts into an OPC container (zip) and stream bytes through the sink.
 *
 * Non-responsibilities:
 * - Providing/initializing the zip implementation (ensureZipLibReadyAsync is abstract).
 * - Defining how meshes map to 3MF objects (toModel is abstract).
 */
export abstract class AbstractThreeMfSerializer<T, O extends IThreeMfSerializerOptions> implements I3mfSerializer<T> {
    private _o: O;

    /**
     * @param opts user-provided options overriding defaults.
     */
    public constructor(opts: O) {
        this._o = opts;
    }

    /**
     * Expose the resolved options (defaults + overrides) as readonly.
     */
    public get options(): Readonly<O> {
        return this._o;
    }

    /**
     * Generic 3MF binary serializer.
     * Pipeline overview:
     * 1. ensureZipLibReadyAsync provides a zip implementation (host-dependent).
     * 2. Convert meshes into an I3mfDocument (OPC parts + model).
     * 3. Create a zip target that streams through the provided sink.
     * 4. Serialize XML parts into zip entries.
     * 5. End the zip stream.
     * @param sink a callback receiving byte chunks; enables streaming without buffering the full archive in memory.
     * @param meshes the meshes to serialize.
     * @returns
     */
    public async serializeAsync(sink: (err: any, chunk: Uint8Array, final: boolean) => void, ...meshes: Array<T>): Promise<void> {
        // The zip library (e.g. fflate) may need dynamic import / polyfills depending on host.
        // This is delegated to the concrete serializer implementation.
        const lib = await this.ensureZipLibReadyAsync();

        // If no lib is available, we silently do nothing today.
        // Consider: throwing could be better to fail fast. Kept as-is to preserve current behavior.
        if (!lib) {
            return;
        }

        const zip = lib.Zip;
        const zipDeflate = lib.ZipDeflate;

        // We expect a "fflate-like" API. If it is missing, fail with an explicit error.
        if (!zip || !zipDeflate) {
            throw new Error("fflate Zip / ZipDeflate not available");
        }

        /**
         * Adapt a fflate entry to our ByteSink interface used by Utf8XmlWriterToBytes.
         *
         * fflate entry.push(chunk, final) is the writer endpoint for compressed bytes.
         * @param entry
         * @returns
         */
        const makeByteSinkFromFflateEntry = function (entry: any): ByteSink {
            return { push: (chunk: any, final: any) => entry.push(chunk, final) };
        };

        /**
         * Serialize an in-memory XML object into a compressed zip entry.
         *
         * Notes:
         * - "object" here is expected to be a structure understood by XmlSerializer.
         * - Compression level 6 is a reasonable default for speed/size tradeoff.
         * @param target
         * @param name
         * @param object
         */
        const serializeEntry = function (target: any, name: string, object: any): void {
            const entry = new zipDeflate(name, { level: 6 });
            target.add(entry);

            // Convert XmlSerializer output into UTF-8 bytes and push to the zip entry.
            const sink = makeByteSinkFromFflateEntry(entry);
            const w = new Utf8XmlWriterToBytes(sink);

            // Build XML declaration and serialize.
            const b = new XmlBuilder(w).dec("1.0", "UTF-8");
            const s = new XmlSerializer(b);
            s.serialize(object);

            // Ensure the writer flushes any pending bytes and closes the stream for this entry.
            w.finish();
        };

        // Convert meshes into a 3MF document (content types + relationships + model part).
        const doc = this.toDocument(...meshes);
        if (!doc) {
            // Nothing to write. Current behavior: no zip output.
            return;
        }

        // Create the zip container. It will forward produced bytes to the provided sink.
        const target = new zip(sink);

        // Save the root content types part.
        // In OPC, [Content_Types].xml defines the MIME/content types for the package parts.
        serializeEntry(target, ContentTypeFileName, doc.contentTypes);

        // Save relationships.
        // In OPC, relationships live under _rels and map parts to each other.
        serializeEntry(target, `${RelationshipDirName}${RelationshipFileName}`, doc.relationships);

        // Save the 3D model part.
        // In 3MF, the main model is typically under /3D/3dmodel.model.
        serializeEntry(target, `${Object3dDirName}${ModelFileName}`, doc.model);

        // Finalize the archive stream.
        // This should trigger the zip implementation to call sink(..., final=true) when done.
        target.end();
    }

    /**
     * Build a full 3MF OPC document from meshes.
     *
     * The default behavior uses ThreeMfDocumentBuilder with the model produced by toModel().
     * Override if you need custom parts (textures, thumbnails, print ticket, etc.).
     * @param meshes
     * @returns
     */
    public toDocument(...meshes: Array<T>): I3mfDocument | undefined {
        const b = new ThreeMfModelBuilder().withUnit(this._o?.unit ?? ST_Unit.millimeter);
        if (this.options.metadata) {
            for (const m in this.options.metadata) {
                b.withMetaData(m, this.options.metadata[m]);
            }
        }
        return new ThreeMfDocumentBuilder().withModel(this.toModel(b, ...meshes)).build();
    }

    /**
     * Convert input meshes into a 3MF model.
     *
     * Implementations typically:
     * - Create resources and objects.
     * - Define build items (instances) when exportInstances is enabled.
     * - Encode geometry and properties required by your pipeline.
     */
    public abstract toModel(builder: ThreeMfModelBuilder, ...meshes: Array<T>): I3mfModel;

    /**
     * Provide a zip implementation for the current host/runtime.
     *
     * This might be provided by the framework implementation, but it could differ depending on the host
     * (native, Node.js, browser, etc.).
     *
     * Expected shape (fflate-like):
     * - return [ Zip, ZipDeflate ] at minimum.
     *
     * Notes:
     * - In a browser, this might require bundler configuration or dynamic import.
     * - In Node.js, this might be a direct import of "fflate" or another compatible implementation.
     */
    public abstract ensureZipLibReadyAsync(): Promise<any>;
}

/**
 * Convenience helpers around serializers.
 */
export class ThreeMf {
    /**
     * Serialize to a single in-memory buffer.
     *
     * This is a helper that buffers all chunks produced by serializeAsync, then concatenates them.
     * Use serializeAsync directly if you want true streaming to a file/response.
     * @param s
     * @param meshes
     * @returns
     */
    public static async SerializeToMemoryAsync<A>(s: I3mfSerializer<A>, ...meshes: Array<A>): Promise<Uint8Array | undefined> {
        const chunks = new Array<Uint8Array>();
        let size = 0;

        // Sink used by the zip stream. We ignore `final` because we buffer everything anyway.
        // If `err` is used by the underlying zip lib, callers may want to detect/throw here.
        const sink = function (err: any, chunk: Uint8Array, _final: boolean) {
            // Current behavior: ignore err and keep accumulating.
            // Consider: if err is non-null, you might want to throw or record it.
            chunks.push(chunk);
            size += chunk.length;
        };

        await s.serializeAsync(sink, ...meshes);

        // If nothing was written, return undefined (matches current behavior).
        if (!size) {
            return undefined;
        }

        // Concatenate chunks into a single Uint8Array.
        const buffer = new Uint8Array(size);
        let off = 0;
        for (const c of chunks) {
            buffer.set(c, off);
            off += c.length;
        }
        return buffer;
    }
}
