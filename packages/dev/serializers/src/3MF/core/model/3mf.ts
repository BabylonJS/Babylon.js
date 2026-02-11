import { type IFormatter, XmlAttr, XmlName } from "../xml/xml.interfaces";
import { type IXmlSerializerFormatOptions, NumberFormatter } from "../xml/xml.serializer.format";
import type {
    I3mfBase,
    I3mfBaseMaterials,
    I3mfBuild,
    I3mfComponent,
    I3mfComponents,
    I3mfItem,
    I3mfMesh,
    I3mfMetadata,
    I3mfMetadataGroup,
    I3mfModel,
    I3mfObject,
    I3mfResources,
    I3mfTriangle,
    I3mfTriangles,
    I3mfVertex,
    I3mfVertices,
    ST_ColorValue,
    ST_Number,
    ST_ResourceID,
    ST_ResourceIndex,
    ST_UriReference,
    IMatrix3d,
    ST_Matrix3D,
} from "./3mf.interfaces";
import { ST_Unit, ThreeDimModelNamespace, ST_ObjectType } from "./3mf.interfaces";

/**
 *
 */
export class Matrix3d implements IMatrix3d {
    /**
     *
     * @returns
     */
    public static Zero() {
        return new Matrix3d([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    /**
     *
     * @param values
     */
    public constructor(public values: ST_Matrix3D) {}

    /**
     *
     * @returns
     */
    public toString(): string {
        return this.values.join(" ");
    }
}

/**
 *
 */
export class MatrixFormatter implements IFormatter<Matrix3d> {
    /**
     *
     */
    _f: NumberFormatter;

    public constructor(public o: IXmlSerializerFormatOptions) {
        this._f = new NumberFormatter(o);
    }

    public toString(x: Matrix3d): string {
        return x.values.map((v) => this._f.toString(v)).join(" ");
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "model" })
export class ThreeMfModel implements I3mfModel {
    /**
     *
     */
    public static KnownMeta: Array<string> = ["Title", "Designer", "Description", "Copyright", "LicenseTerms", "Rating", "CreationDate", "ModificationDate", "Application"];

    /**
     *
     */
    @XmlAttr({ name: "unit" })
    unit: ST_Unit = ST_Unit.millimeter;

    /**
     *
     */
    @XmlAttr({ name: "requiredextensions" })
    requiredextensions?: string;

    /**
     *
     */
    @XmlAttr({ name: "recommendedextensions" })
    recommendedextensions?: string;

    /**
     *
     */
    metadata?: Array<I3mfMetadata>;
    /**
     *
     */
    resources?: I3mfResources;
    /**
     *
     */
    build?: I3mfBuild;
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "meta" })
export class ThreeMfMeta implements I3mfMetadata {
    /**
     *
     */
    @XmlAttr({ name: "name" })
    name: string;

    /**
     *
     */
    @XmlAttr({ name: "preserve" })
    preserve?: boolean;

    /**
     *
     */
    @XmlAttr({ name: "type" })
    type?: string;

    /**
     *
     */
    value: string;

    /**
     *
     * @param name
     * @param value
     * @param preserve
     * @param type
     */
    public constructor(name: string, value: string, preserve?: boolean, type?: string) {
        this.name = name;
        this.value = value;
        this.preserve = preserve;
        this.type = type;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "metadatagroup" })
export class ThreeMfMetadataGroup implements I3mfMetadataGroup {
    /**
     *
     */
    metadata: Array<I3mfMetadata> = [];
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "resources" })
export class ThreeMfResources implements I3mfResources {
    /**
     *
     */
    object: Array<I3mfObject> = [];
    /**
     *
     */
    basematerials?: Array<I3mfBaseMaterials>;
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "object" })
export class ThreeMfObject implements I3mfObject {
    /**
     *
     */
    @XmlAttr({ name: "id" })
    id: ST_ResourceID;

    /**
     *
     */
    @XmlAttr({ name: "type" })
    type?: ST_ObjectType;

    /**
     *
     */
    @XmlAttr({ name: "thumbnail" })
    thumbnail?: ST_UriReference;

    /**
     *
     */
    @XmlAttr({ name: "partnumber" })
    partnumber?: string;

    /**
     *
     */
    @XmlAttr({ name: "name" })
    name?: string;

    /**
     *
     */
    @XmlAttr({ name: "pid" })
    pid?: ST_ResourceID;

    /**
     *
     */
    @XmlAttr({ name: "pindex" })
    pindex?: ST_ResourceIndex;

    /**
     *
     */
    metadatagroup?: I3mfMetadataGroup;

    /**
     *
     */
    content?: I3mfMesh | I3mfComponents;

    public constructor(id: ST_ResourceID, type = ST_ObjectType.model) {
        this.id = id;
        this.type = type;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "mesh" })
export class ThreeMfMesh implements I3mfMesh {
    /**
     *
     */
    vertices: I3mfVertices;
    /**
     *
     */
    triangles: I3mfTriangles;

    public constructor(vertices?: I3mfVertices, triangles?: I3mfTriangles) {
        this.vertices = vertices ?? new ThreeMfVertices();
        this.triangles = triangles ?? new ThreeMfTriangles();
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "vertices" })
export class ThreeMfVertices implements I3mfVertices {
    /**
     *
     */
    vertex: Array<I3mfVertex> = [];
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "vertex" })
export class ThreeMfVertex implements I3mfVertex {
    /**
     *
     */
    @XmlAttr({ name: "x" })
    x: ST_Number;

    /**
     *
     */
    @XmlAttr({ name: "y" })
    y: ST_Number;

    /**
     *
     */
    @XmlAttr({ name: "z" })
    z: ST_Number;

    public constructor(x: ST_Number = 0, y: ST_Number = 0, z: ST_Number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "triangles" })
export class ThreeMfTriangles implements I3mfTriangles {
    /**
     *
     */
    triangle: Array<I3mfTriangle> = [];
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "triangle" })
export class ThreeMfTriangle implements I3mfTriangle {
    /**
     *
     */
    @XmlAttr({ name: "v1" })
    v1: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "v2" })
    v2: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "v3" })
    v3: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "p1" })
    p1?: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "p2" })
    p2?: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "p3" })
    p3?: ST_ResourceIndex;

    /**
     *
     */
    @XmlAttr({ name: "pid" })
    pid?: ST_ResourceID;

    public constructor(v1: ST_ResourceIndex, v2: ST_ResourceIndex, v3: ST_ResourceIndex) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "components" })
export class ThreeMfComponents implements I3mfComponents {
    /**
     *
     */
    component: Array<I3mfComponent> = [];
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "component" })
export class ThreeMfComponent implements I3mfComponent {
    /**
     *
     */
    @XmlAttr({ name: "objectid" })
    objectid: ST_ResourceID;

    /**
     *
     */
    @XmlAttr({ name: "transform", formatter: MatrixFormatter })
    transform?: Matrix3d;

    public constructor(objectid: ST_ResourceID, transform?: Matrix3d) {
        this.objectid = objectid;
        this.transform = transform;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "basematerials" })
export class ThreeMfBaseMaterials implements I3mfBaseMaterials {
    /**
     *
     */
    @XmlAttr({ name: "id" })
    id: ST_ResourceID;

    /**
     *
     */
    base: Array<I3mfBase> = [];

    public constructor(id: ST_ResourceID) {
        this.id = id;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "base" })
export class ThreeMfBase implements I3mfBase {
    /**
     *
     */
    @XmlAttr({ name: "name" })
    name: string;

    /**
     *
     */
    @XmlAttr({ name: "displaycolor" })
    displaycolor: ST_ColorValue;

    public constructor(name: string, displaycolor: ST_ColorValue) {
        this.name = name;
        this.displaycolor = displaycolor;
    }
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "build" })
export class ThreeMfBuild implements I3mfBuild {
    /**
     *
     */
    item: Array<I3mfItem> = [];
}

/**
 *
 */
@XmlName({ ns: ThreeDimModelNamespace, name: "item" })
export class ThreeMfItem implements I3mfItem {
    /**
     *
     */
    @XmlAttr({ name: "objectid" })
    objectid: ST_ResourceID;

    /**
     *
     */
    @XmlAttr({ name: "transform", formatter: MatrixFormatter })
    transform?: Matrix3d;

    /**
     *
     */
    @XmlAttr({ name: "partnumber" })
    partnumber?: string;

    /**
     *
     */
    metadatagroup?: I3mfMetadataGroup;

    public constructor(objectid: ST_ResourceID, transform?: Matrix3d, partnumber?: string) {
        this.objectid = objectid;
        this.transform = transform;
        this.partnumber = partnumber;
    }
}
