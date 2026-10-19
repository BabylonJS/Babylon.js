import { getRenderingContextKind, getRenderingContexts, type EngineContext, type RenderingContext } from "@babylonjs/lite";

type OrderedRenderingLayer = object & {
    order: number;
};

type LayerRenderingContext<LayerT extends object> = RenderingContext & {
    readonly layers: readonly LayerT[];
};

type LayerOrderMarker = {
    order: number;
    marker: object;
};

const LayerOrderMarkers = new WeakMap<OrderedRenderingLayer, LayerOrderMarker>();

function GetLayerOrderMarker(layer: OrderedRenderingLayer): object {
    const existing = LayerOrderMarkers.get(layer);
    if (existing?.order === layer.order) {
        return existing.marker;
    }

    const marker = {};
    LayerOrderMarkers.set(layer, { order: layer.order, marker });
    return marker;
}

export function GetOrderedRenderingLayers<LayerT extends OrderedRenderingLayer>(layers: readonly LayerT[]): readonly LayerT[] {
    return layers
        .map((layer, index) => ({ layer, index }))
        .sort((left, right) => left.layer.order - right.layer.order || left.index - right.index)
        .map(({ layer }) => layer);
}

export function GetRenderingLayerSnapshot<LayerT extends OrderedRenderingLayer>(layers: readonly LayerT[]): readonly object[] {
    return layers.flatMap((layer) => [layer, GetLayerOrderMarker(layer)]);
}

export function GetRenderingLayerOwners<LayerT extends object, ContextT extends LayerRenderingContext<LayerT>>(
    engine: EngineContext,
    contextKind: string,
    layer: LayerT
): readonly ContextT[] {
    return engine.surfaces.flatMap((surface) =>
        getRenderingContexts(surface).filter(
            (context): context is ContextT => getRenderingContextKind(context) === contextKind && (context as LayerRenderingContext<LayerT>).layers.includes(layer)
        )
    );
}

export function GetRenderingLayerDisplayName<LayerT extends OrderedRenderingLayer, ContextT extends LayerRenderingContext<LayerT>>(
    engine: EngineContext,
    contextKind: string,
    layer: LayerT,
    layerTypeName: string
): string {
    const owners = GetRenderingLayerOwners<LayerT, ContextT>(engine, contextKind, layer);
    const index = owners.length === 1 ? GetOrderedRenderingLayers(owners[0].layers).indexOf(layer) : -1;
    return index === -1 ? layerTypeName : `${layerTypeName} ${index + 1}`;
}
