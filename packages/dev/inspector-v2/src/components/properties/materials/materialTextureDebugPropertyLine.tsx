import { makeStyles, tokens } from "@fluentui/react-components";
import { type FunctionComponent, useCallback, useEffect, useRef } from "react";

import { type Material } from "core/Materials/material";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Nullable } from "core/types";
import { StandardMaterial } from "core/Materials/standardMaterial";

import { type PropertyLineProps, PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { type TextureSelectorProps, TextureSelector } from "shared-ui-components/fluent/primitives/textureSelector";
import { Switch } from "shared-ui-components/fluent/primitives/switch";

import { useProperty } from "../../../hooks/compoundPropertyHooks";

type MaterialTextureDebugPropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & TextureSelectorProps & { material: Material };

type DebugTextureStore = {
    debugTexture: Nullable<BaseTexture>;
    debugMaterial: Nullable<Material>;
};

const useStyles = makeStyles({
    expandedDebugContainer: {
        display: "flex",
        alignItems: "center",
        marginTop: tokens.spacingVerticalXS,
    },
    debugLabel: {
        flex: 1,
    },
});

/**
 * Toggles debug mode for a texture on a material.
 * When enabled, creates a debug `StandardMaterial` with the texture wired as `emissiveTexture` and swaps it onto every
 * mesh that currently uses the original material. Enabling debug for one texture on a material disables it for any
 * other texture on that material (mutually exclusive).
 *
 * Notes:
 * - The texture is rendered using its current `level`. Textures whose level is not 1 will appear modulated; this is
 *   intentional so that no global state on the source texture is mutated (a level mutation would affect every other
 *   material that references the same texture instance).
 * - Only meshes referencing the original material at toggle time receive the debug material. Meshes added or
 *   reassigned to the original material afterwards are not affected until the next toggle cycle.
 * @param material - The material to debug
 * @param texture - The texture to debug
 * @param enable - Whether to enable or disable debug mode
 */
function ToggleTextureDebug(material: Material, texture: Nullable<BaseTexture>, enable: boolean): void {
    if (!material || !texture) {
        return;
    }

    const scene = material.getScene();
    material.reservedDataStore ??= {};
    const store = material.reservedDataStore as Partial<DebugTextureStore>;
    store.debugTexture ??= null;
    store.debugMaterial ??= null;

    const isCurrentlyDebugging = store.debugTexture === texture;

    if (enable && !isCurrentlyDebugging) {
        // If we were debugging a different texture, clean it up first.
        if (store.debugTexture) {
            ToggleTextureDebug(material, store.debugTexture, false);
        }

        const debugMaterial = new StandardMaterial("debugMaterial", scene);
        debugMaterial.disableLighting = true;
        debugMaterial.sideOrientation = material.sideOrientation;
        debugMaterial.emissiveTexture = texture;
        debugMaterial.forceDepthWrite = true;
        debugMaterial.reservedDataStore = { hidden: true };

        for (const mesh of scene.meshes) {
            if (mesh.material === material) {
                mesh.material = debugMaterial;
            }
        }

        store.debugMaterial = debugMaterial;
        // Assign debugTexture LAST so observers see a fully-populated store.
        store.debugTexture = texture;
    } else if (!enable && isCurrentlyDebugging) {
        const debugMaterial: Nullable<Material> = store.debugMaterial;
        if (debugMaterial) {
            for (const mesh of scene.meshes) {
                if (mesh.material === debugMaterial) {
                    mesh.material = material;
                }
            }

            debugMaterial.dispose();
            store.debugMaterial = null;
        }
        store.debugTexture = null;
    }
}

/**
 * A texture selector property line with material texture debug capability.
 * Displays a debug toggle in expanded content to render the selected texture as emissive on the material.
 * Enabling debug on one texture for a given material disables it for any other texture on that material.
 * @param props - The texture selector property line props plus material reference
 * @returns The property line element with debug toggle
 */
export const MaterialTextureDebugPropertyLine: FunctionComponent<MaterialTextureDebugPropertyLineProps> = (props) => {
    const classes = useStyles();
    const { material, ...textureProps } = props;
    const texture = props.value;

    const reservedDataStore = useProperty(material, "reservedDataStore") as Partial<DebugTextureStore> | null | undefined;
    const debugTexture = useProperty(reservedDataStore, "debugTexture");
    const isDebugEnabled = !!texture && debugTexture === texture;

    // Track the texture this slot last rendered with so we can detect when its value changes away
    // from the texture currently being debugged. Without this, reassigning the slot's texture (or
    // setting it to null) while debug is active would leave the scene stuck in debug view with no
    // visible toggle to turn it off (the toggle for that slot is keyed off texture-instance
    // equality and would just appear off).
    const prevTextureRef = useRef(texture);
    useEffect(() => {
        const prevTexture = prevTextureRef.current;
        prevTextureRef.current = texture;
        if (prevTexture && prevTexture !== texture) {
            const store = material.reservedDataStore as Partial<DebugTextureStore> | undefined;
            if (store?.debugTexture === prevTexture) {
                ToggleTextureDebug(material, prevTexture, false);
            }
        }
    }, [texture]);

    const handleDebugToggle = useCallback(
        (checked: boolean) => {
            if (texture) {
                ToggleTextureDebug(material, texture, checked);
            }
        },
        [material, texture]
    );

    const expandedContent = texture ? (
        <div className={classes.expandedDebugContainer}>
            <span className={classes.debugLabel}>Display Texture for Debug</span>
            <Switch value={isDebugEnabled} onChange={handleDebugToggle} />
        </div>
    ) : undefined;

    return (
        <PropertyLine {...textureProps} expandedContent={expandedContent}>
            <TextureSelector {...textureProps} />
        </PropertyLine>
    );
};
