import type { IXmlSerializerFormatOptions } from "./xml.serializer.format";

/** */
export interface IQualifiedName {
    /** */
    ns?: string;
    /** */
    name: string;
}

/** */
export interface IXmlBuilder {
    dec(version: string, encoding?: string, standalone?: boolean): IXmlBuilder;
    att(ns: string | null, n: string, v: string): IXmlBuilder;
    ele(ns: string | null, n: string): IXmlBuilder;
    text(txt: string): IXmlBuilder;
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

/**
 *
 */
export interface IFormatter<T = any> {
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

function AddXmlMeta(target: any, meta: FieldMeta) {
    const ctor = target.constructor;
    (ctor[XML_CLASS_META] ??= []).push(meta);
}

/**
 * @param name
 * @returns
 */
export function XmlName(name: XmlName) {
    return (ctor: Function) => {
        (ctor as any)[XML_CLASS_NAME] = name;
    };
}

/**
 * tell the serializer to ignore the property
 * @returns
 */
export function XmlIgnore() {
    return (target: any, prop: string) => AddXmlMeta(target, { kind: "none", prop, ignore: true });
}

/**
 * tell the serializer to serialize the property as attribute
 * @returns
 */
export function XmlAttr(opts?: { name: XmlName; formatter?: FormatterCtor<any> }) {
    return (target: any, prop: string) => AddXmlMeta(target, { kind: "attr", prop, ...opts });
}

/**
 * tell the serializer to serialize the property as element - this is the default behavior but shoud be
 * specified when wanted to update the default name of the classe or if the class is not decorated (without \@XmlName)
 * @returns
 */
export function XmlElem(opts?: { name: XmlName }) {
    return (target: any, prop: string) => AddXmlMeta(target, { kind: "elem", prop, ...opts });
}

/**
 *
 * @param obj
 * @returns
 */
export function GetXmlFieldMeta(obj: any): FieldMeta[] {
    return (obj?.constructor?.[XML_CLASS_META] ?? []) as FieldMeta[];
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
