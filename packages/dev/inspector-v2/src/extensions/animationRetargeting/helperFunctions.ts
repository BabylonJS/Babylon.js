import { Avatars, Animations } from "./data";

let CurrentSnippetToken = "";

export function FindAvatarFromPath(path: string): string {
    for (const name in Avatars) {
        if (Avatars[name].path === path) {
            return name;
        }
    }
    return "";
}

export function FindAnimationFromPath(path: string): string {
    for (const name in Animations) {
        if (Animations[name].path === path) {
            return name;
        }
    }
    return "";
}

export function DistancePointToLine(
    point: { x: number; y: number; z: number },
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
): number {
    const opX = point.x - origin.x;
    const opY = point.y - origin.y;
    const opZ = point.z - origin.z;

    const dot = opX * direction.x + opY * direction.y + opZ * direction.z;

    const projX = direction.x * dot;
    const projY = direction.y * dot;
    const projZ = direction.z * dot;

    const diffX = opX - projX;
    const diffY = opY - projY;
    const diffZ = opZ - projZ;

    return diffX * diffX + diffY * diffY + diffZ * diffZ;
}

function PackSnippetData(code: string) {
    const v2 = {
        v: 2,
        language: "TS",
        entry: "index.ts",
        imports: {},
        files: { "index.ts": code },
    };
    const codeToSave = JSON.stringify(v2);
    const encoder = new TextEncoder();
    const buffer = encoder.encode(codeToSave);
    let testData = "";
    for (let i = 0; i < buffer.length; i++) {
        testData += String.fromCharCode(buffer[i]);
    }
    // EncodeArrayBufferToBase64 is not available as a module import easily, use btoa fallback
    const unicode = testData !== codeToSave ? btoa(testData) : undefined;
    const payload = JSON.stringify({
        code: codeToSave,
        unicode,
        engine: "WebGL2",
        version: 2,
    });
    return JSON.stringify({
        payload,
        name: "",
        description: "",
        tags: "",
    });
}

export function SaveSnippet(code: string) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) {
                const snippet = JSON.parse(xmlHttp.responseText);
                const baseUrl = location.href.replace(location.hash, "");
                let newUrl = baseUrl + "#" + snippet.id;
                newUrl = newUrl.replace("##", "#");
                CurrentSnippetToken = snippet.id;
                if (snippet.version && snippet.version !== "0") {
                    newUrl += "#" + snippet.version;
                }
                window.open(newUrl, "_blank");
            } else {
                console.error("Unable to save your code. It may be too long.");
            }
        }
    };

    xmlHttp.open("POST", "https://snippet.babylonjs.com" + (CurrentSnippetToken ? "/" + CurrentSnippetToken : ""), true);
    xmlHttp.withCredentials = false;
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(PackSnippetData(code));
}

export const TestPlaygroundCode = `
type SourceDataUpdate = Array<{ name: string; data: { position?: number[], scaling?: number[], quaternion?: number[] } }>;

const avatarRestPoseUpdate: SourceDataUpdate = %avatarRestPoseUpdate%;
const animationRestPoseUpdate: SourceDataUpdate = %animationRestPoseUpdate%;
const nameRemapping = %nameRemapping%;

class Playground {
    public static async CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): Promise<BABYLON.Scene> {
        const avatarPath = "%avatarPath%";
        const animationPath = "%animationPath%";

        const scene = new BABYLON.Scene(engine);

        scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.env", scene);

        if (avatarPath.indexOf("glb") < 0 && avatarPath.indexOf("gltf") < 0) {
            new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        }

        // Load the avatar
        const result = await BABYLON.ImportMeshAsync(avatarPath, scene);

        const avatarRootNode = result.meshes[0];
        avatarRootNode.name = "avatar";

        const numAnimations = scene.animationGroups.length;

        // Load the animation
        await BABYLON.AppendSceneAsync(animationPath, scene);

        const animRootNode = scene.getMeshByName("__root__");
        animRootNode.name = "reference";

        const sourceAnimationGroup = scene.animationGroups[numAnimations];

        scene.stopAllAnimations();

        // Create the camera
        scene.createDefaultCamera(true, true, true);

        const camera = scene.activeCamera as BABYLON.ArcRotateCamera;

        camera.alpha += Math.PI;

        // Retarget the animation and play it
        const retargetOptions: BABYLON.IRetargetOptions = %retargetOptions%;

        const retargetedAnimation = Playground._RetargetAnimation(
            sourceAnimationGroup,
            animRootNode,
            avatarRootNode,
            animationRestPoseUpdate,
            avatarRestPoseUpdate,
            nameRemapping,
            retargetOptions
        );

        retargetedAnimation.start(true);

        return scene;
    }

    private static _RetargetAnimation(
        sourceAnimationGroup: BABYLON.AnimationGroup,
        animRootNode: BABYLON.AbstractMesh,
        avatarRootNode: BABYLON.AbstractMesh,
        animationRestPoseUpdate: SourceDataUpdate,
        avatarRestPoseUpdate: SourceDataUpdate,
        nameRemapping: string[],
        retargetOptions: BABYLON.IRetargetOptions,
        disposeSource = true)
    {
        const avatar = new BABYLON.AnimatorAvatar("avatar", avatarRootNode, false);

        for (const dataBlock of animationRestPoseUpdate) {
            const node = animRootNode.getChildTransformNodes(false, (node) => node.name === dataBlock.name)[0];
            if (node) {
                if (dataBlock.data.position) node.position.fromArray(dataBlock.data.position);
                if (dataBlock.data.scaling) node.scaling.fromArray(dataBlock.data.scaling);
                if (dataBlock.data.quaternion) node.rotationQuaternion!.fromArray(dataBlock.data.quaternion);
            }
        }

        if (avatarRestPoseUpdate.length > 0) {
            const [avatarSkeleton] = avatar.skeletons;

            for (const dataBlock of avatarRestPoseUpdate) {
                const index = avatarSkeleton.getBoneIndexByName(dataBlock.name);
                if (index !== -1) {
                    const bone = avatarSkeleton.bones[index];
                    if (dataBlock.data.position) bone.position = BABYLON.TmpVectors.Vector3[0].fromArray(dataBlock.data.position);
                    if (dataBlock.data.scaling) bone.scaling = BABYLON.TmpVectors.Vector3[0].fromArray(dataBlock.data.scaling);
                    if (dataBlock.data.quaternion) bone.rotationQuaternion = BABYLON.TmpVectors.Quaternion[0].fromArray(dataBlock.data.quaternion);
                }
            }
            avatarSkeleton.setCurrentPoseAsRest();
        }

        for (const skeleton of avatar.skeletons) {
            skeleton.returnToRest();
        }

        const mapNodeNames = new Map<string, string>();
        for (let i = 0; i < nameRemapping.length; i += 2) {
            mapNodeNames.set(nameRemapping[i], nameRemapping[i + 1]);
        }

        retargetOptions.mapNodeNames = mapNodeNames;

        const retargetedAnimation = avatar.retargetAnimationGroup(sourceAnimationGroup, retargetOptions);

        avatar.dispose();

        if (disposeSource) {
            sourceAnimationGroup.dispose();
            animRootNode.dispose(false);
        }

        return retargetedAnimation;
    }
}
export { Playground };
`;
