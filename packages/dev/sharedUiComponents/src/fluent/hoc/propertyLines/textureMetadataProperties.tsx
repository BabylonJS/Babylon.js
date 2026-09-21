import { type FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "./booleanBadgePropertyLine";
import { StringifiedPropertyLine } from "./stringifiedPropertyLine";
import { TextPropertyLine } from "./textPropertyLine";

/** A single immutable texture metadata row. */
export type TextureMetadataRow = Readonly<{
    id: string;
    label: string;
    value?: string | number | boolean | null;
    units?: string;
    description?: string;
    error?: string;
}>;

/** Runtime-neutral metadata-only texture snapshot. */
export type TextureMetadataModel = Readonly<{
    rows: readonly TextureMetadataRow[];
    error?: string;
}>;

/**
 * Displays texture metadata without previewing, reading back, editing, uploading, or exporting texture data.
 * @param props The immutable metadata snapshot.
 * @returns Texture metadata property lines.
 */
export const TextureMetadataProperties: FunctionComponent<{ model: TextureMetadataModel }> = (props) => {
    const { model } = props;

    return (
        <div role={model.error ? "alert" : undefined}>
            {model.error ? <TextPropertyLine label="Error" value={model.error} /> : undefined}
            {model.rows.map((row) => {
                const description = row.error ? `${row.description ? `${row.description} ` : ""}Error: ${row.error}` : row.description;
                const content =
                    typeof row.value === "boolean" ? (
                        <BooleanBadgePropertyLine label={row.label} uniqueId={row.id} value={row.value} description={description} />
                    ) : typeof row.value === "number" ? (
                        <StringifiedPropertyLine label={row.label} uniqueId={row.id} value={row.value} units={row.units} description={description} />
                    ) : (
                        <TextPropertyLine label={row.label} uniqueId={row.id} value={row.value == null ? "Unavailable" : row.value} description={description} />
                    );

                return row.error ? (
                    <div key={row.id} role="alert" aria-label={`${row.label}: ${row.error}`}>
                        {content}
                    </div>
                ) : (
                    <div key={row.id}>{content}</div>
                );
            })}
        </div>
    );
};
