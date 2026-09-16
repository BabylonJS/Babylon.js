import { type IObjectInfo, type IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import { type FlowGraphBlock } from "./flowGraphBlock";
import { type FlowGraphContext } from "./flowGraphContext";
import { type FlowGraphDataConnection } from "./flowGraphDataConnection";
import { FlowGraphInteger } from "./CustomTypes/flowGraphInteger.pure";
import { RichTypeAny } from "./flowGraphRichTypes.pure";
import { type IObjectAccessor } from "./typeDefinitions";

// JSON Pointer templates may use either bracket style:
//   {name}  → a reference template parameter.
//   [name]  → an integer template parameter.
// Real-world assets mix both conventions, so the bracket style by itself is not enough to determine
// the input's type. We therefore accept both and decide how to substitute at resolution time based
// on the runtime value supplied to the input socket (FlowGraphInteger / number → int substitution,
// string → reference substitution by extracting the matching JSON-Pointer segment).
// These are constructed per scan rather than shared, because a global regex carries `lastIndex`
// state across calls and a scan that throws part-way would otherwise leave it set for the next one.
const CreateRefTemplateRegex = () => new RegExp(/\/\{(\w+)\}(?=\/|$)/g);
const CreateIntTemplateRegex = () => new RegExp(/\/\[(\w+)\](?=\/|$)/g);

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
                // runtime type drives the substitution behaviour in getAccessor. Default to
                // FlowGraphInteger(0) — not undefined — so an unconnected index input still
                // resolves to index 0 (the natural default) instead of throwing at path resolution.
                const conn = ownerBlock.registerDataInput(name, RichTypeAny, new FlowGraphInteger(0));
                this.templatedInputs.push(conn);
                this.templateInfos.push({ name, style, connection: conn });
                match = regex.exec(path);
            }
        };

        collect(CreateRefTemplateRegex(), "curly");
        collect(CreateIntTemplateRegex(), "square");
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
            const substitution = ResolveTemplateSubstitution(this.path, info.name, raw, context);
            finalPath = finalPath.replace(placeholder, substitution);
        }
        return pathConverter.convert(finalPath);
    }
}

/**
 * Decide what string to splice into a templated path for a given runtime value.
 *
 * - FlowGraphInteger / number → use the integer's decimal representation.
 * - string → treat as a JSON Pointer to an object and pull the segment whose position
 *   in the ref matches the position of `{name}` (or `[name]`) in the surrounding template.
 *   Falls back to the last non-empty segment, then to the raw ref string.
 * - object → ask the host environment for the reference addressing it, then substitute as above.
 * @param template the original templated path (used to locate the placeholder position)
 * @param name the name of the template parameter being resolved
 * @param raw the runtime value supplied for the template parameter
 * @param context the context used to reach the host resolver for object values
 * @returns the substring to splice into the templated path in place of the placeholder
 */
function ResolveTemplateSubstitution(template: string, name: string, raw: any, context: FlowGraphContext): string {
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
    // A runtime object (e.g. a Mesh delivered by a selection event). Mapping it back to a
    // reference is knowledge the host environment owns, so it is delegated to the host resolver.
    // The segment preceding the placeholder (e.g. "nodes" in `/nodes/{nodeRef}/globalMatrix`) is
    // passed as a hint, because an object may be addressable in more than one way.
    if (raw && typeof raw === "object") {
        const pointer = context.getObjectReference(raw as object, GetPlaceholderParentSegment(template, name));
        if (pointer) {
            return ExtractRefSubstitution(template, name, pointer);
        }
    }
    throw new Error(`Invalid value for templated input "${name}": got ${typeof raw}.`);
}

function GetPlaceholderIndex(template: string, name: string): number {
    const placeholders = [`{${name}}`, `[${name}]`];
    return template.split("/").findIndex((segment) => placeholders.indexOf(segment) >= 0);
}

function GetPlaceholderParentSegment(template: string, name: string): string | undefined {
    const placeholderIndex = GetPlaceholderIndex(template, name);
    return placeholderIndex > 0 ? template.split("/")[placeholderIndex - 1] : undefined;
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
