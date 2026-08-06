import { type IXmlSerializerFormatOptions } from "./xml.serializer.format";

/** Describes an XML qualified name with an optional namespace. */
export interface IQualifiedName {
    /** The namespace URI or prefix. */
    ns?: string;
    /** The local XML name. */
    name: string;
}

/** Provides a fluent interface for writing XML content. */
export interface IXmlBuilder {
    /**
     * Writes the XML declaration.
     * @param version defines the XML version
     * @param encoding defines the optional XML encoding
     * @param standalone defines the optional standalone flag
     * @returns the XML builder
     */
    dec(version: string, encoding?: string, standalone?: boolean): IXmlBuilder;
    /**
     * Writes an XML attribute.
     * @param ns defines the attribute namespace
     * @param n defines the attribute name
     * @param v defines the attribute value
     * @returns the XML builder
     */
    att(ns: string | null, n: string, v: string): IXmlBuilder;
    /**
     * Writes an XML element.
     * @param ns defines the element namespace
     * @param n defines the element name
     * @returns the XML builder
     */
    ele(ns: string | null, n: string): IXmlBuilder;
    /**
     * Writes text content.
     * @param txt defines the text to write
     * @returns the XML builder
     */
    text(txt: string): IXmlBuilder;
    /**
     * Ends the current XML element.
     * @returns the XML builder
     */
    end(): IXmlBuilder;
}

/**
 * @param x
 * @returns
 */
export function IsQualifiedName(x: unknown): x is { name: string } {
    return typeof (x as any)?.name === "string";
}

export type XmlName = string | IQualifiedName;

type FieldKind = "attr" | "elem" | "none";

/** Formats values for XML serialization. */
export interface IFormatter<T = any> {
    /**
     * Converts a value to its XML string representation.
     * @param value defines the value to format
     * @returns the XML string representation
     */
    toString(value: T): string;
}

export type FormatterCtor<T> = new (args: IXmlSerializerFormatOptions) => IFormatter<T>;

type FieldMeta = {
    kind: FieldKind;
    prop: string;
    name?: XmlName;
    ignore?: boolean;
    formatter?: FormatterCtor<any>;
};

const XML_CLASS_META = Symbol("__xml:meta$__");
const XML_CLASS_NAME = Symbol("__xml:name$__");

function AddXmlMeta(context: { metadata: DecoratorMetadataObject }, meta: FieldMeta) {
    if (!Object.prototype.hasOwnProperty.call(context.metadata, XML_CLASS_META)) {
        context.metadata[XML_CLASS_META] = [];
    }
    (context.metadata[XML_CLASS_META] as FieldMeta[]).push(meta);
}

/**
 * @param name
 * @returns
 */
export function XmlName(name: XmlName) {
    return (ctor: Function, _context: ClassDecoratorContext) => {
        (ctor as any)[XML_CLASS_NAME] = name;
    };
}

/**
 * tell the serializer to ignore the property
 * @returns
 */
export function XmlIgnore() {
    return (_value: unknown, context: { name: string | symbol; metadata: DecoratorMetadataObject }) =>
        AddXmlMeta(context, { kind: "none", prop: String(context.name), ignore: true });
}

/**
 * tell the serializer to serialize the property as attribute
 * @returns
 */
export function XmlAttr(opts?: { name: XmlName; formatter?: FormatterCtor<any> }) {
    return (_value: unknown, context: { name: string | symbol; metadata: DecoratorMetadataObject }) => AddXmlMeta(context, { kind: "attr", prop: String(context.name), ...opts });
}

/**
 * tell the serializer to serialize the property as element - this is the default behavior but shoud be
 * specified when wanted to update the default name of the classe or if the class is not decorated (without \@XmlName)
 * @returns
 */
export function XmlElem(opts?: { name: XmlName }) {
    return (_value: unknown, context: { name: string | symbol; metadata: DecoratorMetadataObject }) => AddXmlMeta(context, { kind: "elem", prop: String(context.name), ...opts });
}

/**
 *
 * @param obj
 * @returns
 */
export function GetXmlFieldMeta(obj: any): FieldMeta[] {
    const ctor = typeof obj === "function" ? obj : obj?.constructor;
    const metadata: DecoratorMetadataObject | undefined = ctor?.[Symbol.metadata];
    if (!metadata) {
        return [];
    }
    // Walk metadata chain to collect all field metadata
    const result: FieldMeta[] = [];
    let currentMeta: any = metadata;
    while (currentMeta) {
        if (Object.prototype.hasOwnProperty.call(currentMeta, XML_CLASS_META)) {
            result.push(...(currentMeta[XML_CLASS_META] as FieldMeta[]));
        }
        currentMeta = Object.getPrototypeOf(currentMeta);
    }
    return result;
}

/**
 *
 * @param obj
 * @returns
 */
export function GetXmlName(obj: any): XmlName | undefined {
    const n = obj?.constructor?.[XML_CLASS_NAME];
    return n ? (n as XmlName) : undefined;
}

/**
 *
 * @param s
 * @returns
 */
function LooksLikeXmlNcName(s: string): boolean {
    // Approximation ASCII de NCName: pas de ":" et demarre par lettre ou underscore
    // Puis lettres/chiffres/underscore/point/tiret.
    return /^[A-Za-z_][A-Za-z0-9._-]*$/.test(s);
}

/**
 *
 * @param qn
 * @returns
 */
export function XmlNameToParts(qn: XmlName): IQualifiedName {
    if (IsQualifiedName(qn)) {
        return qn;
    }
    const s = (qn ?? "").trim();
    if (!s) {
        return { name: "" };
    }
    const i = s.indexOf(":");
    if (i === -1) {
        return { name: s };
    }

    // Un QName XML ne doit contenir qu un seul ":".
    // Si il y en a plusieurs, on considere que ce n est pas un QName.
    if (s.indexOf(":", i + 1) !== -1) {
        return { name: s };
    }

    const prefix = s.slice(0, i);
    const local = s.slice(i + 1);

    if (LooksLikeXmlNcName(prefix) && LooksLikeXmlNcName(local)) {
        return { ns: prefix, name: local };
    }
    return { name: s };
}

/**
 *
 * @param name
 * @param prefix
 * @returns
 */
export function ToQualifiedString(name: string, prefix?: string): string {
    return prefix ? `${prefix}:${name}` : name;
}
