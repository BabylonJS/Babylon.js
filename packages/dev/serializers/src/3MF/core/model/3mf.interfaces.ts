/**
 * XML namespace for the core 3MF model schema.
 * This is the default namespace used by <model> and most standard 3MF elements.
 */
export const ThreeDimModelNamespace = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";

/**
 * XML namespace for the TriangleSets extension (2021/07).
 * This extension is used for more advanced triangle/property use cases.
 * Only declare/use it when you actually emit elements/attributes that require it.
 */
export const TriangleSetsNamespace = "http://schemas.microsoft.com/3dmanufacturing/trianglesets/2021/07";

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * 3MF model units.
 * The unit affects interpretation of vertex coordinates (x,y,z).
 * Most pipelines use millimeter, but the writer should match the upstream scene unit expectations.
 */
export enum ST_Unit {
    micron = "micron",
    millimeter = "millimeter",
    centimeter = "centimeter",
    inch = "inch",
    foot = "foot",
    meter = "meter",
}

/**
 * In the XSD, ST_Matrix3D is a whitespace separated list of numbers.
 * The official 3MF core spec uses a 3x4 matrix (12 numbers).
 */
export type ST_Matrix3D = [number, number, number, number, number, number, number, number, number, number, number, number];

/**
 *
 */
export interface IMatrix3d {
    /** */
    values: ST_Matrix3D;
}

/**
 * 3MF color value.
 * In the 3MF core spec, colors are typically expressed as sRGB hex strings: "#RRGGBB" (and sometimes "#AARRGGBB").
 * This type is kept as string because we serialize directly into XML and want to avoid coupling to a specific color class.
 */
export type ST_ColorValue = string;

/**
 * URI reference type used by attributes like thumbnail.
 * Usually a relative package path inside the OPC container, for example "/Metadata/thumbnail.png".
 */
export type ST_UriReference = string;

/**
 * Numeric type used for coordinates and similar scalar values.
 * 3MF stores numbers as XML attributes/text; here we represent them as JS numbers.
 */
export type ST_Number = number;

/**
 * Resource identifiers used by <object id="...">, property groups, etc.
 * This is usually a positive integer unique within the model.
 */
export type ST_ResourceID = number;

/**
 * Resource index used to reference an entry within a resource list.
 * For example, triangle v1/v2/v3 reference indices into <vertices>.
 */
export type ST_ResourceIndex = number;

/**
 * Standard 3MF object type.
 * This is optional in 3MF; if omitted, consumers often treat it as "model".
 */
export enum ST_ObjectType {
    model = "model",
    solidsupport = "solidsupport",
    support = "support",
    surface = "surface",
    other = "other",
}

/**
 * Generic metadata entry.
 * Metadata can appear at the model level (<metadata>) and inside metadata groups (<metadatagroup>).
 *
 * Notes:
 * - "name" is the metadata key.
 * - "type" is optional and can be a MIME type or a schema indicator depending on usage.
 * - "preserve" instructs consumers whether to keep metadata when modifying the model.
 */
export interface I3mfMetadata {
    /** Metadata key (required). */
    name: string;

    /** If true, indicates the metadata should be preserved by consumers (optional). */
    preserve?: boolean;

    /** Optional type information for the value. */
    type?: string;

    /** Metadata value (required). */
    value: string;
}

/**
 * A grouping element for metadata.
 * Used in some places where the schema allows a metadata group rather than raw metadata entries.
 */
export interface I3mfMetadataGroup {
    /** The list of metadata entries contained in the group. */
    metadata: Array<I3mfMetadata>;
}

/**
 * 3MF vertex.
 * Coordinates are expressed in the model unit (I3mfModel.unit).
 */
export interface I3mfVertex {
    /** X coordinate. */
    x: ST_Number;
    /** Y coordinate. */
    y: ST_Number;
    /** Z coordinate. */
    z: ST_Number;
}

/**
 * 3MF triangle.
 * v1/v2/v3 are indices into the vertices list (<vertices> \<vertex .../\>...</vertices>).
 *
 * Property assignment:
 * - pid and p1/p2/p3 are used to assign per-triangle or per-vertex properties (like materials or colors),
 *   depending on which property group pid refers to.
 */
export interface I3mfTriangle {
    /** Index of first vertex in the vertices array. */
    v1: ST_ResourceIndex;
    /** Index of second vertex in the vertices array. */
    v2: ST_ResourceIndex;
    /** Index of third vertex in the vertices array. */
    v3: ST_ResourceIndex;

    /**
     * Optional per-vertex property indices for v1/v2/v3.
     * These are indices into the property group's entry list (the group referenced by pid).
     */
    p1?: ST_ResourceIndex;
    /** */
    p2?: ST_ResourceIndex;
    /** */
    p3?: ST_ResourceIndex;

    /**
     * Property group id for this triangle.
     * If present, it overrides the object-level pid for this specific triangle.
     */
    pid?: ST_ResourceID;
}

/**
 * Container for vertices.
 * Matches the XML structure <vertices>\<vertex .../\>...</vertices>.
 */
export interface I3mfVertices {
    /** Array of vertices. Order matters because triangles reference indices. */
    vertex: Array<I3mfVertex>;
}

/**
 * Container for triangles.
 * Matches the XML structure <triangles>\<triangle .../\>...</triangles>.
 */
export interface I3mfTriangles {
    /** Array of triangles. */
    triangle: Array<I3mfTriangle>;
}

/**
 * Mesh geometry content for an object.
 * Exactly one of: mesh content OR components content should be provided in an object.
 */
export interface I3mfMesh {
    /** Vertex list. */
    vertices: I3mfVertices;

    /** Triangle list. */
    triangles: I3mfTriangles;
}

/**
 * Component reference inside a composite object.
 * A composite object is an object whose content is <components> rather than <mesh>.
 *
 * objectid references another object in resources.
 * transform (3x4) positions that referenced object within the composite.
 */
export interface I3mfComponent {
    /** Referenced object id. */
    objectid: ST_ResourceID;

    /**
     * Optional transform applied to the referenced object within the component.
     * Represented as a 3x4 matrix.
     */
    transform?: IMatrix3d;
}

/**
 * Container for components.
 * Matches <components><component objectid="..."/></components>.
 */
export interface I3mfComponents {
    /** Array of component references. */
    component: Array<I3mfComponent>;
}

/**
 * Object resource.
 * An object either contains a mesh (geometry) or components (composite object).
 *
 * Properties (pid/pindex):
 * - pid references a property group (e.g. basematerials id).
 * - pindex is an index within that group.
 * - If pindex is used, pid is required.
 *
 * Metadata:
 * - metadatagroup is optional and can store additional object-level metadata.
 */
export interface I3mfObject {
    /** Unique object id within the model. */
    id: ST_ResourceID;

    /** Optional object type hint. */
    type?: ST_ObjectType;

    /** Optional thumbnail reference (usually a package path). */
    thumbnail?: ST_UriReference;

    /** Optional part number (often used by manufacturing systems). */
    partnumber?: string;

    /** Optional human-readable name. */
    name?: string;

    /**
     * Property group reference.
     * Example: <basematerials id="5"> ... </basematerials> then pid=5.
     * Required if pindex is specified.
     */
    pid?: ST_ResourceID;

    /**
     * Index inside the property group referenced by pid.
     * Meaning depends on the property group type (base materials, color group, etc.).
     */
    pindex?: ST_ResourceIndex;

    /** Optional grouped metadata for the object. */
    metadatagroup?: I3mfMetadataGroup;

    /**
     * Content of the object:
     * - Mesh geometry OR
     * - Components (composite object).
     *
     * In the 3MF XML schema, this corresponds to having either a <mesh> element or a <components> element.
     */
    content?: I3mfMesh | I3mfComponents;
}

/**
 * A single base material entry.
 * "name" is a label, "displaycolor" provides the color used for rendering previews.
 */
export interface I3mfBase {
    /** Material name/label. */
    name: string;

    /** Display color for the base material. */
    displaycolor: ST_ColorValue;
}

/**
 * Base materials property group.
 * Triangles or objects can reference this group via pid, and then a specific entry via pindex (or p1/p2/p3).
 */
export interface I3mfBaseMaterials {
    /** Property group id. Must be unique within resources. */
    id: ST_ResourceID;

    /** List of base material entries. */
    base: Array<I3mfBase>;
}

/**
 * Model resources container.
 * Holds object resources and optional property groups such as basematerials.
 */
export interface I3mfResources {
    /** All objects available for build items and components. */
    object: Array<I3mfObject>;

    /**
     * Optional base materials groups.
     * Other property groups may exist in 3MF (colors, textures, etc.) but are not modeled here.
     */
    basematerials?: Array<I3mfBaseMaterials>;
}

/**
 * Build item.
 * The build section describes what to "print" or "instantiate" from the resources.
 *
 * objectid references a resource object, and transform places it in the world.
 * partnumber and metadatagroup allow attaching build-item specific info.
 */
export interface I3mfItem {
    /** Referenced object id to build. */
    objectid: ST_ResourceID;

    /** Optional placement transform (3x4). */
    transform?: IMatrix3d;

    /** Optional part number at the build item level. */
    partnumber?: string;

    /** Optional build-item metadata. */
    metadatagroup?: I3mfMetadataGroup;
}

/**
 * Build container.
 * Contains all build items.
 */
export interface I3mfBuild {
    /** Array of build items. */
    item: Array<I3mfItem>;
}

/**
 * Root model element.
 *
 * Extensions:
 * - requiredextensions: a space-separated list of prefixes (or namespaces depending on your serializer conventions)
 *   that are required to interpret the model.
 * - recommendedextensions: extensions that improve fidelity but are not required.
 *
 * Notes:
 * - resources and build are typically present in a valid printable model.
 * - metadata at the model level stores global information like title, author, etc.
 */
export interface I3mfModel {
    /** Unit used for all coordinates in the model. */
    unit?: ST_Unit;

    /** Declares extensions that must be understood by consumers. */
    requiredextensions?: string;

    /** Declares extensions that may be used for better results. */
    recommendedextensions?: string;

    /** Optional model-level metadata entries. */
    metadata?: Array<I3mfMetadata>;

    /** Optional resources section (objects, materials, etc.). */
    resources?: I3mfResources;

    /** Optional build section (what to instantiate/print). */
    build?: I3mfBuild;
}
