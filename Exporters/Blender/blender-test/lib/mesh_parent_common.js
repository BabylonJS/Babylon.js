/**
 *  central location for mesh_parent script, called by mesh_parent_JSON.html & mesh_parent_inline.html 
 */
var breadMan;
var ground;
var meshes;
var delta = new BABYLON.Vector3(0, 0, -.1);
var running = true;
var parenting = true;
definedFacingForward = true;
        
function animate(scene){
	if (!breadMan) breadMan = scene.getMeshByID("Gus");
	if (!ground  ) ground   = scene.getMeshByID("Ground");
	if (!meshes  ) meshes   = scene.meshes;
	
	if (running){
		breadMan.rotation.y += 0.02;
	    breadMan.rotation.z += 0.02;
	    movePOV(0, 0, 0.1);
	}        	
}
/**  "Borrowed" from Automaton
 * Perform relative position change from the the point of view of behind the front of the mesh.
 * This is performed taking into account the meshes current rotation, so you do not have to care.
 * @param {number} amountRight
 * @param {number} amountUp
 * @param {number} amountForward
 */
 function movePOV(amountRight, amountUp, amountForward) {
     var rotMatrix = new BABYLON.Matrix();
     var rotQuaternion = (breadMan.rotationQuaternion) ? breadMan.rotationQuaternion : BABYLON.Quaternion.RotationYawPitchRoll(breadMan.rotation.y, breadMan.rotation.x, breadMan.rotation.z);
     rotQuaternion.toRotationMatrix(rotMatrix);
     
     var translationDelta = BABYLON.Vector3.Zero();
     var defForwardMult = definedFacingForward ? -1 : 1;
     BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
     breadMan.position.addInPlace(translationDelta);
 };
 
 function pausePlay() {
 	running = !running;
 }
 
 function orphanConceive() {
	 parenting = !parenting;
     for (index = 0; index < meshes.length; index++) {
         var mesh = meshes[index];
         if (mesh === breadMan || mesh === ground) continue;
         mesh.parent = parenting ? breadMan : null;
     }
 }