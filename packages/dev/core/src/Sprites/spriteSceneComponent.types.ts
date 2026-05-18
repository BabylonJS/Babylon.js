import { type Observable, type IReadonlyObservable } from "../Misc/observable";
import { type Ray } from "../Culling/ray.core";
import { type PickingInfo } from "../Collisions/pickingInfo";
import { type Nullable } from "../types";
import { type Sprite } from "./sprite";
import { type ISpriteManager } from "./spriteManager";
import { type Camera } from "../Cameras/camera";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _pointerOverSprite: Nullable<Sprite>;

        /** @internal */
        _pickedDownSprite: Nullable<Sprite>;

        /** @internal */
        _tempSpritePickingRay: Nullable<Ray>;

        /**
         * All of the sprite managers added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/sprites
         */
        spriteManagers?: Array<ISpriteManager>;

        /**
         * An event triggered when a sprite manager is added to the scene
         */
        readonly onNewSpriteManagerAddedObservable: IReadonlyObservable<ISpriteManager>;

        /**
         * An event triggered when a sprite manager is removed from the scene
         */
        readonly onSpriteManagerRemovedObservable: IReadonlyObservable<ISpriteManager>;

        /**
         * An event triggered when sprites rendering is about to start
         * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
         */
        onBeforeSpritesRenderingObservable: Observable<Scene>;

        /**
         * An event triggered when sprites rendering is done
         * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
         */
        onAfterSpritesRenderingObservable: Observable<Scene>;

        /** @internal */
        _internalPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck defines if the first intersection will be used (and not the closest)
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** Use the given ray to pick a sprite in the scene
         * @param ray The ray (in world space) to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck defines if the first intersection will be used (and not the closest)
         * @param camera camera to use. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        pickSpriteWithRay(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** @internal */
        _internalMultiPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /** Launch a ray to try to pick sprites in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo array
         */
        multiPickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /** Use the given ray to pick sprites in the scene
         * @param ray The ray (in world space) to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param camera camera to use. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo array
         */
        multiPickSpriteWithRay(ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /**
         * Force the sprite under the pointer
         * @param sprite defines the sprite to use
         */
        setPointerOverSprite(sprite: Nullable<Sprite>): void;

        /**
         * Gets the sprite under the pointer
         * @returns a Sprite or null if no sprite is under the pointer
         */
        getPointerOverSprite(): Nullable<Sprite>;
    }
}
