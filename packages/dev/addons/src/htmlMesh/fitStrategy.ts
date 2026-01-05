export type FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement;
    updateSize(sizingElement: HTMLElement, width: number, height: number): void;
};

const FitStrategyContain: FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement: HTMLElement, width: number, height: number) {
        const scalingElement = sizingElement.firstElementChild! as HTMLElement;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;

        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        const scale = Math.min(width / childWidth, height / childHeight);
        scalingElement.style.transform = `scale(${scale})`;
        scalingElement.style.visibility = "visible";
    },
};

const FitStrategyCover: FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        sizingElement.style.overflow = "hidden";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement: HTMLElement, width: number, height: number) {
        const scalingElement = sizingElement.firstElementChild! as HTMLElement;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;

        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        const scale = Math.max(width / childWidth, height / childHeight);
        scalingElement.style.transform = `scale(${scale})`;
        scalingElement.style.visibility = "visible";
    },
};

const FitStrategyStretch: FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement: HTMLElement, width: number, height: number) {
        const scalingElement = sizingElement.firstElementChild! as HTMLElement;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;

        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        scalingElement.style.transform = `scale(${width / childWidth}, ${height / childHeight})`;
        scalingElement.style.visibility = "visible";
    },
};

const FitStrategyNone: FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement {
        return element;
    },
    updateSize(sizingElement: HTMLElement, width: number, height: number) {
        if (sizingElement) {
            sizingElement.style.width = `${width}px`;
            sizingElement.style.height = `${height}px`;
        }
    },
};

export const FitStrategy = {
    CONTAIN: FitStrategyContain,
    COVER: FitStrategyCover,
    STRETCH: FitStrategyStretch,
    NONE: FitStrategyNone,
};
