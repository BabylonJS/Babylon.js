import { type IObjectInfo, type IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import { type FlowGraphBlock } from "./flowGraphBlock";
import { type FlowGraphContext } from "./flowGraphContext";
import { type FlowGraphDataConnection } from "./flowGraphDataConnection";
import { FlowGraphInteger } from "./CustomTypes/flowGraphInteger";
import { RichTypeAny } from "./flowGraphRichTypes";
import { type IObjectAccessor } from "./typeDefinitions";

// KHR_interactivity JSON Pointer templates may use either bracket style:
//   {name}  → originally an integer template, repurposed by the "opaque reference" spec
//             update for refs. Real-world assets mix both conventions, so the bracket
//             style by itself is not enough to determine the input's type.
//   [name]  → integer template (post-ref-update spec).
// We therefore accept both and decide how to substitute at resolution time based on the
// runtime value supplied to the input socket (FlowGraphInteger / number → int substitution,
// string → ref substitution by extracting the matching JSON-Pointer segment).
const RefTemplateRegex = new RegExp(/\/\{(\w+)\}(?=\/|$)/g);
const IntTemplateRegex = new RegExp(/\/\[(\w+)\](?=\/|$)/g);

interface IPathTemplateInfo {
    /** Template variable name (without surrounding brackets). */
    name: string;
    /** Bracket style used in the source path; preserved so we replace the right placeholder. */
    style: "curly" | "square";
    /** The connection that supplies the runtime value for substitution. */
    connection: FlowGraphDataConnection<any>;
}

/**
 * @experimental
 * A component that converts a path to an object accessor.
 */
export class FlowGraphPathConverterComponent {
    /**
     * The templated inputs for the provided path. Values may be FlowGraphInteger, number, or
     * string (an opaque reference encoded as a JSON Pointer).
     */
    public readonly templatedInputs: FlowGraphDataConnection<any>[] = [];

    /** Per-template metadata (name + bracket style + input connection). */
    public readonly templateInfos: IPathTemplateInfo[] = [];

    public constructor(
        public path: string,
        public ownerBlock: FlowGraphBlock
    ) {
        const templateSet = new Set<string>();

        const collect = (regex: RegExp, style: "curly" | "square") => {
            let match = regex.exec(path);
            while (match) {
                const [, name] = match;
                if (templateSet.has(name)) {
                    throw new Error("Duplicate template variable detected.");
                }
                templateSet.add(name);
                // Use RichTypeAny so the same socket can receive either an integer (legacy /
                // [name] style) or a string ref (post-ref-update {name} style); the value's
                // runtime type drives the substitution behaviour in getAccessor.
                const conn = ownerBlock.registerDataInput(name, RichTypeAny, undefined);
                this.templatedInputs.push(conn);
                this.templateInfos.push({ name, style, connection: conn });
                match = regex.exec(path);
            }
        };

        collect(RefTemplateRegex, "curly");
        collect(IntTemplateRegex, "square");
    }

    /**
     * Get the accessor for the path.
     * @param pathConverter the path converter to use to convert the path to an object accessor.
     * @param context the context to use.
     * @returns the accessor for the path.
     * @throws if the value for a templated input is invalid.
     */
    public getAccessor(pathConverter: IPathToObjectConverter<IObjectAccessor>, context: FlowGraphContext): IObjectInfo<IObjectAccessor> {
        let finalPath = this.path;
        for (const info of this.templateInfos) {
            const raw = info.connection.getValue(context);
            const placeholder = info.style === "curly" ? `{${info.name}}` : `[${info.name}]`;
            const substitution = ResolveTemplateSubstitution(this.path, info.name, raw);
            finalPath = finalPath.replace(placeholder, substitution);
        }
        return pathConverter.convert(finalPath);
    }
}

/**
 * Decide what string to splice into a templated path for a given runtime value.
 *
 * - FlowGraphInteger / number → use the integer's decimal representation.
 * - string → treat as a JSON Pointer to a glTF object and pull the segment whose position
 *   in the ref matches the position of `{name}` (or `[name]`) in the surrounding template.
 *   Falls back to the last non-empty segment, then to the raw ref string.
 * @param template the original templated path (used to locate the placeholder position)
 * @param name the name of the template parameter being resolved
 * @param raw the runtime value supplied for the template parameter
 * @returns the substring to splice into the templated path in place of the placeholder
 */
function ResolveTemplateSubstitution(template: string, name: string, raw: any): string {
    if (raw instanceof FlowGraphInteger) {
        AssertNonNegativeInt(raw.value, name);
        return raw.value.toString();
    }
    if (typeof raw === "number") {
        AssertNonNegativeInt(raw, name);
        return raw.toString();
    }
    if (typeof raw === "string") {
        if (raw === "") {
            throw new Error(`Templated reference input "${name}" is null.`);
        }
        return ExtractRefSubstitution(template, name, raw);
    }
    // Babylon object refs (e.g. a Mesh delivered by `event/onSelect.selectedNode`):
    // the glTF loader stamps `_internalMetadata.gltf.pointers` with one entry
    // per JSON-Pointer the object can be addressed by, e.g. a single-primitive
    // Mesh holds both `/nodes/<i>` and `/meshes/<j>/primitives/<k>`. We pick
    // the pointer whose root segment matches the segment in the template that
    // immediately precedes the placeholder, so a template like
    // `/nodes/{nodeRef}/globalMatrix` resolves against the `/nodes/<i>` ref
    // even if `/meshes/<j>/primitives/<k>` was added to the object first.
    if (raw && typeof raw === "object") {
        const pointer = ExtractGltfPointerFromObject(raw, template, name);
        if (pointer) {
            return ExtractRefSubstitution(template, name, pointer);
        }
    }
    throw new Error(`Invalid value for templated input "${name}": got ${typeof raw}.`);
}

function ExtractGltfPointerFromObject(obj: any, template: string, name: string): string | undefined {
    const pointers = obj?._internalMetadata?.gltf?.pointers;
    if (!Array.isArray(pointers) || pointers.length === 0) {
        return undefined;
    }
    const stringPointers = pointers.filter((p: unknown): p is string => typeof p === "string");
    if (stringPointers.length === 0) {
        return undefined;
    }
    // Find the segment in the template that precedes the placeholder, e.g.
    // "nodes" for "/nodes/{nodeRef}/globalMatrix".
    const placeholders = [`{${name}}`, `[${name}]`];
    const templateSegments = template.split("/");
    const placeholderIndex = templateSegments.findIndex((s) => placeholders.indexOf(s) >= 0);
    const expectedRoot = placeholderIndex > 0 ? templateSegments[placeholderIndex - 1] : undefined;
    if (expectedRoot) {
        const match = stringPointers.find((p) => p.split("/")[1] === expectedRoot);
        if (match) {
            return match;
        }
    }
    return stringPointers[0];
}

function AssertNonNegativeInt(value: number, name: string): void {
    if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
        throw new Error(`Invalid value for templated input "${name}": ${value}.`);
    }
}

function ExtractRefSubstitution(template: string, name: string, refValue: string): string {
    const templateSegments = template.split("/");
    const placeholders = [`{${name}}`, `[${name}]`];
    const placeholderIndex = templateSegments.findIndex((s) => placeholders.indexOf(s) >= 0);
    const refSegments = refValue.split("/");
    if (placeholderIndex >= 0 && placeholderIndex < refSegments.length && refSegments[placeholderIndex] !== "") {
        return refSegments[placeholderIndex];
    }
    for (let i = refSegments.length - 1; i >= 0; i--) {
        if (refSegments[i] !== "") {
            return refSegments[i];
        }
    }
    return refValue;
}
