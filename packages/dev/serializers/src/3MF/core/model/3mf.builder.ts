// 3MF
import type { Matrix3d } from "./3mf";
import {
    ThreeMfBase,
    ThreeMfBaseMaterials,
    ThreeMfBuild,
    ThreeMfComponent,
    ThreeMfComponents,
    ThreeMfItem,
    ThreeMfMesh,
    ThreeMfMeta,
    ThreeMfModel,
    ThreeMfObject,
    ThreeMfResources,
    ThreeMfTriangle,
    ThreeMfTriangles,
    ThreeMfVertex,
    ThreeMfVertices,
} from "./3mf";
import type {
    I3mfBaseMaterials,
    I3mfComponents,
    I3mfMesh,
    I3mfMetadata,
    I3mfModel,
    I3mfObject,
    I3mfTriangle,
    I3mfTriangles,
    I3mfVertex,
    I3mfVertices,
    ST_ResourceID,
    ST_ResourceIndex,
    ST_Unit,
} from "./3mf.interfaces";
import { ST_ObjectType } from "./3mf.interfaces";
import { ThreeMfContentType, ThreeMfContentTypes, ThreeMfDocument, ThreeMfRelationship, ThreeMfRelationships } from "./3mf.opc";
import type { I3mfDocument } from "./3mf.opc.interfaces";
import {
    Known3mfRelationshipTypes,
    KnownI3mfContentType,
    ModelFileName,
    Object3dDirName,
    type I3mfContentType,
    type I3mfContentTypes,
    type I3mfRelationship,
    type I3mfRelationships,
} from "./3mf.opc.interfaces";
import type { I3mfRGBAColor, I3mfVertexData, ThreeMfFloatArray, ThreeMfIndicesArray } from "./3mf.types";

export type VertexHandler = (vertex: I3mfVertex) => I3mfVertex;
export type TriangleHandler = (triangle: I3mfTriangle) => I3mfTriangle;

/** */
export class ThreeMfObjectBuilder {
    /**
     *
     */
    protected _object: ThreeMfObject;

    /**
     *
     * @param id
     * @param type
     */
    public constructor(id: ST_ResourceID, type: ST_ObjectType) {
        this._object = new ThreeMfObject(id, type);
    }

    /**
     *
     * @param name
     * @returns
     */
    public withName(name: string): ThreeMfObjectBuilder {
        this._object.name = name;
        return this;
    }

    /**
     *
     * @param thumbnail
     * @returns
     */
    public withThumbnail(thumbnail: string): ThreeMfObjectBuilder {
        this._object.thumbnail = thumbnail;
        return this;
    }

    /**
     *
     * @param id
     * @param index
     * @returns
     */
    public withProperty(id: ST_ResourceIndex, index: number = 0): ThreeMfObjectBuilder {
        this._object.pid = id;
        this._object.id = index;
        return this;
    }

    /**
     *
     * @returns
     */
    public build(): I3mfObject {
        return this._object;
    }

    /**
     *
     * @param id
     * @param type
     */
    public reset(id: ST_ResourceID, type: ST_ObjectType) {
        this._object = new ThreeMfObject(id, type);
    }
}

/**
 *
 */
export class ThreeMfComponentsBuilder extends ThreeMfObjectBuilder {
    /**
     *
     * @param id
     * @param type
     */
    public constructor(id: ST_ResourceID, type: ST_ObjectType = ST_ObjectType.model) {
        super(id, type);
        this._object.content = new ThreeMfComponents();
    }

    /**
     *
     * @param id
     * @param t
     * @returns
     */
    public withComponent(id: ST_ResourceID, t?: Matrix3d): ThreeMfComponentsBuilder {
        (this._object.content as I3mfComponents).component.push(new ThreeMfComponent(id, t));
        return this;
    }
}

/**
 *
 */
export class ThreeMfMeshBuilder extends ThreeMfObjectBuilder {
    /**
     *
     */
    _vh?: VertexHandler;
    /**
     *
     */
    _th?: TriangleHandler;

    /**
     *
     * @param id
     */
    public constructor(id: ST_ResourceID) {
        super(id, ST_ObjectType.model);
    }

    /**
     *
     * @param vertex
     * @param triangle
     * @returns
     */
    public withPostProcessHandlers(vertex: VertexHandler, triangle?: TriangleHandler): ThreeMfMeshBuilder {
        this._vh = vertex;
        this._th = triangle;
        return this;
    }

    /**
     *
     * @param data
     * @returns
     */
    withData(data: I3mfVertexData): ThreeMfMeshBuilder {
        this._object.content = this._buildMesh(data);
        return this;
    }

    /**
     *
     * @param id
     * @param i
     * @returns
     */
    withMaterial(id: ST_ResourceID, i: number): ThreeMfMeshBuilder {
        this._object.pid = id;
        this._object.pindex = i;
        return this;
    }

    /**
     *
     * @param data
     * @returns
     */
    private _buildMesh(data: I3mfVertexData): I3mfMesh {
        const vertices = this._buildVertices(data.positions);
        const triangles = this._buildTriangle(data.indices);
        return new ThreeMfMesh(vertices, triangles);
    }

    private _buildVertices(p: ThreeMfFloatArray | null): I3mfVertices {
        const container = new ThreeMfVertices();
        if (p) {
            for (let i = 0; i < p.length; ) {
                const x = p[i++];
                const y = p[i++];
                const z = p[i++];
                let v = new ThreeMfVertex(x, y, z);
                // might be optimized....
                if (this._vh) {
                    v = this._vh(v);
                }
                container.vertex.push(v);
            }
        }
        return container;
    }

    private _buildTriangle(indice: ThreeMfIndicesArray | null): I3mfTriangles {
        const container = new ThreeMfTriangles();
        if (indice) {
            for (let i = 0; i < indice.length; ) {
                const a = indice[i++];
                const b = indice[i++];
                const c = indice[i++];
                let t = new ThreeMfTriangle(a, b, c);
                // might be optimized....
                if (this._th) {
                    t = this._th(t);
                }
                container.triangle.push(t);
            }
        }
        return container;
    }
}

/**
 *
 */
export class ThreeMfMaterialBuilder {
    private _m: I3mfBaseMaterials;

    public constructor(id: ST_ResourceID) {
        this._m = new ThreeMfBaseMaterials(id);
    }

    /**
     *
     * @param name
     * @param color
     * @returns
     */
    public withColor(name: string, color: I3mfRGBAColor): ThreeMfMaterialBuilder {
        this._m.base = this._m.base ?? [];
        let m = this._m.base.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (m) {
            m.displaycolor = this._rgbaToHex(color);
            return this;
        }
        m = new ThreeMfBase(name, this._rgbaToHex(color));
        this._m.base.push(m);
        return this;
    }

    /**
     *
     * @returns
     */
    public build(): I3mfBaseMaterials {
        return this._m;
    }

    private _rgbaToHex(c: I3mfRGBAColor | { r: number; g: number; b: number; a?: number }): string {
        const toSRGB = (c: number) => Math.round(Math.min(255, Math.max(0, Math.pow(c, 1 / 2.2) * 255)));

        const r = toSRGB(c.r).toString(16).padStart(2, "0").toUpperCase();
        const g = toSRGB(c.g).toString(16).padStart(2, "0").toUpperCase();
        const b = toSRGB(c.b).toString(16).padStart(2, "0").toUpperCase();

        if (typeof (c as any).a === "number") {
            const a = Math.round(Math.min(255, Math.max(0, c.a! * 255)))
                .toString(16)
                .padStart(2, "0")
                .toUpperCase();
            return `#${r}${g}${b}${a}`;
        }

        return `#${r}${g}${b}`;
    }
}

/**
 *
 */
export class ThreeMfModelBuilder {
    /**
     *
     */
    static KnownMetaSet = new Set(ThreeMfModel.KnownMeta.map((m) => m.toLowerCase()));

    /**
     *
     */
    _model: ThreeMfModel = new ThreeMfModel();
    /**
     *
     */
    _objects = new Map<string, I3mfObject>();

    /**
     *
     * @param name
     * @param value
     * @param preserve
     * @param type
     * @returns
     */
    public withMetaData(name: string, value: string, preserve?: boolean, type?: string): ThreeMfModelBuilder {
        if (!this._model.metadata) {
            // lazzy
            this._model.metadata = new Array<I3mfMetadata>();
        }
        //const isKnownMeta = (s: string): boolean => TMFBuilder.knownMetaSet.has(s.toLowerCase());
        //const qn:IQName = xmlNameToParts(name);
        this._model.metadata.push(new ThreeMfMeta(name, value, preserve, type));
        return this;
    }

    /**
     *
     * @param material
     * @returns
     */
    public withMaterial(material: I3mfBaseMaterials | ThreeMfMaterialBuilder): ThreeMfModelBuilder {
        if (material instanceof ThreeMfMaterialBuilder) {
            material = material.build();
        }
        if (material) {
            this._model.resources = this._model.resources ?? new ThreeMfResources();
            this._model.resources.basematerials = this._model.resources.basematerials ?? [];
            this._model.resources.basematerials.push(material);
        }
        return this;
    }

    /**
     *
     * @param object
     * @returns
     */
    public withMesh(object: I3mfObject | ThreeMfMeshBuilder): ThreeMfModelBuilder {
        if (object instanceof ThreeMfMeshBuilder) {
            object = object.build();
        }
        this._model.resources = this._model.resources ?? new ThreeMfResources();
        this._model.resources.object.push(object);
        return this;
    }

    /**
     *
     * @param components
     * @returns
     */
    public withComponents(components: I3mfObject | ThreeMfComponentsBuilder): ThreeMfModelBuilder {
        if (components instanceof ThreeMfComponentsBuilder) {
            components = components.build();
        }
        this._model.resources = this._model.resources ?? new ThreeMfResources();
        this._model.resources.object.push(components);
        return this;
    }

    /**
     *
     * @param objectid
     * @param transform
     * @param partnumber
     * @returns
     */
    public withBuild(objectid: ST_ResourceID, transform?: Matrix3d, partnumber?: string): ThreeMfModelBuilder {
        this._model.build = this._model.build ?? new ThreeMfBuild();
        this._model.build.item?.push(new ThreeMfItem(objectid, transform, partnumber));
        return this;
    }

    /**
     *
     * @param unit
     * @returns
     */
    public withUnit(unit: ST_Unit): ThreeMfModelBuilder {
        this._model.unit = unit;
        return this;
    }

    /**
     *
     * @returns
     */
    public reset(): ThreeMfModelBuilder {
        this._model = new ThreeMfModel();
        this._objects = new Map<string, I3mfObject>();
        return this;
    }

    /**
     *
     * @returns
     */
    public build(): ThreeMfModel {
        // quick surface check..
        if (!this._model.resources?.object?.length) {
            throw new Error("Invalid state: resources MUST be defined ");
        }
        if (!this._model.build?.item?.length) {
            throw new Error("Invalid state: Build MUST be defined ");
        }
        return this._model;
    }
}

/**
 *
 */
export class ThreeMfDocumentBuilder {
    private _cts?: I3mfContentTypes;
    private _rs?: I3mfRelationships;
    private _m?: I3mfModel;

    /**
     *
     * @param type
     * @returns
     */
    public withContentType(type: I3mfContentType): ThreeMfDocumentBuilder {
        if (!this._cts) {
            this._cts = new ThreeMfContentTypes();
        }
        const arr = this._cts.items;
        if (!arr.some((x) => x.ext === type.ext && x.ct === type.ct)) {
            arr.push(type);
        }
        return this;
    }

    /**
     *
     * @param rel
     * @returns
     */
    public withRelationship(rel: I3mfRelationship): ThreeMfDocumentBuilder {
        if (!this._rs) {
            this._rs = new ThreeMfRelationships();
        }
        const arr = this._rs.items;
        if (!arr.some((x) => x.id === rel.id)) {
            arr.push(rel);
        }
        // here we ensure that the content type is declared.
        this.withContentType(new ThreeMfContentType("rels", KnownI3mfContentType.Relationships));
        return this;
    }

    /**
     *
     * @param m
     * @returns
     */
    public withModel(m: I3mfModel | ThreeMfModelBuilder): ThreeMfDocumentBuilder {
        if (m instanceof ThreeMfModelBuilder) {
            m = m.build();
        }
        this._m = m;
        // here we ensure that the content type is declared.
        this.withContentType(new ThreeMfContentType("model", KnownI3mfContentType.Model));
        return this;
    }

    public build(): I3mfDocument {
        if (!this._m) {
            throw new Error("Invalid state: you Must provide at least a model.");
        }

        // we automate the build of the relationship if not provided..
        const path = `${Object3dDirName}${ModelFileName}`;
        if (!this._rs) {
            const absolutePath = `/${path}`;
            this.withRelationship(new ThreeMfRelationship(`rel${0}`, Known3mfRelationshipTypes.ThreeDimModel, absolutePath));
        }

        return new ThreeMfDocument(this._cts!, this._rs!, this._m);
    }
}
