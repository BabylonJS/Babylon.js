import { type IQualifiedName, XmlNameToParts, type IXmlBuilder, type XmlName, GetXmlName, ToQualifiedString, GetXmlFieldMeta } from "./xml.interfaces";
import { NumberFormatter, ResolveFormatOptions, type IXmlSerializerFormatOptions } from "./xml.serializer.format";

type Primitive = string | number | boolean | bigint | Date;

function IsDate(x: any): x is Date {
    return x instanceof Date;
}

function IsString(x: any): x is string {
    return typeof x === "string";
}

function IsNumber(x: any): x is number {
    return typeof x === "number";
}

function IsPrimitive(x: any): x is Primitive {
    return typeof x === "string" || typeof x === "number" || typeof x === "boolean" || typeof x === "bigint" || IsDate(x);
}

function IsPrimitiveButString(x: any): x is Primitive {
    return typeof x === "number" || typeof x === "boolean" || typeof x === "bigint" || IsDate(x);
}

/**
 */
export class XmlSerializer {
    /** */
    private _format: IXmlSerializerFormatOptions;
    /** */
    private _builder: IXmlBuilder;
    /** */
    private _ns: Map<string, string> = new Map<string, string>();
    /** */
    private _prefixCount: number = 0;

    private _nFmt?: NumberFormatter;

    /**
     *
     * @param builder
     * @param format
     */
    public constructor(builder: IXmlBuilder, format?: IXmlSerializerFormatOptions) {
        this._builder = builder;
        this._format = ResolveFormatOptions(format);
        this._nFmt = new NumberFormatter(this._format);
    }

    /**
     *
     * @param ns
     * @returns
     */
    public withNamespace(...ns: XmlName[]): XmlSerializer {
        for (const s of ns) {
            this._assignNamespace(s);
        }
        return this;
    }

    /**
     *
     * @param root
     * @param name
     */
    serialize(root: object, name?: XmlName) {
        name = name ?? GetXmlName(root);
        if (!name) {
            throw new Error("can not find name for given object");
        }
        const currentName: IQualifiedName = XmlNameToParts(name);
        if (currentName.ns) {
            // ensure we register the root namespace as default if not already set...
            this._assignNamespace(currentName.ns, "xmlns");
        }
        this._gatherNamespaces(root, new WeakSet<object>());

        const doc = this._builder.ele(null, currentName.name);
        for (const [v, n] of Array.from(this._ns.entries())) {
            doc.att("xmlns", n, v);
        }
        this._writeObjectContent(doc, root as Record<string, unknown>, new WeakSet<object>().add(root));
        this._builder.end();
    }

    private _writeObject(builder: IXmlBuilder, source: Record<string, unknown>, visited: WeakSet<object>): void {
        if (visited.has(source)) {
            return;
        }
        visited.add(source);

        if (Array.isArray(source)) {
            for (const item of source) {
                if (IsPrimitiveButString(item)) {
                    continue;
                }
                if (IsString(item)) {
                    this._builder.text(item);
                    continue;
                }
                this._writeObject(builder, item, visited);
            }
            return;
        }

        const qname = GetXmlName(source);
        if (!qname) {
            return;
        }
        const currentName = XmlNameToParts(qname);
        const prefix = this._getPrefix(currentName);
        const tmp = ToQualifiedString(currentName.name, prefix);
        builder.ele(null, tmp);
        this._writeObjectContent(builder, source as Record<string, unknown>, visited);
        this._builder.end();
    }

    private _getPrefix(qn: IQualifiedName): string | undefined {
        if (qn.ns) {
            const p = this._ns.get(qn.ns.toLowerCase());
            if (p !== "xmlns") {
                return p;
            }
        }
        return undefined;
    }

    private _writeObjectContent(builder: IXmlBuilder, source: Record<string, unknown>, visited: WeakSet<object>): void {
        // gather meta and build index
        const metas = GetXmlFieldMeta(source) ?? [];
        const metaByProp = new Map<string, typeof metas>();

        for (const m of metas) {
            const arr = metaByProp.get(m.prop) ?? [];
            arr.push(m);
            metaByProp.set(m.prop, arr);
        }

        // ensure the att are processed first, otherwize, the tag might be closed...
        const keys = Object.keys(source).sort((a, b) => {
            const aHasAttr = (metaByProp.get(a) ?? []).some((m) => m.kind === "attr");
            const bHasAttr = (metaByProp.get(b) ?? []).some((m) => m.kind === "attr");
            if (aHasAttr === bHasAttr) {
                return 0;
            }
            return aHasAttr ? -1 : 1; // attr d abord
        });

        // We decide per property, using metadata if present
        for (const prop of keys) {
            const value: any = source[prop];
            if (value === null || value === undefined) {
                continue;
            }

            const propMetas = metaByProp.get(prop);
            if (propMetas) {
                const ignored = propMetas.some((m) => m.ignore === true || m.kind === "none");
                if (ignored) {
                    continue;
                }

                for (const m of propMetas) {
                    const name = m.name ?? m.prop.toLowerCase(); // if the name is not defined, we assume it's the lower case version of name of the property.
                    if (name) {
                        switch (m.kind) {
                            case "attr": {
                                let vStr: string | null = null;
                                if (IsNumber(value) && this._nFmt) {
                                    vStr = this._nFmt.toString(value);
                                }
                                if (m.formatter) {
                                    // TODO : cache the created formatter to avoid to many allocation.
                                    const f = new m.formatter(this._format);
                                    vStr = f.toString(value);
                                }
                                vStr = vStr ?? value.toString();
                                if (vStr) {
                                    const currentName = XmlNameToParts(name);
                                    const prefix = this._getPrefix(currentName);
                                    const tmp = ToQualifiedString(currentName.name, prefix);
                                    builder.att(null, tmp, vStr);
                                }
                                break;
                            }
                        }
                    }
                }
                continue;
            }
            if (IsPrimitiveButString(value)) {
                continue;
            }
            if (IsString(value)) {
                this._builder.text(value);
                continue;
            }
            this._writeObject(builder, value, visited);
        }
    }

    // this is the first browse of the hierarchy to collect the namespaces and assign placeholder.( ns0, ns1,...)
    private _gatherNamespaces(tag: any, visited: WeakSet<object>): void {
        if (visited.has(tag)) {
            return;
        }
        visited.add(tag);

        if (Array.isArray(tag)) {
            for (const item of tag) {
                if (IsPrimitive(item)) {
                    continue;
                }
                this._gatherNamespaces(item, visited);
            }
            return;
        }

        const qname = GetXmlName(tag);
        if (qname) {
            this._assignNamespace(qname);
        }

        // gather meta and build index
        const metas = GetXmlFieldMeta(tag) ?? [];
        const metaByProp = new Map<string, typeof metas>();

        for (const m of metas) {
            const arr = metaByProp.get(m.prop) ?? [];
            arr.push(m);
            metaByProp.set(m.prop, arr);
        }

        // We decide per property, using metadata if present
        const toVisit: object[] = [];

        for (const prop of Object.keys(tag)) {
            const value = tag[prop];
            if (value === null || value === undefined) {
                continue;
            }
            const propMetas = metaByProp.get(prop);
            if (propMetas) {
                const ignored = propMetas.some((m) => m.ignore === true || m.kind === "none");
                if (ignored) {
                    continue;
                }

                for (const m of propMetas) {
                    if (m.name) {
                        this._assignNamespace(m.name);
                    }
                }
            }
            toVisit.push(value);
        }

        for (const v of toVisit) {
            if (IsPrimitive(v)) {
                continue;
            }
            this._gatherNamespaces(v, visited);
        }
    }

    private _assignNamespace(qn: XmlName, prefix?: string) {
        const nqn = XmlNameToParts(qn);
        if (nqn?.ns) {
            const ns = nqn.ns.toLowerCase();
            if (!this._ns.get(ns)) {
                this._ns.set(ns, prefix ?? this._buildNsPrefix(ns));
            }
            return;
        }
        if (prefix === "xmlns") {
            const ns = nqn.name.toLowerCase();
            if (!this._ns.get(ns)) {
                this._ns.set(ns, prefix ?? this._buildNsPrefix(ns));
            }
        }
    }

    private _buildNsPrefix(_ns: string): string {
        let alreadyReferenced = false;
        let value: string;
        do {
            value = `ns${this._prefixCount++}`;
            for (const v of Array.from(this._ns.values())) {
                if (v === value) {
                    alreadyReferenced = true;
                    break;
                }
            }
        } while (alreadyReferenced);

        return value;
    }
}
