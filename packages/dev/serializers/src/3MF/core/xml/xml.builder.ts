import type { IXmlBuilder } from "./xml.interfaces";

/**
 */
export interface IXmlWriter {
    /**
     * @param data
     * @returns
     */
    write(...data: string[]): IXmlWriter;
    /** */
    count: number;
    /** */
    clear(): void;
}

/** */
class XmlSyntax {
    /** */
    public static OpenTag: string = "<";
    /** */
    public static CloseTag: string = ">";
    /** */
    public static Slash: string = "/";
    /** */
    public static Question: string = "?";
    /** */
    public static Quote: string = '"';
    /** */
    public static Equal: string = "=";
    /** */
    public static Space: string = " ";
    /** */
    public static Semicolon: string = ":";

    /** */
    public static Dec = "<?xml";
    /** */
    public static Xml = "xml";
    /** */
    public static Xmlns = "xmlns";
    /** */
    public static Xsi = "xsi";

    /** */
    public static VersionKeyword = "version";
    /** */
    public static EncodingKeyword = "encoding";
    /** */
    public static StandaloneKeyword = "standalone";
}

/** */
export enum TokenType {
    Declaration,
    Tag,
    Attribute,
    Text,
}

/** */
export class XmlBuilder implements IXmlBuilder {
    /** */
    static Context = class {
        /** */
        name: string = "";
        /** */
        closed: boolean = false;
        /** */
        lastToken: TokenType | null = null;
        /** */
        depth: number;

        // uri -> prefix
        ns2prefix: Map<string, string> = new Map();

        // prefix -> uri (for conflict checks)
        prefix2ns: Map<string, string> = new Map();

        // optional: default namespace uri
        defaultNs: string | null = null;

        /**
         *
         *@param name
         *@param depth
         */
        constructor(name: string, depth: number) {
            this.name = name;
            this.depth = depth;
        }
    };

    /** */
    private _w: IXmlWriter;
    /** */
    private _ctxStack: Array<InstanceType<typeof XmlBuilder.Context>> = [];
    /** */
    private _d: number = 0;

    public constructor(w: IXmlWriter) {
        this._w = w;
    }

    /**
     *
     * @param version
     * @param encoding
     * @param standalone
     * @returns
     */
    public dec(version: string, encoding?: string, standalone?: boolean): IXmlBuilder {
        this._w.write(XmlSyntax.Dec);
        this._writeAttStr(XmlSyntax.VersionKeyword, version);
        if (encoding) {
            this._writeAttStr(XmlSyntax.EncodingKeyword, encoding);
        }
        if (standalone !== undefined) {
            this._writeAttStr(XmlSyntax.StandaloneKeyword, standalone ? "yes" : "no");
        }
        this._w.write(XmlSyntax.Question, XmlSyntax.CloseTag);
        return this;
    }

    /**
     *
     * @param ns
     * @param n
     * @param v
     * @returns
     */
    public att(ns: string | null, n: string, v: string): IXmlBuilder {
        const ctx = this._peekContext();
        if (!ctx) {
            throw new Error("att() without open element");
        }
        if (ctx.closed) {
            throw new Error(`att() after start tag closed for <${ctx.name}>`);
        }

        // explicit namespace declaration: xmlns or xmlns:prefix
        if (this._isXmlnsDecl(ns, n)) {
            if (n === XmlSyntax.Xmlns) {
                // default namespace
                ctx.defaultNs = v;
                // you can store default as empty prefix if you want
                this._registerNamespace(ctx, "", v);
                this._writeAttStr(XmlSyntax.Xmlns, v);
            } else {
                if (!ns) {
                    const prefix = n.slice(6); // "xmlns:"
                    this._registerNamespace(ctx, prefix, v);
                    this._writeAttStr(n, v);
                } else {
                    this._registerNamespace(ctx, n, v);
                    this._writeAttStr(`${ns}:${n}`, v);
                }
            }
            ctx.lastToken = TokenType.Attribute;
            return this;
        }

        // normal attribute
        let qn = n;

        if (ns) {
            // treat ns as a namespace URI, not a prefix
            const p = this._ensurePrefixDeclared(ctx, ns);
            qn = `${p}:${n}`;
        }

        ctx.lastToken = TokenType.Attribute;
        this._writeAttStr(qn, v);
        return this;
    }

    /**
     *
     * @param ns
     * @param n
     * @returns
     */
    public ele(ns: string | null, n: string): IXmlBuilder {
        let ctx = this._peekContext();
        if (ctx) {
            this._closeOpenTagIfNeeded(ctx);
        }
        let qns = n;
        if (ns) {
            const p = this._lookupPrefix(ns) ?? ns;
            qns = `${p}:${n}`;
        }
        ctx = this._pushContext(qns, ++this._d);
        this._w.write(XmlSyntax.OpenTag, qns);
        return this;
    }

    /**
     *
     * @param txt
     * @returns
     */
    public text(txt: string): IXmlBuilder {
        const ctx = this._peekContext();
        if (!ctx) {
            throw new Error("text() without open element");
        }
        this._closeOpenTagIfNeeded(ctx);
        ctx.lastToken = TokenType.Text;
        this._w.write(this._escText(txt));
        return this;
    }

    /**
     *
     * @returns
     */
    public end(): IXmlBuilder {
        const ctx = this._popContext();
        if (ctx) {
            this._d--;
            if (!ctx.closed) {
                this._w.write(XmlSyntax.Slash, XmlSyntax.CloseTag);
            } else {
                this._w.write(XmlSyntax.OpenTag, XmlSyntax.Slash, ctx.name, XmlSyntax.CloseTag);
            }
        }
        return this;
    }

    protected _pushContext(name: string, depth: number): InstanceType<typeof XmlBuilder.Context> {
        const ctx = new XmlBuilder.Context(name, depth);
        this._ctxStack.push(ctx);
        return ctx;
    }

    protected _popContext(): InstanceType<typeof XmlBuilder.Context> | undefined {
        return this._ctxStack.pop();
    }

    protected _peekContext(): InstanceType<typeof XmlBuilder.Context> | undefined {
        return this._ctxStack[this._ctxStack.length - 1];
    }

    protected get _contextDepth(): number {
        return this._ctxStack.length;
    }

    private _writeAttStr(name: string, value: string) {
        this._w.write(XmlSyntax.Space, name, XmlSyntax.Equal, XmlSyntax.Quote, this._escAttr(value), XmlSyntax.Quote);
    }

    private _lookupPrefix(ns: string): string | undefined {
        let i = this._ctxStack.length - 1;
        if (i >= 0) {
            do {
                const ctx = this._ctxStack[i--];
                const p = ctx.ns2prefix?.get(ns);
                if (p) {
                    return p;
                }
            } while (i >= 0);
        }
        return undefined;
    }

    private _escText(s: string): string {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    private _escAttr(s: string): string {
        return this._escText(s).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }

    private _isXmlnsDecl(ns: string | null, n: string): boolean {
        if (ns) {
            return ns === XmlSyntax.Xmlns;
        }
        const l = n.length;
        const s = XmlSyntax.Xmlns.length;
        if (l >= s) {
            return n.startsWith(XmlSyntax.Xmlns) && (n.length == s || n[s] == XmlSyntax.Semicolon);
        }
        return false;
    }

    private _registerNamespace(ctx: InstanceType<typeof XmlBuilder.Context>, prefix: string, uri: string) {
        if (prefix === XmlSyntax.Xml || prefix === XmlSyntax.Xmlns) {
            throw new Error(`reserved prefix '${prefix}'`);
        }

        const existingUri = ctx.prefix2ns.get(prefix);
        if (existingUri && existingUri !== uri) {
            throw new Error(`prefix '${prefix}' already bound to a different namespace`);
        }

        const existingPrefix = ctx.ns2prefix.get(uri);
        if (!existingPrefix) {
            ctx.ns2prefix.set(uri, prefix);
        }

        ctx.prefix2ns.set(prefix, uri);
    }

    private _allocPrefix(ctx: InstanceType<typeof XmlBuilder.Context>): string {
        let i = 1;
        while (true) {
            const p = `ns${i++}`;
            if (!ctx.prefix2ns.has(p)) {
                return p;
            }
        }
    }

    private _ensurePrefixDeclared(ctx: InstanceType<typeof XmlBuilder.Context>, uri: string): string {
        const existing = this._lookupPrefix(uri);
        if (existing) {
            return existing;
        }

        if (ctx.closed) {
            throw new Error(`can not declare namespace after start tag closed for <${ctx.name}>`);
        }

        const prefix = this._allocPrefix(ctx);

        // write xmlns:prefix="uri" and register it
        this._writeAttStr(`${XmlSyntax.Xmlns}:${prefix}`, uri);
        this._registerNamespace(ctx, prefix, uri);

        return prefix;
    }

    private _closeOpenTagIfNeeded(ctx: InstanceType<typeof XmlBuilder.Context>) {
        if (!ctx.closed) {
            this._w.write(XmlSyntax.CloseTag);
            ctx.closed = true;
        }
    }
}
