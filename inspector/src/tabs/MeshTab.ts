/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module INSPECTOR {

    export class MeshTab extends PropertyTab {

        constructor(tabbar: TabBar, inspector: Inspector) {
            super(tabbar, 'Mesh', inspector);
        }

        /* Overrides super */
        protected _getTree(): Array<TreeItem> {
            let arr = new Array<TreeItem>();
            // Tab containing mesh already in results
            let alreadyIn = new Array<BABYLON.Node>();

            // Recursive method building the tree panel
            let createNode = (obj: BABYLON.Node) => {
                let descendants = obj.getDescendants(true);

                let node = new TreeItem(this, new MeshAdapter(obj));

                if (descendants.length > 0) {
                    for (let child of descendants) {
                        if (child instanceof BABYLON.TransformNode) {
                            if (!Helpers.IsSystemName(child.name)) {
                                let n = createNode(child);
                                node.add(n);
                            }
                        }
                    }
                    node.update();
                }

                // Retrieve the root node if the mesh is actually child of another mesh
                // This can hapen if the child mesh has been created before the parent mesh
                if (obj.parent != null && alreadyIn.indexOf(obj) != -1) {
                    let i: number = 0;
                    let notFound: boolean = true;
                    // Find and delete the root node standing for this mesh
                    while (i < arr.length && notFound) {
                        if (obj.name === arr[i].id) {
                            arr.splice(i, 1);
                            notFound = false;
                        }
                        i++;
                    }
                }

                alreadyIn.push(obj);
                return node;
            };

            // get all meshes from the first scene
            let instances = this._inspector.scene;

            // Find top of hierarchy for meshes...
            let meshWithoutAnyParent: Array<BABYLON.Node> = [];
            for (let mesh of instances.meshes) {
                // Not already in the array, not system name and no parent
                if (meshWithoutAnyParent.indexOf(mesh) == -1 && !Helpers.IsSystemName(mesh.name) && !mesh.parent) {
                    meshWithoutAnyParent.push(mesh);
                }
            }
            // ... and for transforms
            for (let tn of instances.transformNodes) {
                // Not already in the array, not system name and no parent
                if (meshWithoutAnyParent.indexOf(tn) == -1 && !Helpers.IsSystemName(tn.name) && !tn.parent) {
                    meshWithoutAnyParent.push(tn);
                }
            }

            for (let mesh of meshWithoutAnyParent) {
                if (alreadyIn.indexOf(mesh) == -1 && !Helpers.IsSystemName(mesh.name)) {
                    let node = createNode(mesh);
                    arr.push(node);
                }
            }
            return arr;
        }
    }

}