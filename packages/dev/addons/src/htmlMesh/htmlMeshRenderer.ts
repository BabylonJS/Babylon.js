import type { Scene } from "core/scene";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math";

import type { HtmlMesh } from "./htmlMesh";
import { Camera } from "core/Cameras/camera";
import type { SubMesh } from "core/Meshes/subMesh";
import { RenderingGroup } from "core/Rendering/renderingGroup";

import type { Observer } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";
import type { AbstractEngine } from "core/Engines";

const _positionUpdateFailMessage = "Failed to update html mesh renderer position due to failure to get canvas rect.  HtmlMesh instances may not render correctly";
const babylonUnitsToPixels = 100;

/**
 * A function that compares two submeshes and returns a number indicating which
 * should be rendered first.
 */
type RenderOrderFunction = (subMeshA: SubMesh, subMeshB: SubMesh) => number;

type RenderLayerElements = {
    container: HTMLElement;
    domElement: HTMLElement;
    cameraElement: HTMLElement;
};

// Returns a function that ensures that HtmlMeshes are rendered before all other meshes.
// Note this will only be applied to group 0.
// If neither mesh is an HtmlMesh, then the default render order is used
// This prevents HtmlMeshes from appearing in front of other meshes when they are behind them
const renderOrderFunc = (defaultRenderOrder: RenderOrderFunction): RenderOrderFunction => {
    return (subMeshA: SubMesh, subMeshB: SubMesh) => {
        const meshA = subMeshA.getMesh();
        const meshB = subMeshB.getMesh();

        // Use property check instead of instanceof since it is less expensive and
        // this will be called many times per frame
        const meshAIsHtmlMesh = (meshA as any)["isHtmlMesh"];
        const meshBIsHtmlMesh = (meshB as any)["isHtmlMesh"];
        if (meshAIsHtmlMesh) {
            return meshBIsHtmlMesh ? (meshA.absolutePosition.z <= meshB.absolutePosition.z ? 1 : -1) : -1;
        } else {
            return meshBIsHtmlMesh ? 1 : defaultRenderOrder(subMeshA, subMeshB);
        }
    };
};

/**
 * An instance of this is required to render HtmlMeshes in the scene.
 * if using HtmlMeshes, you must not set render order for group 0 using
 * scene.setRenderingOrder.  You must instead pass the compare functions
 * to the HtmlMeshRenderer constructor.  If you do not, then your render
 * order will be overwritten if the HtmlMeshRenderer is created after and
 * the HtmlMeshes will not render correctly (they will appear in front of
 * meshes that are actually in front of them) if the HtmlMeshRenderer is
 * created before.
 */
export class HtmlMeshRenderer {
    private _containerId?: string;
    private _inSceneElements?: RenderLayerElements | null;
    private _overlayElements?: RenderLayerElements | null;
    private _engine: AbstractEngine;

    private _cache = {
        cameraData: { fov: 0, position: new Vector3(), style: "" },
        htmlMeshData: new WeakMap<object, { style: string }>(),
    };
    private _width = 0;
    private _height = 0;
    private _heightHalf = 0;

    private _cameraWorldMatrix?: Matrix;

    // Create some refs to avoid creating new objects every frame
    private _temp = {
        scaleTransform: new Vector3(),
        rotationTransform: new Quaternion(),
        positionTransform: new Vector3(),
        objectMatrix: Matrix.Identity(),
        cameraWorldMatrix: Matrix.Identity(),
        cameraRotationMatrix: Matrix.Identity(),
        cameraWorldMatrixAsArray: new Array(16),
    };

    // Keep track of DPR so we can resize if DPR changes
    // Otherwise the DOM content will scale, but the mesh won't
    private _lastDevicePixelRatio = window.devicePixelRatio;

    // Keep track of camera matrix changes so we only update the
    // DOM element styles when necessary
    private _cameraMatrixUpdated = true;

    // Keep track of position changes so we only update the DOM element
    // styles when necessary
    private _previousCanvasDocumentPosition = {
        top: 0,
        left: 0,
    };

    private _renderObserver: Observer<Scene> | null = null;

    /**
     * Contruct an instance of HtmlMeshRenderer
     * @param scene
     * @param options object containing the following optional properties:
     * @returns
     */
    constructor(
        scene: Scene,
        {
            parentContainerId = null,
            _containerId = "css-container",
            enableOverlayRender = true,
            defaultOpaqueRenderOrder = RenderingGroup.PainterSortCompare,
            defaultAlphaTestRenderOrder = RenderingGroup.PainterSortCompare,
            defaultTransparentRenderOrder = RenderingGroup.defaultTransparentSortCompare,
        }: {
            parentContainerId?: string | null;
            _containerId?: string;
            defaultOpaqueRenderOrder?: RenderOrderFunction;
            defaultAlphaTestRenderOrder?: RenderOrderFunction;
            defaultTransparentRenderOrder?: RenderOrderFunction;
            enableOverlayRender?: boolean;
        } = {}
    ) {
        // Requires a browser to work.  Only init if we are in a browser
        if (typeof document === "undefined") {
            return;
        }
        this._containerId = _containerId;
        this._init(scene, parentContainerId, enableOverlayRender, defaultOpaqueRenderOrder, defaultAlphaTestRenderOrder, defaultTransparentRenderOrder);
    }

    /**
     * Dispose of the HtmlMeshRenderer
     */
    public dispose() {
        if (this._renderObserver) {
            this._renderObserver.remove();
            this._renderObserver = null;
        }

        this._overlayElements?.container.remove();
        this._overlayElements = null;

        this._inSceneElements?.container.remove();
        this._inSceneElements = null;
    }

    protected _init(
        scene: Scene,
        parentContainerId: string | null,
        enableOverlayRender: boolean,
        defaultOpaqueRenderOrder: RenderOrderFunction,
        defaultAlphaTestRenderOrder: RenderOrderFunction,
        defaultTransparentRenderOrder: RenderOrderFunction
    ): void {
        // Requires a browser to work.  Only init if we are in a browser
        if (typeof document === "undefined") {
            return;
        }

        // Create the DOM containers
        let parentContainer = parentContainerId ? document.getElementById(parentContainerId) : document.body;

        if (!parentContainer) {
            parentContainer = document.body;
        }

        // if the container already exists, then remove it
        const inSceneContainerId = `${this._containerId}_in_scene`;
        this._inSceneElements = this._createRenderLayerElements(inSceneContainerId);

        parentContainer.insertBefore(this._inSceneElements.container, parentContainer.firstChild);

        if (enableOverlayRender) {
            const overlayContainerId = `${this._containerId}_overlay`;
            this._overlayElements = this._createRenderLayerElements(overlayContainerId);
            const zIndex = +(scene.getEngine().getRenderingCanvas()!.style.zIndex ?? "0") + 1;
            this._overlayElements.container.style.zIndex = `${zIndex}`;
            this._overlayElements.container.style.pointerEvents = "none";
            parentContainer.insertBefore(this._overlayElements.container, parentContainer.firstChild);
        }
        this._engine = scene.getEngine();
        const clientRect = this._engine.getRenderingCanvasClientRect();
        if (!clientRect) {
            throw new Error("Failed to get client rect for rendering canvas");
        }

        // Set the size and resize behavior
        this._setSize(clientRect.width, clientRect.height);

        this._engine.onResizeObservable.add(() => {
            const clientRect = this._engine.getRenderingCanvasClientRect();
            if (clientRect) {
                this._setSize(clientRect.width, clientRect.height);
            }
        });

        let projectionObs: Observer<Camera>;
        let matrixObs: Observer<Camera>;

        const observeCamera = () => {
            const camera = scene.activeCamera;
            if (camera) {
                projectionObs = camera.onProjectionMatrixChangedObservable.add(() => {
                    this._onCameraMatrixChanged(camera);
                });
                matrixObs = camera.onViewMatrixChangedObservable.add(() => {
                    this._onCameraMatrixChanged(camera);
                });
            }
        };

        observeCamera();

        scene.onActiveCameraChanged.add(() => {
            if (projectionObs) {
                scene.activeCamera?.onProjectionMatrixChangedObservable.remove(projectionObs);
            }
            if (matrixObs) {
                scene.activeCamera?.onViewMatrixChangedObservable.remove(matrixObs);
            }
            observeCamera();
        });

        // We need to make sure that HtmlMeshes are rendered before all other meshes
        // so that they don't appear in front of meshes that are actually in front of them
        // Updating the render order isn't ideal, but it is the only way to acheive this
        // The implication is that an app using the HtmlMeshRendered must set the scene render order
        // via the HtmlMeshRendered constructor
        const opaqueRenderOrder = renderOrderFunc(defaultOpaqueRenderOrder);
        const alphaTestRenderOrder = renderOrderFunc(defaultAlphaTestRenderOrder);
        const transparentRenderOrder = renderOrderFunc(defaultTransparentRenderOrder);
        scene.setRenderingOrder(0, opaqueRenderOrder, alphaTestRenderOrder, transparentRenderOrder);

        this._renderObserver = scene.onBeforeRenderObservable.add(() => {
            this._render(scene, scene.activeCamera as Camera);
        });
    }

    private _createRenderLayerElements(containerId: string): RenderLayerElements {
        const existingContainer = document.getElementById(containerId);
        if (existingContainer) {
            existingContainer.remove();
        }
        const container = document.createElement("div");
        container.id = containerId;
        container.style.position = "absolute";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.zIndex = "-1";

        const domElement = document.createElement("div");
        domElement.style.overflow = "hidden";

        const cameraElement = document.createElement("div");

        cameraElement.style.webkitTransformStyle = "preserve-3d";
        cameraElement.style.transformStyle = "preserve-3d";

        cameraElement.style.pointerEvents = "none";

        domElement.appendChild(cameraElement);
        container.appendChild(domElement);
        return {
            container,
            domElement,
            cameraElement,
        };
    }

    protected _getSize(): { width: number; height: number } {
        return {
            width: this._width,
            height: this._height,
        };
    }

    protected _setSize(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this._heightHalf = this._height / 2;

        if (!this._inSceneElements || !this._overlayElements) {
            return;
        }

        const domElements = [this._inSceneElements!.domElement, this._overlayElements!.domElement, this._inSceneElements!.cameraElement, this._overlayElements!.cameraElement];
        for (const dom of domElements) {
            if (dom) {
                dom.style.width = `${width}px`;
                dom.style.height = `${height}px`;
            }
        }
    }

    // prettier-ignore
    protected _getCameraCSSMatrix(matrix: Matrix): string {
        const elements = matrix.m;
        return `matrix3d(${
            this._epsilon( elements[0] )
        },${
            this._epsilon( - elements[1] )
        },${
            this._epsilon( elements[2] )
        },${
            this._epsilon( elements[3] )
        },${
            this._epsilon( elements[4] )
        },${
            this._epsilon( - elements[5] )
        },${
            this._epsilon( elements[6] )
        },${
            this._epsilon( elements[7] )
        },${
            this._epsilon( elements[8] )
        },${
            this._epsilon( - elements[9] )
        },${
            this._epsilon( elements[10] )
        },${
            this._epsilon( elements[11] )
        },${
            this._epsilon( elements[12] )
        },${
            this._epsilon( - elements[13] )
        },${
            this._epsilon( elements[14] )
        },${
            this._epsilon( elements[15] )
        })`;
    }

    // Convert a Babylon world matrix to a CSS matrix
    // This also handles conversion from BJS left handed coords
    // to CSS right handed coords
    // prettier-ignore
    protected _getHtmlContentCSSMatrix(matrix: Matrix, useRightHandedSystem: boolean): string {
        const elements = matrix.m;
        // In a right handed coordinate system, the elements 11 to 14 have to change their direction
        const direction = useRightHandedSystem ? -1 : 1;
        const matrix3d = `matrix3d(${
            this._epsilon( elements[0] )
        },${
            this._epsilon( elements[1] )
        },${
            this._epsilon( elements[2] * -direction )
        },${
            this._epsilon( elements[3] )
        },${
            this._epsilon( - elements[4] )
        },${
            this._epsilon( - elements[5] )
        },${
            this._epsilon( elements[6]  * direction )
        },${
            this._epsilon( - elements[7] )
        },${
            this._epsilon( elements[8] * -direction )
        },${
            this._epsilon( elements[9] * -direction )
        },${
            this._epsilon( elements[10] )
        },${
            this._epsilon( elements[11] * direction )
        },${
            this._epsilon( elements[12] * direction )
        },${
            this._epsilon( elements[13] * direction )
        },${
            this._epsilon( elements[14] * direction )
        },${
            this._epsilon( elements[15] )
        })`;
        return matrix3d;
    }

    protected _getTransformationMatrix(htmlMesh: HtmlMesh, useRightHandedSystem: boolean): Matrix {
        // Get the camera world matrix
        // Make sure the camera world matrix is up to date
        if (!this._cameraWorldMatrix) {
            this._cameraWorldMatrix = htmlMesh.getScene().activeCamera?.getWorldMatrix();
        }
        if (!this._cameraWorldMatrix) {
            return Matrix.Identity();
        }

        const objectWorldMatrix = htmlMesh.getWorldMatrix();

        // Scale the object matrix by the base scale factor for the mesh
        // which is the ratio of the mesh width/height to the renderer
        // width/height divided by the babylon units to pixels ratio
        let widthScaleFactor = 1;
        let heightScaleFactor = 1;
        if (htmlMesh.sourceWidth && htmlMesh.sourceHeight) {
            widthScaleFactor = htmlMesh.width! / (htmlMesh.sourceWidth / babylonUnitsToPixels);
            heightScaleFactor = htmlMesh.height! / (htmlMesh.sourceHeight / babylonUnitsToPixels);
        }

        // Apply the scale to the object's world matrix.  Note we aren't scaling
        // the object, just getting a matrix as though it were scaled, so we can
        // scale the content
        const scaleTransform = this._temp.scaleTransform;
        const rotationTransform = this._temp.rotationTransform;
        const positionTransform = this._temp.positionTransform;
        const scaledAndTranslatedObjectMatrix = this._temp.objectMatrix;

        objectWorldMatrix.decompose(scaleTransform, rotationTransform, positionTransform);
        scaleTransform.x *= widthScaleFactor;
        scaleTransform.y *= heightScaleFactor;

        Matrix.ComposeToRef(scaleTransform, rotationTransform, positionTransform, scaledAndTranslatedObjectMatrix);

        // Adjust direction of 12 and 13 of the transformation matrix based on the handedness of the system
        const direction = useRightHandedSystem ? -1 : 1;
        // Adjust translation values to be from camera vs world origin
        // Note that we are also adjusting these values to be pixels vs Babylon units
        const position = htmlMesh.getAbsolutePosition();
        scaledAndTranslatedObjectMatrix.setRowFromFloats(
            3,
            (-this._cameraWorldMatrix.m[12] + position.x) * babylonUnitsToPixels * direction,
            (-this._cameraWorldMatrix.m[13] + position.y) * babylonUnitsToPixels * direction,
            (this._cameraWorldMatrix.m[14] - position.z) * babylonUnitsToPixels,
            this._cameraWorldMatrix.m[15] * 0.00001 * babylonUnitsToPixels
        );

        // Adjust other values to be pixels vs Babylon units
        scaledAndTranslatedObjectMatrix.multiplyAtIndex(3, babylonUnitsToPixels);
        scaledAndTranslatedObjectMatrix.multiplyAtIndex(7, babylonUnitsToPixels);
        scaledAndTranslatedObjectMatrix.multiplyAtIndex(11, babylonUnitsToPixels);

        return scaledAndTranslatedObjectMatrix;
    }

    protected _renderHtmlMesh(htmlMesh: HtmlMesh, useRightHandedSystem: boolean) {
        if (!htmlMesh.element || !htmlMesh.element.firstElementChild) {
            // nothing to render, so bail
            return;
        }

        // We need to ensure html mesh data is initialized before
        // computing the base scale factor
        let htmlMeshData = this._cache.htmlMeshData.get(htmlMesh);
        if (!htmlMeshData) {
            htmlMeshData = { style: "" };
            this._cache.htmlMeshData.set(htmlMesh, htmlMeshData);
        }

        const cameraElement = htmlMesh._isCanvasOverlay ? this._overlayElements?.cameraElement : this._inSceneElements?.cameraElement;

        if (htmlMesh.element.parentNode !== cameraElement) {
            cameraElement!.appendChild(htmlMesh.element);
        }

        // If the htmlMesh content has changed, update the base scale factor
        if (htmlMesh.requiresUpdate) {
            this._updateBaseScaleFactor(htmlMesh);
        }

        // Get the transformation matrix for the html mesh
        const scaledAndTranslatedObjectMatrix = this._getTransformationMatrix(htmlMesh, useRightHandedSystem);

        let style = `translate(-50%, -50%) ${this._getHtmlContentCSSMatrix(scaledAndTranslatedObjectMatrix, useRightHandedSystem)}`;
        // In a right handed system, screens are on the wrong side of the mesh, so we have to rotate by Math.PI which results in the matrix3d seen below
        style += `${useRightHandedSystem ? "matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)" : ""}`;

        if (htmlMeshData.style !== style) {
            htmlMesh.element.style.webkitTransform = style;
            htmlMesh.element.style.transform = style;
        }

        htmlMesh._markAsUpdated();
    }

    protected _render(scene: Scene, camera: Camera) {
        let needsUpdate = false;

        const useRightHandedSystem = scene.useRightHandedSystem;

        // Update the container position and size if necessary
        this._updateContainerPositionIfNeeded();

        // Check for a camera change
        if (this._cameraMatrixUpdated) {
            this._cameraMatrixUpdated = false;
            needsUpdate = true;
        }

        // If the camera position has changed, then we also need to update
        if (
            camera.position.x !== this._cache.cameraData.position.x ||
            camera.position.y !== this._cache.cameraData.position.y ||
            camera.position.z !== this._cache.cameraData.position.z
        ) {
            this._cache.cameraData.position.copyFrom(camera.position);
            needsUpdate = true;
        }

        // Check for a dpr change
        if (window.devicePixelRatio !== this._lastDevicePixelRatio) {
            this._lastDevicePixelRatio = window.devicePixelRatio;
            Logger.Log("In render - dpr changed: ", this._lastDevicePixelRatio);
            needsUpdate = true;
        }

        // Check if any meshes need to be updated
        const meshesNeedingUpdate = scene.meshes.filter((mesh) => (mesh as any)["isHtmlMesh"] && (needsUpdate || (mesh as HtmlMesh).requiresUpdate));
        needsUpdate = needsUpdate || meshesNeedingUpdate.length > 0;

        if (!needsUpdate) {
            return;
        }

        // Get a projection matrix for the camera
        const projectionMatrix = camera.getProjectionMatrix();
        const fov = projectionMatrix.m[5] * this._heightHalf;

        if (this._cache.cameraData.fov !== fov) {
            const source = [this._overlayElements?.domElement, this._inSceneElements?.domElement];
            if (camera.mode == Camera.PERSPECTIVE_CAMERA) {
                for (const el of source) {
                    if (el) {
                        el.style.webkitPerspective = fov + "px";
                        el.style.perspective = fov + "px";
                    }
                }
            } else {
                for (const el of source) {
                    if (el) {
                        el.style.webkitPerspective = "";
                        el.style.perspective = "";
                    }
                }
            }
            this._cache.cameraData.fov = fov;
        }

        // Get the CSS matrix for the camera (which will include any camera rotation)
        if (camera.parent === null) {
            camera.computeWorldMatrix();
        }

        const cameraMatrixWorld = this._temp.cameraWorldMatrix;
        cameraMatrixWorld.copyFrom(camera.getWorldMatrix());
        const cameraRotationMatrix = this._temp.cameraRotationMatrix;
        cameraMatrixWorld.getRotationMatrix().transposeToRef(cameraRotationMatrix);

        const cameraMatrixWorldAsArray = this._temp.cameraWorldMatrixAsArray;
        cameraMatrixWorld.copyToArray(cameraMatrixWorldAsArray);

        // For a few values, we have to adjust the direction based on the handedness of the system
        const direction = useRightHandedSystem ? 1 : -1;

        cameraMatrixWorldAsArray[1] = cameraRotationMatrix.m[1];
        cameraMatrixWorldAsArray[2] = cameraRotationMatrix.m[2] * direction;
        cameraMatrixWorldAsArray[4] = cameraRotationMatrix.m[4] * direction;
        cameraMatrixWorldAsArray[6] = cameraRotationMatrix.m[6] * direction;
        cameraMatrixWorldAsArray[8] = cameraRotationMatrix.m[8] * direction;
        cameraMatrixWorldAsArray[9] = cameraRotationMatrix.m[9] * direction;

        Matrix.FromArrayToRef(cameraMatrixWorldAsArray, 0, cameraMatrixWorld);

        const cameraCSSMatrix = this._getCameraCSSMatrix(cameraMatrixWorld);
        const style = cameraCSSMatrix;

        if (this._cache.cameraData.style !== style) {
            const source = [this._inSceneElements?.cameraElement, this._overlayElements?.cameraElement];
            for (const el of source) {
                if (el) {
                    el.style.webkitTransform = style;
                    el.style.transform = style;
                }
            }
            this._cache.cameraData.style = style;
        }

        // _Render objects if necessary
        for (const mesh of meshesNeedingUpdate) {
            this._renderHtmlMesh(mesh as HtmlMesh, useRightHandedSystem);
        }
    }

    protected _updateBaseScaleFactor(htmlMesh: HtmlMesh) {
        // Get screen width and height
        let screenWidth = this._width;
        let screenHeight = this._height;

        // Calculate aspect ratios
        const htmlMeshAspectRatio = (htmlMesh.width || 1) / (htmlMesh.height || 1);
        const screenAspectRatio = screenWidth / screenHeight;

        // Adjust screen dimensions based on aspect ratios
        if (htmlMeshAspectRatio > screenAspectRatio) {
            // If the HTML mesh is wider relative to its height than the screen, adjust the screen width
            screenWidth = screenHeight * htmlMeshAspectRatio;
        } else {
            // If the HTML mesh is taller relative to its width than the screen, adjust the screen height
            screenHeight = screenWidth / htmlMeshAspectRatio;
        }

        // Set content to fill screen so we get max resolution when it is shrunk to fit the mesh
        htmlMesh.setContentSizePx(screenWidth, screenHeight);
    }

    protected _updateContainerPositionIfNeeded() {
        // Determine if the canvas has moved on the screen
        const canvasRect = this._engine.getRenderingCanvasClientRect();

        // canvas rect may be null if layout not complete
        if (!canvasRect) {
            Logger.Warn(_positionUpdateFailMessage);
            return;
        }
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;
        const canvasDocumentTop = canvasRect.top + scrollTop;
        const canvasDocumentLeft = canvasRect.left + scrollLeft;

        if (this._previousCanvasDocumentPosition.top !== canvasDocumentTop || this._previousCanvasDocumentPosition.left !== canvasDocumentLeft) {
            this._previousCanvasDocumentPosition.top = canvasDocumentTop;
            this._previousCanvasDocumentPosition.left = canvasDocumentLeft;

            const source = [this._inSceneElements?.container, this._overlayElements?.container];
            for (const container of source) {
                if (!container) {
                    return;
                }
                // set the top and left of the css container to match the canvas
                const containerParent = container.offsetParent as HTMLElement;
                const parentRect = containerParent.getBoundingClientRect();
                const parentDocumentTop = parentRect.top + scrollTop;
                const parentDocumentLeft = parentRect.left + scrollLeft;

                const ancestorMarginsAndPadding = this._getAncestorMarginsAndPadding(containerParent);

                // Add the body margin
                const bodyStyle = window.getComputedStyle(document.body);
                const bodyMarginTop = parseInt(bodyStyle.marginTop, 10);
                const bodyMarginLeft = parseInt(bodyStyle.marginLeft, 10);

                container.style.top = `${canvasDocumentTop - parentDocumentTop - ancestorMarginsAndPadding.marginTop + ancestorMarginsAndPadding.paddingTop + bodyMarginTop}px`;
                container.style.left = `${
                    canvasDocumentLeft - parentDocumentLeft - ancestorMarginsAndPadding.marginLeft + ancestorMarginsAndPadding.paddingLeft + bodyMarginLeft
                }px`;
            }
        }
    }

    protected _onCameraMatrixChanged = (camera: Camera) => {
        this._cameraWorldMatrix = camera.getWorldMatrix();
        this._cameraMatrixUpdated = true;
    };

    private _epsilon(value: number) {
        return Math.abs(value) < 1e-10 ? 0 : value;
    }

    // Get total margins and padding for an element, excluding the body and document margins
    private _getAncestorMarginsAndPadding(element: HTMLElement) {
        let marginTop = 0;
        let marginLeft = 0;
        let paddingTop = 0;
        let paddingLeft = 0;

        while (element && element !== document.body && element !== document.documentElement) {
            const style = window.getComputedStyle(element);
            marginTop += parseInt(style.marginTop, 10);
            marginLeft += parseInt(style.marginLeft, 10);
            paddingTop += parseInt(style.paddingTop, 10);
            paddingLeft += parseInt(style.paddingLeft, 10);
            element = element.offsetParent as HTMLElement;
        }

        return { marginTop, marginLeft, paddingTop, paddingLeft };
    }
}
