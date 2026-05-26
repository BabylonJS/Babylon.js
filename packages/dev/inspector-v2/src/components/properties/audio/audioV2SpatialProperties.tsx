import { type FunctionComponent } from "react";

import { type AbstractSoundSource } from "core/AudioV2/abstractAudio/abstractSoundSource";
import { type ISelectionService } from "../../../services/selectionService";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

/**
 * Spatial-audio property line that shows the scene node a v2 sound or sound source is attached to,
 * with a clickable link to navigate to that node in the inspector.
 * @returns The rendered property line.
 */
export const AudioV2SpatialAttachmentProperties: FunctionComponent<{ source: AbstractSoundSource; selectionService: ISelectionService }> = ({ source, selectionService }) => {
    // Intercept attach/detach on this instance's spatial sub-property so the link refreshes when attachment changes.
    const onAttach = useInterceptObservable("function", source.spatial, "attach");
    const onDetach = useInterceptObservable("function", source.spatial, "detach");

    const attachedNode = useObservableState(() => source.spatial.attachedNode, onAttach, onDetach);

    return (
        <LinkToEntityPropertyLine
            label="Attached Node"
            description="The scene node this sound is attached to via spatial audio."
            entity={attachedNode}
            selectionService={selectionService}
        />
    );
};
