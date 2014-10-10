/**
 *  central location for automaton script, called by automaton_JSON.html & automaton_inline.html 
 */
var scene; // for later camera jiggle in reset
var cloth;
var originalPos;
var originalRot;
var inAnim = false;

// a custom non-linear Pace   completionRatios    durationRatios
var hiccup = new BABYLON.Pace([.1, .8, .6, 1.0],[.25, .6, .8, 1.0]);

// The creation of Deformations & Event Series need only be done once; requires no actual mesh; queue as often as you wish to run
/**
 * Deformation is a sub-class of ReferenceDeformation, where the referenceStateName is Fixed to "BASIS"
 * @param {string} shapeKeyGroupName -  Used by Automaton to place in the correct ShapeKeyGroup queue(s).
 * @param {string} endStateName - Name of state key to deform to
 * @param {number} milliDuration - The number of milli seconds the deformation is to be completed in
 * @param {number} millisBefore - Fixed wait period, once a syncPartner (if any) is also ready (default 0)
 * @param {number} endStateRatio - ratio of the end state to be obtained from reference state: -1 (mirror) to 1 (default 1)
 * @param {Vector3} movePOV - Mesh movement relative to its current position/rotation to be performed at the same time (default null)
 *                  right-up-forward
 * @param {Vector3} rotatePOV - Incremental Mesh rotation to be performed at the same time (default null)
 *                  flipBack-twirlClockwise-tiltRight
 * @param {Pace} pace - Any Object with the function: getCompletionMilestone(currentDurationRatio) (default Pace.LINEAR)
 */
//                                          Shape                                end-                                     flip back -
//                                          Key                     dur-         state                                    twirl clockwise -
//                                          Group          State    ation  wait  ratio  right-up-forward                  tilt right                        pace
 var stretching  = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  900, 500,   0.9), 
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED", 1500,   0,  -0.1, null                             , null                            , hiccup) 
                   ];//  illustrates the millisBefore parameter & the non-linear pace
 
 var hardFlap    = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  800,   0,   0.1),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  300,   0,  -0.2, new BABYLON.Vector3( 0,   2,  0))  
                   ];// when your horizontal, up is really up; not all deformations need the same movePOV
 
 var away        = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  200,   0,   0.3, new BABYLON.Vector3( 0, 1.5, 3.3)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  400,   0,  -0.2, new BABYLON.Vector3( 0, 1.5, 6.7)),
                   ];// climbing forward; series repeat acceleration applied when queued to avoid jerk start
                     // forward velocity: (3.3 + 6.7) / (200 + 400) = 0.016666 units / milli
 
 var bankRight   = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  750,   0,   0.1, new BABYLON.Vector3(-2,   0, 16), new BABYLON.Vector3(0, .4,  .2)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  750,   0,  -0.2, new BABYLON.Vector3(-2,   0, 16), new BABYLON.Vector3(0, .4,  .2))  
                   ];// twirl clockwise while tilting right; going left while on your right side is really up
                     // forward velocity: (16 + 16) / (750 + 750) = 0.021333 units / milli
 
 var backStretch = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  450,   0,   0.3, new BABYLON.Vector3( 0,   0, 12)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  450,   0,  -0.2, new BABYLON.Vector3( 0,   0, 12))  
                   ];// need to make range (0.3 to -0.2), same as away, so can be seen so far away from camera
                     // forward velocity: (12 + 12) / (450 + 450) = 0.026666 units / milli
 
 var turnRight   = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  450,   0,  -0.1, new BABYLON.Vector3( 3,  0,  24), new BABYLON.Vector3(0, .6,   0)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  450,   0,  -0.2, new BABYLON.Vector3( 3,  0,  24), new BABYLON.Vector3(0, .6,   0)) 
                   ];// twirl without aditional tilt; going right which starts to make it go down;
                     // forward velocity: (24 + 24) / (450 + 450) = 0.053333 units / milli
 
 var tiltToHoriz = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  250,   0,   0.3, new BABYLON.Vector3( 0,  -1,  8), new BABYLON.Vector3(0,  0, -.2)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  250,   0,  -0.1, new BABYLON.Vector3( 0,  -1,  8), new BABYLON.Vector3(0,  0, -.2))  
                   ];// reverse the tilt from 'transRight' and 'bankRight'; down hill
                     // forward velocity: (8 + 8) / (250 + 250) = 0.032 units / milli
 
 var woosh       = [new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  400,   0  , 0.3, new BABYLON.Vector3( 12, -1, 25)),
                    new BABYLON.Deformation("ENTIRE MESH", "DRAPED",  400,   0,  -0.1, new BABYLON.Vector3( 12, -1, 25))  
                   ];// cross over right / down hill; eat your heart out Roddenberry
                     // forward velocity: (25 + 25) / (400 + 400) = 0.0625 units / milli
 
                    // using the version of Deformation which does not default on the reference state, here "DRAPED", to going back to 'BASIS'
 var reset       = [new BABYLON.ReferenceDeformation("ENTIRE MESH", "DRAPED", "BASIS",  1, 0, 1), 
                    function(){
                         cloth.position = originalPos;
                         cloth.rotation = originalRot;
                         scene.activeCamera._getViewMatrix(); // jiggle camera to re-lock on target,  also done by ShapeKeyGroup.incrementallyDeform()
                       	 var report = cloth.getTrackingReport();
                       	 window.alert(report);
                       	 console.log(report);
                         setInAnim(false);
                    } 
                   ];                        
 /**
  * @param {Array} _eventSeries - Elements must either be a ReferenceDeformation, Action, or function.  Min # of Deformations: 1
  * @param {number} _nRepeats - Number of times to run through series elements.  There is sync across runs. (Default 1)
  * @param {number} _initialWallclockProrating - The factor to multiply the duration of a Deformation before passing to a
  *                 ShapeKeyGroup.  Amount is decreased or increased across repeats, so that it is 1 for the final repeat.
  *                 Facilitates acceleration when > 1, & deceleration when < 1.  (Default 1)
  * @param {string} _debug - Write progress messages to console when true (Default false)
  */
  //                                                                        first run
  //                                                  Series    nRepeats    prorating             debug    
var stretchSeries     = new BABYLON.AutomatonEventSeries(stretching , 2);
var hardFlapSeries    = new BABYLON.AutomatonEventSeries(hardFlap   , 4);                        
var awaySeries        = new BABYLON.AutomatonEventSeries(away       , 5     , 2.0                , true); // demo extra message     
var bankRightSeries   = new BABYLON.AutomatonEventSeries(bankRight  , 3     , 0.021333 / 0.016666);   
var backStretchSeries = new BABYLON.AutomatonEventSeries(backStretch, 2     , 0.026666 / 0.021333);
var turnRightSeries   = new BABYLON.AutomatonEventSeries(turnRight  , 2     , 0.053333 / 0.026666);         
var tiltToHorizSeries = new BABYLON.AutomatonEventSeries(tiltToHoriz, 3);            
var wooshSeries       = new BABYLON.AutomatonEventSeries(woosh      , 3);            
var resetSeries       = new BABYLON.AutomatonEventSeries(reset);            	

function prep(sceneArg){
	scene = sceneArg;
	cloth = scene.getMeshByID("Cloth");
	cloth.debug = true;
	originalPos = cloth.position.clone();
	originalRot = cloth.rotation.clone();

	var entireGrp = cloth.getShapeKeyGroup("ENTIRE MESH");
	entireGrp.mirrorAxisOnY(); // mirror on Y, so wings flapping up past horizontal created, using negative end state ratios 
	
	// set test to false to try to compare performance in final reports
	if (1 === 1){
    	entireGrp.addDerivedKey("BASIS", "DRAPED", -0.2);	
    	entireGrp.addDerivedKey("BASIS", "DRAPED", -0.1);	
    	entireGrp.addDerivedKey("BASIS", "DRAPED",  0.1);
    	entireGrp.addDerivedKey("BASIS", "DRAPED",  0.3);
    	entireGrp.addDerivedKey("BASIS", "DRAPED",  0.9);
	}	
}

function setInAnim(inAnimArg){inAnim = inAnimArg;}

function pausePlay() {
	console.log("Requesting " + (cloth.isPaused() ? "resume" : "pause"));
	// test instance pause-play
	if (cloth.isPaused()) cloth.resumePlay();
	else cloth.pausePlay();
}

function queueAnimation(){
	if (inAnim){
		console.log("queueAnimation while in progress ignored.");
		return;
	}
	setInAnim(true);
	 
	 // the following calls return immediately, due to being put on the appropriate ShapeKeyGroup(s) queues
     cloth.queueEventSeries(stretchSeries);
     cloth.queueEventSeries(hardFlapSeries);                        
     cloth.queueEventSeries(awaySeries);
     cloth.queueEventSeries(bankRightSeries);   
     cloth.queueEventSeries(backStretchSeries);
     cloth.queueEventSeries(turnRightSeries);         
     cloth.queueEventSeries(tiltToHorizSeries);            
     cloth.queueEventSeries(wooshSeries);            
     cloth.queueEventSeries(resetSeries);            
}