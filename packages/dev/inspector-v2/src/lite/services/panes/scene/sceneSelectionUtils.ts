import { GetSceneContexts, GetSceneNodeRoots, IsSceneNode, IsSceneNodeDescendantOf } from "../../../sceneEntityUtils";
import { type IEngineContext } from "../../../engineContext";
import { type ISelectionService } from "../../../../services/selectionService";

export function ClearRemovedSelection(selectionService: ISelectionService, engineContext: IEngineContext, selectionWasRemoved: boolean): void {
    const selectedEntity = selectionService.selectedEntity;
    if (
        selectionWasRemoved &&
        !GetSceneContexts(engineContext.engine).some((scene) =>
            GetSceneNodeRoots(scene).some((root) => root === selectedEntity || (IsSceneNode(selectedEntity) && IsSceneNodeDescendantOf(selectedEntity, root)))
        )
    ) {
        selectionService.selectedEntity = null;
    }
}
