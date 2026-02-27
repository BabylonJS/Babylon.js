import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";
import { SpriteManager } from "core/Sprites/spriteManager";

type SpriteManagersContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

/**
 * Sprite Managers content component
 * @param props - Component props
 * @returns React component
 */
export const SpriteManagersContent: FunctionComponent<SpriteManagersContentProps> = ({ scene, selectionService }) => {
    // Sprite Manager state
    const [spriteManagerName, setSpriteManagerName] = useState("Sprite Manager");
    const [spriteManagerCapacity, setSpriteManagerCapacity] = useState(500);
    const [spriteManagerCellSize, setSpriteManagerCellSize] = useState(64);
    const [spriteManagerTextureUrl, setSpriteManagerTextureUrl] = useState("https://assets.babylonjs.com/textures/player.png");

    const createSpriteManager = () => {
        return new SpriteManager(spriteManagerName, spriteManagerTextureUrl, spriteManagerCapacity, spriteManagerCellSize, scene);
    };

    return (
        <QuickCreateSection>
            {/* Sprite Manager */}
            <QuickCreateItem selectionService={selectionService} label="Sprite Manager" onCreate={() => createSpriteManager()}>
                <TextInputPropertyLine label="Name" value={spriteManagerName} onChange={(value) => setSpriteManagerName(value)} />
                <TextInputPropertyLine label="Texture URL" value={spriteManagerTextureUrl} onChange={(value) => setSpriteManagerTextureUrl(value)} />
                <SpinButtonPropertyLine label="Capacity" value={spriteManagerCapacity} onChange={(value) => setSpriteManagerCapacity(value)} min={1} max={10000} step={100} />
                <SpinButtonPropertyLine label="Cell Size" value={spriteManagerCellSize} onChange={(value) => setSpriteManagerCellSize(value)} min={1} max={1024} step={1} />
            </QuickCreateItem>
        </QuickCreateSection>
    );
};
