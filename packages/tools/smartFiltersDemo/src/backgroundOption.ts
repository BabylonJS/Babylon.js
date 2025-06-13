import type { Nullable } from "@babylonjs/core/types";

const BackgroundStorageKey = "Background";
const DefaultBackground = "grid";

export function hookupBackgroundOption(): void {
    const contentDiv = document.getElementById("demoContent")! as unknown as HTMLDivElement;
    const backgroundSelect = document.getElementById("backgroundSelect") as HTMLSelectElement;

    const currentBackground = localStorage.getItem(BackgroundStorageKey) || DefaultBackground;
    applyBackground(contentDiv, currentBackground);
    backgroundSelect.value = currentBackground;

    backgroundSelect.addEventListener("change", () => {
        localStorage.setItem(BackgroundStorageKey, backgroundSelect.value);
        applyBackground(contentDiv, backgroundSelect.value);
    });
}

function applyBackground(element: HTMLDivElement, background: Nullable<string>): void {
    if (background === null || background === "grid") {
        element.classList.add("gridBackground");
        element.style.backgroundColor = "unset";
    } else {
        element.classList.remove("gridBackground");
        element.style.backgroundColor = background;
    }
}
