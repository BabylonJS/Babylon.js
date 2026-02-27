import type { FunctionComponent } from "react";

import type { ISelectionService } from "../../../services/selectionService";

import { useCallback } from "react";

import { Constants } from "core/Engines/constants";
import { RenderingManager } from "core/Rendering/renderingManager";
import { Sprite } from "core/Sprites/sprite";
import { SpriteManager } from "core/Sprites/spriteManager";
import { Tools } from "core/Misc/tools";
import { AlphaModeOptions } from "shared-ui-components/constToOptionsMaps";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { BoundProperty } from "../boundProperty";
import { TextureSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { NotifyPlaygroundOfSnippetChange, PersistSnippetId, PromptForSnippetId, SaveToSnippetServer } from "../../../misc/snippetUtils";
import { CloudArrowDownRegular, CloudArrowUpRegular } from "@fluentui/react-icons";

const SnippetDashboardStorageKey = "Babylon/InspectorV2/SnippetDashboard/SpriteManagers";

export const SpriteManagerGeneralProperties: FunctionComponent<{ spriteManager: SpriteManager; selectionService: ISelectionService }> = (props) => {
    const { spriteManager, selectionService } = props;

    return (
        <>
            <TextPropertyLine label="Capacity" value={spriteManager.capacity.toString()} />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Texture"
                target={spriteManager}
                propertyKey="texture"
                scene={spriteManager.scene}
                onLink={(texture) => (selectionService.selectedEntity = texture)}
            />
        </>
    );
};

export const SpriteManagerOtherProperties: FunctionComponent<{ spriteManager: SpriteManager }> = (props) => {
    const { spriteManager } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} key="IsPickable" label="Pickable" target={spriteManager} propertyKey="isPickable" />
            <BoundProperty component={SwitchPropertyLine} key="FogEnabled" label="Fog Enabled" target={spriteManager} propertyKey="fogEnabled" />
            <BoundProperty
                component={SwitchPropertyLine}
                key="DepthWrite"
                label="Depth Write"
                target={spriteManager}
                propertyKey="disableDepthWrite"
                convertTo={(value) => !value}
                convertFrom={(value) => !value}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                key="RenderingGroupId"
                label="Rendering Group ID"
                target={spriteManager}
                propertyKey="renderingGroupId"
                min={RenderingManager.MIN_RENDERINGGROUPS}
                max={RenderingManager.MAX_RENDERINGGROUPS}
                step={1}
            />
            <BoundProperty component={NumberDropdownPropertyLine} key="BlendMode" label="Blend Mode" target={spriteManager} propertyKey="blendMode" options={AlphaModeOptions} />
        </>
    );
};

export const SpriteManagerCellProperties: FunctionComponent<{ spriteManager: SpriteManager }> = (props) => {
    const { spriteManager } = props;

    return (
        <>
            <BoundProperty component={SpinButtonPropertyLine} key="CellWidth" label="Cell Width" target={spriteManager} propertyKey="cellWidth" min={1} step={1} />
            <BoundProperty component={SpinButtonPropertyLine} key="CellHeight" label="Cell Height" target={spriteManager} propertyKey="cellHeight" min={1} step={1} />
        </>
    );
};

export const SpriteManagerFileProperties: FunctionComponent<{ spriteManager: SpriteManager; selectionService: ISelectionService }> = (props) => {
    const { spriteManager, selectionService } = props;
    const scene = spriteManager.scene;

    const loadFromFile = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) {
                return;
            }

            Tools.ReadFile(
                file,
                (data) => {
                    const decoder = new TextDecoder("utf-8");
                    const jsonObject = JSON.parse(decoder.decode(data));

                    spriteManager.dispose();
                    selectionService.selectedEntity = null;

                    const newManager = SpriteManager.Parse(jsonObject, scene, "");
                    selectionService.selectedEntity = newManager;
                },
                undefined,
                true
            );
        },
        [spriteManager, scene, selectionService]
    );

    const saveToFile = useCallback(() => {
        const content = JSON.stringify(spriteManager.serialize(true));
        Tools.Download(new Blob([content]), "spriteManager.json");
    }, [spriteManager]);

    return (
        <>
            <FileUploadLine label="Load" onClick={loadFromFile} accept=".json" />
            <ButtonLine label="Save" onClick={saveToFile} />
        </>
    );
};

export const SpriteManagerSnippetProperties: FunctionComponent<{ spriteManager: SpriteManager; selectionService: ISelectionService }> = (props) => {
    const { spriteManager, selectionService } = props;
    const scene = spriteManager.scene;
    const snippetUrl = Constants.SnippetUrl;

    const snippetId = useProperty(spriteManager, "snippetId");

    const loadFromSnippet = useCallback(async () => {
        const requestedSnippetId = PromptForSnippetId();
        if (!requestedSnippetId) {
            return;
        }

        spriteManager.dispose();
        selectionService.selectedEntity = null;

        try {
            const newManager = await SpriteManager.ParseFromSnippetAsync(requestedSnippetId, scene);
            selectionService.selectedEntity = newManager;
        } catch (err) {
            alert("Unable to load your sprite manager: " + err);
        }
    }, [spriteManager, scene, selectionService]);

    const saveToSnippet = useCallback(async () => {
        try {
            const content = JSON.stringify(spriteManager.serialize(true));
            const currentSnippetId = spriteManager.snippetId;

            const result = await SaveToSnippetServer({
                snippetUrl,
                currentSnippetId,
                content,
                payloadKey: "spriteManager",
                storageKey: SnippetDashboardStorageKey,
                entityName: "sprite manager",
            });

            // eslint-disable-next-line require-atomic-updates
            spriteManager.snippetId = result.snippetId;
            PersistSnippetId(SnippetDashboardStorageKey, result.snippetId);

            NotifyPlaygroundOfSnippetChange(result.oldSnippetId, result.snippetId, "SpriteManager.ParseFromSnippetAsync");
        } catch {
            // Alert already shown by SaveToSnippetServer
        }
    }, [spriteManager, snippetUrl]);

    return (
        <>
            {snippetId && <TextPropertyLine label="Snippet ID" value={snippetId} />}
            <ButtonLine label="Load from Snippet Server" onClick={loadFromSnippet} icon={CloudArrowUpRegular} />
            <ButtonLine label="Save to Snippet Server" onClick={saveToSnippet} icon={CloudArrowDownRegular} />
        </>
    );
};

export const SpriteManagerActionsProperties: FunctionComponent<{ spriteManager: SpriteManager; selectionService: ISelectionService }> = (props) => {
    const { spriteManager, selectionService } = props;

    const addNewSprite = useCallback(() => {
        const newSprite = new Sprite("new sprite", spriteManager);
        selectionService.selectedEntity = newSprite;
    }, [spriteManager, selectionService]);

    const disposeManager = useCallback(() => {
        spriteManager.dispose();
        selectionService.selectedEntity = null;
    }, [spriteManager, selectionService]);

    return (
        <>
            {spriteManager.sprites.length < spriteManager.capacity && <ButtonLine label="Add New Sprite" onClick={addNewSprite} />}
            <ButtonLine label="Dispose" onClick={disposeManager} />
        </>
    );
};
