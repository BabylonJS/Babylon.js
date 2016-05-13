/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxiosettingspath.h
#ifndef _FBXSDK_FILEIO_IO_SETTINGS_PATH_H_
#define _FBXSDK_FILEIO_IO_SETTINGS_PATH_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define KS_BS                           FbxString("\\")

#define KS_IMPORT                       FbxString("\\import")
#define KS_EXPORT                       FbxString("\\export")

#define KS_FBX                          FbxString("\\FBX")       // must be upper case
#define KS_PRESETS                      FbxString("\\Presets")
#define KS_LOG                          FbxString("\\Logs")
#define KS_FBXPRESETS                   KS_FBX + KS_PRESETS
#define KS_FBXLOGS                      KS_FBX + KS_LOG

#define KS_MAYA                         FbxString("\\maya")
#define KS_3DSMAX                       FbxString("\\3dsmax")
#define KS_3DSMAX_VIZ                   KS_3DSMAX                 // use same name in "My Document" directory
#define KS_3DSMAX_DESIGN                FbxString("\\3dsMaxDesign")
	
#define KS_VERSION                      FbxString(FBXSDK_VERSION_STRING)

#define FBXSDK_PLUGINS_REGISTRY_PATH	"SOFTWARE\\Autodesk\\FBX_Plugins_" FBXSDK_VERSION_STRING

#define IMP_FBX_PRESET_EXT			    "fbximportpreset"
#define EXP_FBX_PRESET_EXT		        "fbxexportpreset"

#define M_E_FILENAME				    "Autodesk Media & Entertainment."
#define ARCH_FILENAME                   "Autodesk Architectural (Revit)."
#define MOBU_FILENAME                   "Autodesk MotionBuilder."
#define USERDEFINED_FILENAME		    "User defined."

#define IMP_DIR							KS_FBXPRESETS + KS_BS + KS_VERSION + KS_IMPORT
#define EXP_DIR							KS_FBXPRESETS + KS_BS + KS_VERSION + KS_EXPORT

#define LOG_VERSION_DIR                 KS_FBXLOGS + KS_BS + KS_VERSION

#define MAX_LOG_VERSION_DIR             KS_3DSMAX + LOG_VERSION_DIR
#define MAX_DESIGN_LOG_VERSION_DIR      KS_3DSMAX_DESIGN + LOG_VERSION_DIR

#define PRESET_VERSION_DIR              KS_FBXPRESETS + KS_BS + KS_VERSION

#define FN_LOCALIZATION_PREFIX          "localization_"
#define FN_LOCALIZATION_EXT             ".xlf"

#define FN_LANGUAGE                     "lang.dat"
#define LANGUAGE_PATH                   KS_FBXPRESETS + KS_BS + KS_VERSION + KS_BS + FN_LANGUAGE

// these defines are used for hierarchical properties names
#define IOSROOT							"IOSRoot"

#define IOSN_EXPORT			    		"Export"
#define IOSN_IMPORT			    		"Import"

#define	IOSN_PLUGIN_GRP					"PlugInGrp"

#define IOSN_PLUGIN_UI_WIDTH			"PlugInUIWidth"
#define IOSN_PLUGIN_UI_HEIGHT   		"PlugInUIHeight"
#define IOSN_PLUGIN_VERSIONS_URL		"PluginVersionsURL"
#define IOSN_PI_VERSION					"PIVersion"


#define IOSN_PRESET_SELECTED            "PresetSelected"

#define IOSN_PRESETS_GRP        		"PresetsGrp"
#define IOSN_STATISTICS_GRP     		"StatisticsGrp"
#define IOSN_UNITS_GRP          		"UnitsGrp"
#define IOSN_INCLUDE_GRP        		"IncludeGrp"
#define IOSN_ADV_OPT_GRP        		"AdvOptGrp"
#define IOSN_AXISCONV_GRP       		"AxisConvGrp"
#define IOSN_CAMERA_GRP					"CameraGrp"
#define IOSN_LIGHT_GRP					"LightGrp"
#define IOSN_EXTRA_GRP                  "ExtraGrp"
#define IOSN_CONSTRAINTS_GRP			"ConstraintsGrp"
#define IOSN_INPUTCONNECTIONS_GRP       "InputConnectionsGrp"
#define IOSN_INFORMATION_GRP            "InformationGrp"

#define IOSN_UP_AXIS					"UpAxis"
#define IOSN_UP_AXIS_MAX				"UpAxisMax"
#define IOSN_ZUPROTATION_MAX            "ZUProtation_max"	
#define IOSN_AXISCONVERSION             "AxisConversion"
#define IOSN_AUTO_AXIS                  "AutoAxis"
#define IOSN_FILE_UP_AXIS               "FileUpAxis"

#define IOSN_PRESETS	        		"Presets"
#define IOSN_STATISTICS	        		"Statistics"
#define IOSN_UNITS_SCALE           		"UnitsScale"
#define IOSN_TOTAL_UNITS_SCALE_TB  		"TotalUnitsScale"

#define IOSN_SCALECONVERSION            "ScaleConversion"
#define IOSN_MASTERSCALE                "MasterScale"

#define IOSN_DYN_SCALE_CONVERSION       "DynamicScaleConversion"
#define IOSN_UNITSELECTOR				"UnitsSelector"

#define IOSN_ANIMATION          		"Animation"
#define IOSN_GEOMETRY           		"Geometry"
#define IOSN_DEFORMATION				"Deformation"
#define IOSN_MARKERS					"Markers"

#define IOSN_CHARACTER					"Character"
#define IOSN_CHARACTER_AS_MAYA_HIK      "CharacterAsMayaHIK"
#define IOSN_CHARACTER_TYPE             "CharacterType"
#define IOSN_CHARACTER_TYPE_DESC        "CharacterTypeDesc"

#define IOSN_SETLOCKEDATTRIB			"LockedAttribute"		
#define IOSN_TRIANGULATE                "Triangulate"

#define IOSN_MRCUSTOMATTRIBUTES 		"MRCustomAttributes"
#define IOSN_MESHPRIMITIVE      		"MeshPrimitive"
#define IOSN_MESHTRIANGLE       		"MeshTriangle"
#define IOSN_MESHPOLY           		"MeshPoly"
#define IOSN_NURB               		"Nurb"
#define IOSN_PATCH              		"Patch"
#define IOSN_BIP2FBX            		"Bip2Fbx"
#define IOSN_ASCIIFBX                   "AsciiFbx"

#define IOSN_TAKE						"Take"

#define IOSN_GEOMETRYMESHPRIMITIVEAS    "GeometryMeshPrimitiveAs"
#define IOSN_GEOMETRYMESHTRIANGLEAS     "GeometryMeshTriangleAs"
#define IOSN_GEOMETRYMESHPOLYAS         "GeometryMeshPolyAs"
#define IOSN_GEOMETRYNURBSAS            "GeometryNurbsAs"

#define IOSN_GEOMETRYNURBSSURFACEAS     "GeometryNurbsSurfaceAs"
#define IOSN_GEOMETRYPATCHAS            "GeometryPatchAs"

#define IOSN_TANGENTS_BINORMALS         "TangentsandBinormals"
#define IOSN_SMOOTH_MESH                "SmoothMesh"
#define IOSN_SELECTION_SET              "SelectionSet"
#define IOSN_ANIMATIONONLY              "AnimationOnly"
#define IOSN_SELECTIONONLY				"SelectionOnly"

#define IOSN_BONE						"Bone"
#define IOSN_BONEWIDTHHEIGHTLOCK 		"BoneWidthHeightLock"
#define IOSN_BONEASDUMMY         		"BoneAsDummy"
#define IOSN_BONEMAX4BONEWIDTH   		"Max4BoneWidth"
#define IOSN_BONEMAX4BONEHEIGHT  		"Max4BoneHeight"
#define IOSN_BONEMAX4BONETAPER   		"Max4BoneTaper"

#define IOSN_REMOVE_SINGLE_KEY          "RemoveSingleKey"
#define IOSN_CURVE_FILTER	    		"CurveFilter"
#define IOSN_CONSTRAINT		    		"Constraint"
#define IOSN_UI				    		"UI"
#define IOSN_SHOW_UI_MODE               "ShowUIMode"
#define IOSN_SHOW_WARNINGS_MANAGER      "ShowWarningsManager"
#define IOSN_GENERATE_LOG_DATA          "GenerateLogData"

#define IOSN_PERF_GRP					"Performance"
#define IOSN_REMOVEBADPOLYSFROMMESH     "RemoveBadPolysFromMesh"
#define IOSN_META_DATA                  "MetaData"

#define IOSN_CACHE_GRP                  "Cache"
#define IOSN_CACHE_SIZE                 "CacheSize"

#define IOSN_MERGE_MODE	    		    "MergeMode"
#define IOSN_MERGE_MODE_DESCRIPTION     "MergeModeDescription" 
#define IOSN_ONE_CLICK_MERGE            "OneClickMerge"
#define IOSN_ONE_CLICK_MERGE_TEXTURE    "OneClickMergeTexture"

#define IOSN_SAMPLINGPANEL              "SamplingPanel"

#define IOSN_FILE_FORMAT	    		"FileFormat"
#define IOSN_FBX                		"Fbx"
#define IOSN_DXF                		"Dxf"
#define IOSN_OBJ                		"Obj"
#define IOSN_3DS                		"Max_3ds"  // can't start by a number for xml node name
#define IOSN_COLLADA            		"Collada"

#define IOSN_MOTION_BASE				"Motion_Base"  // for commond Motion Readers/Writers stream options
#define IOSN_BIOVISION_BVH       		"Biovision_BVH"
#define IOSN_MOTIONANALYSIS_HTR  		"MotionAnalysis_HTR"
#define IOSN_MOTIONANALYSIS_TRC  		"MotionAnalysis_TRC"
#define IOSN_ACCLAIM_ASF         		"Acclaim_ASF"
#define IOSN_ACCLAIM_AMC         		"Acclaim_AMC"
#define IOSN_VICON_C3D           		"Vicon_C3D"

#define IOSN_SKINS				 		"Skins"
#define IOSN_POINTCACHE          		"PointCache"
#define IOSN_QUATERNION			 		"Quaternion"
#define IOSN_NAMETAKE                   "UseSceneName"

#define IOSN_SHAPE               		 "Shape"
#define IOSN_LIGHT						 "Light"
#define IOSN_LIGHTATTENUATION            "LightAttenuation"
#define IOSN_CAMERA						 "Camera"
#define IOSN_VIEW_CUBE				     "ViewCube"

#define IOSN_BINDPOSE					 "BindPose"

#define IOSN_EMBEDTEXTURE_GRP      		"EmbedTextureGrp"
#define IOSN_EMBEDTEXTURE       		"EmbedTexture"
#define IOSN_EMBEDDED_FOLDER       		"ExtractFolder"
#define IOSN_CONVERTTOTIFF      		"Convert_2Tiff"

#define IOSN_UNLOCK_NORMALS             "UnlockNormals"
#define IOSN_CREASE             		"Crease"
#define IOSN_FINESTSUBDIVLEVEL			"FinestSubdivLevel"

#define IOSN_BAKEANIMATIONLAYERS		"BakeAnimationLayers"
#define IOSN_BAKECOMPLEXANIMATION		"BakeComplexAnimation"

#define IOSN_BAKEFRAMESTART				"BakeFrameStart"		 
#define IOSN_BAKEFRAMEEND				"BakeFrameEnd"		 
#define IOSN_BAKEFRAMESTEP				"BakeFrameStep"		 
#define IOSN_BAKEFRAMESTARTNORESET		"BakeFrameStartNoReset"
#define IOSN_BAKEFRAMEENDNORESET		"BakeFrameEndNoReset"	 
#define IOSN_BAKEFRAMESTEPNORESET		"BakeFrameStepNoReset" 

#define IOSN_USEMATRIXFROMPOSE      	"UseMatrixFromPose"
#define IOSN_NULLSTOPIVOT           	"NullsToPivot"
#define IOSN_PIVOTTONULLS               "PivotToNulls"

#define IOSN_GEOMNORMALPERPOLY		    "GeomNormalPerPoly"
#define IOSN_MAXBONEASBONE				"MaxBoneAsBone"
#define IOSN_MAXNURBSSTEP				"MaxNurbsStep"
#define IOSN_PROTECTDRIVENKEYS          "ProtectDrivenKeys"
#define IOSN_DEFORMNULLSASJOINTS        "DeformNullsAsJoints"

#define IOSN_ENVIRONMENT                "Environment"

// Note this will use IOSN_SAMPLINGRATE 
#define IOSN_SAMPLINGRATESELECTOR       "SamplingRateSelector"

#define IOSN_SAMPLINGRATE               "CurveFilterSamplingRate"
#define IOSN_APPLYCSTKEYRED             "CurveFilterApplyCstKeyRed"
#define IOSN_CSTKEYREDTPREC				"CurveFilterCstKeyRedTPrec"
#define IOSN_CSTKEYREDRPREC				"CurveFilterCstKeyRedRPrec"
#define IOSN_CSTKEYREDSPREC             "CurveFilterCstKeyRedSPrec"
#define IOSN_CSTKEYREDOPREC             "CurveFilterCstKeyRedOPrec"
#define IOSN_APPLYKEYREDUCE             "CurveFilterApplyKeyReduce"
#define IOSN_KEYREDUCEPREC              "CurveFilterKeyReducePrec" 
#define IOSN_APPLYKEYSONFRM             "CurveFilterApplyKeysOnFrm"
#define IOSN_APPLYKEYSYNC               "CurveFilterApplyKeySync"  
#define IOSN_APPLYUNROLL                "CurveFilterApplyUnroll"   
#define IOSN_UNROLLPREC                 "CurveFilterUnrollPrec"    
#define IOSN_UNROLLPATH                 "CurveFilterUnrollPath"
#define IOSN_UNROLLFORCEAUTO            "CurveFilterUnrollForceAuto"

#define IOSN_AUTOTANGENTSONLY           "AutoTangentsOnly"

#define IOSN_SMOOTHING_GROUPS           "SmoothingGroups"
#define IOSN_HARDEDGES                  "HardEdges"
#define IOSN_EXP_HARDEDGES              "expHardEdges"
#define IOSN_BLINDDATA                  "BlindData"
#define IOSN_INPUTCONNECTIONS           "InputConnections"
#define IOSN_INSTANCES                  "Instances"
#define IOSN_REFERENCES                 "References"
#define IOSN_CONTAINEROBJECTS           "ContainerObjects"
#define IOSN_BYPASSRRSINHERITANCE       "BypassRrsInheritance"
#define IOSN_FORCEWEIGHTNORMALIZE       "ForceWeightNormalize"
#define IOSN_SHAPEANIMATION             "ShapeAnimation"
#define IOSN_SMOOTHKEYASUSER            "SmoothKeyAsUser"

#define IOSN_SCALEFACTOR				"ScaleFactor"
#define IOSN_AXISCONVERSIONMETHOD		"AxisConversionMethod"
#define IOSN_UPAXIS						"UpAxis"
#define IOSN_SELECTIONSETNAMEASPOINTCACHE "SelectionSetNameAsPointCache"

#define IOSN_KEEPFRAMERATE               "KeepFrameRate"
#define IOSN_ATTENUATIONASINTENSITYCURVE "AttenuationAsIntensityCurve"

#define IOSN_RESAMPLE_ANIMATION_CURVES	 "ResampleAnimationCurves"

#define IOSN_TIMELINE                    "TimeLine"
#define IOSN_TIMELINE_SPAN				 "TimeLineSpan"

#define IOSN_BUTTON_WEB_UPDATE           "WebUpdateButton"
#define IOSN_BUTTON_EDIT                 "EditButton"
#define IOSN_BUTTON_OK                   "OKButton"
#define IOSN_BUTTON_CANCEL               "CancelButton"
#define IOSN_MENU_EDIT_PRESET            "EditPresetMenu"
#define IOSN_MENU_SAVE_PRESET            "SavePresetMenu"

#define IOSN_UIL                         "UILIndex"
#define IOSN_PLUGIN_PRODUCT_FAMILY       "PluginProductFamily"

#define IOSN_PLUGIN_UI_XPOS              "PlugInUIXpos"
#define IOSN_PLUGIN_UI_YPOS              "PlugInUIYpos"

#define IOSN_FBX_EXTENTIONS_SDK          "FBXExtentionsSDK"
#define IOSN_FBX_EXTENTIONS_SDK_WARNING  "FBXExtentionsSDKWarning"

#define IOSN_COLLADA_FRAME_COUNT         "FrameCount"
#define IOSN_COLLADA_START               "Start"
#define IOSN_COLLADA_TAKE_NAME           "TakeName"

#define IOSN_COLLADA_TRIANGULATE         "Triangulate"
#define IOSN_COLLADA_SINGLEMATRIX        "SingleMatrix"
#define IOSN_COLLADA_FRAME_RATE          "FrameRate"

#define IOSN_DXF_TRIANGULATE             "Triangulate"
#define IOSN_DXF_DEFORMATION             "Deformation"

#define IOSN_DXF_WELD_VERTICES           "WeldVertices"
#define IOSN_DXF_OBJECT_DERIVATION       "ObjectDerivation"
#define IOSN_DXF_REFERENCE_NODE          "ReferenceNode"

#define IOSN_OBJ_REFERENCE_NODE          "ReferenceNode"
#define IOSN_OBJ_TRIANGULATE			 "Triangulate"
#define IOSN_OBJ_DEFORMATION             "Deformation"

#define IOSN_3DS_REFERENCENODE			 "ReferenceNode"
#define IOSN_3DS_TEXTURE      			 "Texture"
#define IOSN_3DS_MATERIAL     			 "Material"
#define IOSN_3DS_ANIMATION    			 "Animation"
#define IOSN_3DS_MESH         			 "Mesh"
#define IOSN_3DS_LIGHT        			 "Light"
#define IOSN_3DS_CAMERA       			 "Camera"
#define IOSN_3DS_AMBIENT_LIGHT			 "AmbientLight"
#define IOSN_3DS_RESCALING    			 "Rescaling"
#define IOSN_3DS_FILTER       			 "Filter"
#define IOSN_3DS_SMOOTHGROUP  			 "Smoothgroup"
#define IOSN_3DS_TAKE_NAME    			 "TakeName"
#define IOSN_3DS_TEXUVBYPOLY			 "TexuvbyPoly"

// so far, these three are for 3dsMax plug-in only
#define IOSN_ZOOMEXTENTS					"ZoomExtents"
#define IOSN_GLOBAL_AMBIENT_COLOR			"GlobalAmbientColor"
#define IOSN_EDGE_ORIENTATION				"PreserveEdgeOrientation"

#define IOSN_VERSIONS_UI_ALIAS           "VersionsUIAlias"
#define IOSN_VERSIONS_COMP_DESCRIPTIONS  "VersionsCompDescriptions"
	
// FBX specific 
#define IOSN_MODEL_COUNT                 "Model_Count"
#define IOSN_DEVICE_COUNT                "Device_Count"     
#define IOSN_CHARACTER_COUNT             "Character_Count"  
#define IOSN_ACTOR_COUNT                 "Actor_Count"      
#define IOSN_CONSTRAINT_COUNT            "Constraint_Count" 
#define IOSN_MEDIA_COUNT                 "Media_Count" 
#define IOSN_TEMPLATE                    "Template"
#define IOSN_PIVOT                       "Pivot"
#define IOSN_GLOBAL_SETTINGS             "Global_Settings"
#define IOSN_MERGE_LAYER_AND_TIMEWARP    "Merge_Layer_and_Timewarp"
#define IOSN_GOBO                        "Gobo"
#define IOSN_LINK                        "Link"
#define IOSN_MATERIAL                    "Material"
#define IOSN_TEXTURE                     "Texture"
#define IOSN_MODEL                       "Model"
#define IOSN_EMBEDDED                    "EMBEDDED"
#define IOSN_PASSWORD                    "Password"
#define IOSN_PASSWORD_ENABLE             "Password_Enable"
#define IOSN_CURRENT_TAKE_NAME           "Current_Take_Name"
#define IOSN_COLLAPSE_EXTERNALS          "COLLAPSE EXTERNALS"
#define IOSN_COMPRESS_ARRAYS             "Compress_Arrays"
#define IOSN_COMPRESS_LEVEL              "Compress_Level"
#define IOSN_COMPRESS_MINSIZE            "Compress_Minsize"
#define IOSN_EMBEDDED_PROPERTIES_SKIP    "Embedded_Skipped_Properties"
#define IOSN_EXPORT_FILE_VERSION         "ExportFileVersion"
#define IOSN_SHOW_UI_WARNING			 "ShowUIWarning"
#define IOSN_ADD_MATERIAL_TO_EDIT		 "AddMaterialToEdit"
#define IOSN_ENABLE_TEX_DISPLAY          "EnableTexDisplay"
#define IOSN_PREFERED_ENVELOPPE_SYSTEM   "kImportPreferedEnveloppeSystem"
#define IOSN_FIRST_TIME_RUN_NOTICE       "FirstTimeRunNotice"
#define IOSN_EXTRACT_EMBEDDED_DATA       "ExtractEmbeddedData"

// internal usage
#define IOSN_USETMPFILEPERIPHERAL		 "UseTmpFilePeripheral"
#define IOSN_CONSTRUCTIONHISTORY         "ConstructionHistory"


//---------------------------
// import defined path

#define IMP_PRESETS                     IOSN_IMPORT "|" IOSN_PRESETS_GRP "|" IOSN_PRESETS
#define IMP_STATISTICS                  IOSN_IMPORT "|" IOSN_STATISTICS_GRP "|" IOSN_STATISTICS


#define IMP_STATISTICS_GRP              IOSN_IMPORT "|" IOSN_STATISTICS_GRP
#define IMP_PRESETS_GRP                 IOSN_IMPORT "|" IOSN_PRESETS_GRP
#define IMP_PLUGIN_GRP                  IOSN_IMPORT "|" IOSN_PLUGIN_GRP
#define IMP_INCLUDE_GRP         		IOSN_IMPORT "|" IOSN_INCLUDE_GRP
#define IMP_ADV_OPT_GRP         		IOSN_IMPORT "|" IOSN_ADV_OPT_GRP
#define IMP_FBX_EXT_SDK_GRP             IOSN_IMPORT "|" IOSN_FBX_EXTENTIONS_SDK
#define IMP_FIRST_TIME_RUN_NOTICE_GRP   IOSN_IMPORT "|" IOSN_FIRST_TIME_RUN_NOTICE
#define IMP_INFORMATION_GRP				IOSN_IMPORT "|" IOSN_INFORMATION_GRP

#define IMP_FIRST_TIME_RUN_NOTICE       IMP_FIRST_TIME_RUN_NOTICE_GRP "|" IOSN_FIRST_TIME_RUN_NOTICE

#define IMP_GEOMETRY            		IMP_INCLUDE_GRP "|" IOSN_GEOMETRY
#define IMP_ANIMATION           		IMP_INCLUDE_GRP "|" IOSN_ANIMATION
#define IMP_SETLOCKEDATTRIB				IMP_INCLUDE_GRP "|" IOSN_SETLOCKEDATTRIB

#define IMP_MERGE_MODE            		IMP_INCLUDE_GRP "|" IOSN_MERGE_MODE
#define IMP_MERGE_MODE_DESCRIPTION      IMP_INCLUDE_GRP "|" IOSN_MERGE_MODE_DESCRIPTION
#define IMP_ONE_CLICK_MERGE				IMP_INCLUDE_GRP "|" IOSN_ONE_CLICK_MERGE
#define IMP_ONE_CLICK_MERGE_TEXTURE     IMP_INCLUDE_GRP "|" IOSN_ONE_CLICK_MERGE_TEXTURE

#define IMP_ADD_MATERIAL_TO_EDIT     	IMP_INCLUDE_GRP "|" IOSN_ADD_MATERIAL_TO_EDIT
#define IMP_ENABLE_TEX_DISPLAY			IMP_INCLUDE_GRP "|" IOSN_ENABLE_TEX_DISPLAY
#define IMP_PREFERED_ENVELOPPE_SYSTEM   IMP_INCLUDE_GRP "|" IOSN_PREFERED_ENVELOPPE_SYSTEM		

#define IMP_CAMERA_GRP                  IMP_INCLUDE_GRP "|" IOSN_CAMERA_GRP
#define IMP_LIGHT_GRP					IMP_INCLUDE_GRP "|" IOSN_LIGHT_GRP
#define IMP_EMBEDDED_GRP        		IMP_INCLUDE_GRP "|" IOSN_EMBEDTEXTURE
#define IMP_EXTRACT_FOLDER				IMP_EMBEDDED_GRP "|" IOSN_EMBEDDED_FOLDER

#define IMP_LIGHT						IMP_LIGHT_GRP "|" IOSN_LIGHT
#define IMP_ENVIRONMENT                 IMP_LIGHT_GRP "|" IOSN_ENVIRONMENT
#define IMP_CAMERA						IMP_CAMERA_GRP "|" IOSN_CAMERA
#define IMP_VIEW_CUBE                   IMP_INCLUDE_GRP "|" IOSN_VIEW_CUBE

// so far, this one is for 3dsMax plug-in only
#define IMP_ZOOMEXTENTS                 IMP_INCLUDE_GRP "|" IOSN_ZOOMEXTENTS
#define IMP_GLOBAL_AMBIENT_COLOR        IMP_LIGHT_GRP "|" IOSN_GLOBAL_AMBIENT_COLOR

#define IMP_CURVEFILTERS        		IMP_ANIMATION "|" IOSN_CURVE_FILTER
#define IMP_SAMPLINGPANEL               IMP_ANIMATION "|" IOSN_SAMPLINGPANEL

#define IMP_DEFORMATION         		IMP_ANIMATION "|" IOSN_DEFORMATION
#define IMP_BONE						IMP_ANIMATION "|" IOSN_BONE
#define IMP_ATTENUATIONASINTENSITYCURVE IMP_ANIMATION "|" IOSN_ATTENUATIONASINTENSITYCURVE

#define IMP_EXTRA_GRP					IMP_ANIMATION "|" IOSN_EXTRA_GRP

#define IMP_TAKE                        IMP_EXTRA_GRP "|" IOSN_TAKE
#define IMP_KEEPFRAMERATE               IMP_EXTRA_GRP "|" IOSN_KEEPFRAMERATE
#define IMP_TIMELINE                    IMP_EXTRA_GRP "|" IOSN_TIMELINE
#define IMP_TIMELINE_SPAN				IMP_EXTRA_GRP "|" IOSN_TIMELINE_SPAN
#define IMP_BAKEANIMATIONLAYERS 		IMP_EXTRA_GRP "|" IOSN_BAKEANIMATIONLAYERS
#define IMP_MARKERS             		IMP_EXTRA_GRP "|" IOSN_MARKERS
#define IMP_QUATERNION          		IMP_EXTRA_GRP "|" IOSN_QUATERNION
#define IMP_PROTECTDRIVENKEYS           IMP_EXTRA_GRP "|" IOSN_PROTECTDRIVENKEYS
#define IMP_DEFORMNULLSASJOINTS         IMP_EXTRA_GRP "|" IOSN_DEFORMNULLSASJOINTS
#define IMP_NULLSTOPIVOT        		IMP_EXTRA_GRP "|" IOSN_NULLSTOPIVOT
#define IMP_POINTCACHE       			IMP_EXTRA_GRP "|" IOSN_POINTCACHE
#define IMP_SHAPEANIMATION              IMP_EXTRA_GRP "|" IOSN_SHAPEANIMATION

#define IMP_CONSTRAINTS_GRP				IMP_ANIMATION "|" IOSN_CONSTRAINTS_GRP

#define IMP_CONSTRAINT          		IMP_CONSTRAINTS_GRP "|" IOSN_CONSTRAINT

#define IMP_CHARACTER            		IMP_CONSTRAINTS_GRP "|" IOSN_CHARACTER
#define IMP_CHARACTER_AS_MAYA_HIK		IMP_CONSTRAINTS_GRP "|" IOSN_CHARACTER_AS_MAYA_HIK
#define IMP_CHARACTER_TYPE              IMP_CONSTRAINTS_GRP "|" IOSN_CHARACTER_TYPE


#define IMP_SAMPLINGRATESELECTOR        IMP_SAMPLINGPANEL "|" IOSN_SAMPLINGRATESELECTOR
#define IMP_SAMPLINGRATE				IMP_SAMPLINGPANEL "|" IOSN_SAMPLINGRATE

#define IMP_UNITS_GRP           		IMP_ADV_OPT_GRP "|" IOSN_UNITS_GRP
#define IMP_AXISCONV_GRP        		IMP_ADV_OPT_GRP "|" IOSN_AXISCONV_GRP
#define IMP_CACHE_GRP                   IMP_ADV_OPT_GRP "|" IOSN_CACHE_GRP

#define IMP_UI                  		IMP_ADV_OPT_GRP "|" IOSN_UI 
#define IMP_FILEFORMAT          		IMP_ADV_OPT_GRP "|" IOSN_FILE_FORMAT
#define IMP_PERF_GRP					IMP_ADV_OPT_GRP "|" IOSN_PERF_GRP

#define IMP_REMOVEBADPOLYSFROMMESH      IMP_PERF_GRP "|" IOSN_REMOVEBADPOLYSFROMMESH
#define IMP_META_DATA					IMP_PERF_GRP "|" IOSN_META_DATA

#define IMP_FBX_EXTENTIONS_SDK_WARNING  IMP_FBX_EXT_SDK_GRP "|" IOSN_FBX_EXTENTIONS_SDK_WARNING

#define IMP_SCALECONVERSION             IMP_UNITS_GRP "|" IOSN_SCALECONVERSION
#define IMP_UNITS_TB                    IMP_UNITS_GRP "|" IOSN_UNITS_TB
#define IMP_MASTERSCALE                 IMP_UNITS_GRP "|" IOSN_MASTERSCALE
#define IMP_UNITS_SCALE                 IMP_UNITS_GRP "|" IOSN_UNITS_SCALE

#define IMP_DYN_SCALE_CONVERSION		IMP_UNITS_GRP "|" IOSN_DYN_SCALE_CONVERSION
#define IMP_UNITSELECTOR                IMP_UNITS_GRP "|" IOSN_UNITSELECTOR
#define IMP_TOTAL_UNITS_SCALE_TB        IMP_UNITS_GRP "|" IOSN_TOTAL_UNITS_SCALE_TB

#define IMP_SHOW_UI_MODE                IMP_UI "|" IOSN_SHOW_UI_MODE
#define IMP_SHOW_UI_WARNING			    IMP_UI "|" IOSN_SHOW_UI_WARNING
#define IMP_SHOW_WARNINGS_MANAGER       IMP_UI "|" IOSN_SHOW_WARNINGS_MANAGER
#define IMP_GENERATE_LOG_DATA           IMP_UI "|" IOSN_GENERATE_LOG_DATA	
#define IMP_PLUGIN_VERSIONS_URL			IMP_UI "|" IOSN_PLUGIN_VERSIONS_URL

#define IMP_DXF                 		IMP_ADV_OPT_GRP "|" IOSN_DXF

// note: IMP_FILEFORMAT group is not visible
#define IMP_FBX                 		IMP_FILEFORMAT "|" IOSN_FBX
#define IMP_OBJ                 		IMP_FILEFORMAT "|" IOSN_OBJ
#define IMP_3DS                 		IMP_FILEFORMAT "|" IOSN_3DS

#define IMP_MOTION_BASE         		IMP_FILEFORMAT "|" IOSN_MOTION_BASE
#define IMP_BIOVISION_BVH       		IMP_FILEFORMAT "|" IOSN_BIOVISION_BVH
#define IMP_MOTIONANALYSIS_HTR  		IMP_FILEFORMAT "|" IOSN_MOTIONANALYSIS_HTR
#define IMP_ACCLAIM_ASF         		IMP_FILEFORMAT "|" IOSN_ACCLAIM_ASF
#define IMP_ACCLAIM_AMC         		IMP_FILEFORMAT "|" IOSN_ACCLAIM_AMC

#define IMP_UNLOCK_NORMALS              IMP_GEOMETRY "|" IOSN_UNLOCK_NORMALS
#define IMP_CREASE              		IMP_GEOMETRY "|" IOSN_CREASE

#define IMP_SMOOTHING_GROUPS            IMP_GEOMETRY "|" IOSN_SMOOTHING_GROUPS
#define IMP_HARDEDGES                   IMP_GEOMETRY "|" IOSN_HARDEDGES
#define IMP_BLINDDATA                   IMP_GEOMETRY "|" IOSN_BLINDDATA

#define IMP_BONE_WIDTHHEIGHTLOCK 		IMP_BONE "|" IOSN_BONEWIDTHHEIGHTLOCK
#define IMP_BONEASDUMMY          		IMP_BONE "|" IOSN_BONEASDUMMY
#define IMP_BONEMAX4BONEWIDTH    		IMP_BONE "|" IOSN_BONEMAX4BONEWIDTH   
#define IMP_BONEMAX4BONEHEIGHT   		IMP_BONE "|" IOSN_BONEMAX4BONEHEIGHT  
#define IMP_BONEMAX4BONETAPER    		IMP_BONE "|" IOSN_BONEMAX4BONETAPER

#define IMP_SHAPE                		IMP_DEFORMATION "|" IOSN_SHAPE
#define IMP_SKINS			     		IMP_DEFORMATION "|" IOSN_SKINS
#define IMP_USEMATRIXFROMPOSE    		IMP_DEFORMATION "|" IOSN_USEMATRIXFROMPOSE
#define IMP_FORCEWEIGHTNORMALIZE        IMP_DEFORMATION "|" IOSN_FORCEWEIGHTNORMALIZE



#define IMP_APPLYCSTKEYRED              IMP_CURVEFILTERS "|" IOSN_APPLYCSTKEYRED
#define IMP_CSTKEYREDTPREC				IMP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDTPREC	
#define IMP_CSTKEYREDRPREC				IMP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDRPREC	
#define IMP_CSTKEYREDSPREC				IMP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDSPREC  
#define IMP_CSTKEYREDOPREC				IMP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDOPREC
#define IMP_AUTOTANGENTSONLY            IMP_APPLYCSTKEYRED "|" IOSN_AUTOTANGENTSONLY

#define IMP_APPLYKEYREDUCE				IMP_CURVEFILTERS "|" IOSN_APPLYKEYREDUCE  
#define IMP_KEYREDUCEPREC				IMP_APPLYKEYREDUCE "|" IOSN_KEYREDUCEPREC   
#define IMP_APPLYKEYSONFRM				IMP_APPLYKEYREDUCE "|" IOSN_APPLYKEYSONFRM  
#define IMP_APPLYKEYSYNC				IMP_APPLYKEYREDUCE "|" IOSN_APPLYKEYSYNC  

#define IMP_APPLYUNROLL					IMP_CURVEFILTERS "|" IOSN_APPLYUNROLL     
#define IMP_UNROLLPREC					IMP_APPLYUNROLL "|" IOSN_UNROLLPREC      
#define IMP_UNROLLPATH					IMP_APPLYUNROLL "|" IOSN_UNROLLPATH
#define IMP_UNROLLFORCEAUTO             IMP_APPLYUNROLL "|" IOSN_UNROLLFORCEAUTO

#define IMP_UP_AXIS					    IMP_AXISCONV_GRP "|" IOSN_UP_AXIS
#define IMP_UP_AXIS_MAX					IMP_AXISCONV_GRP "|" IOSN_UP_AXIS_MAX
#define IMP_ZUPROTATION_MAX				IMP_AXISCONV_GRP "|" IOSN_ZUPROTATION_MAX
#define IMP_AXISCONVERSION              IMP_AXISCONV_GRP "|" IOSN_AXISCONVERSION
#define IMP_AUTO_AXIS                   IMP_AXISCONV_GRP "|" IOSN_AUTO_AXIS
#define IMP_FILE_UP_AXIS                IMP_AXISCONV_GRP "|" IOSN_FILE_UP_AXIS

#define IMP_CACHE_SIZE                  IMP_CACHE_GRP "|" IOSN_CACHE_SIZE

#define IMP_PLUGIN_UI_WIDTH             IMP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_WIDTH
#define IMP_PLUGIN_UI_HEIGHT            IMP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_HEIGHT
#define IMP_PRESET_SELECTED             IMP_PLUGIN_GRP "|" IOSN_PRESET_SELECTED

#define IMP_UIL                         IMP_PLUGIN_GRP "|" IOSN_UIL
#define IMP_PLUGIN_PRODUCT_FAMILY       IMP_PLUGIN_GRP "|" IOSN_PLUGIN_PRODUCT_FAMILY

#define IMP_PLUGIN_UI_XPOS              IMP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_XPOS     
#define IMP_PLUGIN_UI_YPOS              IMP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_YPOS     

#define IMP_DXF_WELD_VERTICES           IMP_DXF "|" IOSN_DXF_WELD_VERTICES
#define IMP_DXF_OBJECT_DERIVATION       IMP_DXF "|" IOSN_DXF_OBJECT_DERIVATION
#define IMP_DXF_REFERENCE_NODE          IMP_DXF "|" IOSN_DXF_REFERENCE_NODE

#define IMP_OBJ_REFERENCE_NODE		    IMP_OBJ "|" IOSN_OBJ_REFERENCE_NODE

#define IMP_3DS_REFERENCENODE           IMP_3DS "|" IOSN_3DS_REFERENCENODE	
#define IMP_3DS_TEXTURE                 IMP_3DS "|" IOSN_3DS_TEXTURE      	
#define IMP_3DS_MATERIAL                IMP_3DS "|" IOSN_3DS_MATERIAL     	
#define IMP_3DS_ANIMATION               IMP_3DS "|" IOSN_3DS_ANIMATION    	
#define IMP_3DS_MESH                    IMP_3DS "|" IOSN_3DS_MESH         	
#define IMP_3DS_LIGHT                   IMP_3DS "|" IOSN_3DS_LIGHT        	
#define IMP_3DS_CAMERA                  IMP_3DS "|" IOSN_3DS_CAMERA       	
#define IMP_3DS_AMBIENT_LIGHT           IMP_3DS "|" IOSN_3DS_AMBIENT_LIGHT	
#define IMP_3DS_RESCALING               IMP_3DS "|" IOSN_3DS_RESCALING    	
#define IMP_3DS_FILTER                  IMP_3DS "|" IOSN_3DS_FILTER       	
#define IMP_3DS_SMOOTHGROUP             IMP_3DS "|" IOSN_3DS_SMOOTHGROUP  

#define IMP_FBX_MODEL_COUNT             IMP_FBX "|" IOSN_MODEL_COUNT      
#define IMP_FBX_DEVICE_COUNT            IMP_FBX "|" IOSN_DEVICE_COUNT     
#define IMP_FBX_CHARACTER_COUNT         IMP_FBX "|" IOSN_CHARACTER_COUNT  
#define IMP_FBX_ACTOR_COUNT             IMP_FBX "|" IOSN_ACTOR_COUNT      
#define IMP_FBX_CONSTRAINT_COUNT        IMP_FBX "|" IOSN_CONSTRAINT_COUNT 
#define IMP_FBX_MEDIA_COUNT             IMP_FBX "|" IOSN_MEDIA_COUNT      

#define IMP_FBX_TEMPLATE                    IMP_FBX "|" IOSN_TEMPLATE
#define IMP_FBX_PIVOT                       IMP_FBX "|" IOSN_PIVOT
#define IMP_FBX_GLOBAL_SETTINGS             IMP_FBX "|" IOSN_GLOBAL_SETTINGS
#define IMP_FBX_CHARACTER                   IMP_FBX "|" IOSN_CHARACTER
#define IMP_FBX_CONSTRAINT                  IMP_FBX "|" IOSN_CONSTRAINT
#define IMP_FBX_MERGE_LAYER_AND_TIMEWARP    IMP_FBX "|" IOSN_MERGE_LAYER_AND_TIMEWARP
#define IMP_FBX_GOBO                        IMP_FBX "|" IOSN_GOBO
#define IMP_FBX_SHAPE                       IMP_FBX "|" IOSN_SHAPE	
#define IMP_FBX_LINK                        IMP_FBX "|" IOSN_LINK
#define IMP_FBX_MATERIAL                    IMP_FBX "|" IOSN_MATERIAL
#define IMP_FBX_TEXTURE                     IMP_FBX "|" IOSN_TEXTURE
#define IMP_FBX_MODEL                       IMP_FBX "|" IOSN_MODEL
#define IMP_FBX_ANIMATION                   IMP_FBX "|" IOSN_ANIMATION
#define IMP_FBX_PASSWORD                    IMP_FBX "|" IOSN_PASSWORD        
#define IMP_FBX_PASSWORD_ENABLE             IMP_FBX "|" IOSN_PASSWORD_ENABLE 
#define IMP_FBX_CURRENT_TAKE_NAME           IMP_FBX "|" IOSN_CURRENT_TAKE_NAME
#define IMP_FBX_EXTRACT_EMBEDDED_DATA       IMP_FBX "|" IOSN_EXTRACT_EMBEDDED_DATA

#define IMP_BUTTON_WEB_UPDATE           IMP_INFORMATION_GRP "|" IOSN_BUTTON_WEB_UPDATE
#define IMP_PI_VERSION                  IMP_INFORMATION_GRP "|" IOSN_PI_VERSION

// end of import defined path
//---------------------------

//---------------------------
// export defined path

#define EXP_STATISTICS_GRP              IOSN_EXPORT "|" IOSN_STATISTICS_GRP
#define EXP_ADV_OPT_GRP         		IOSN_EXPORT "|" IOSN_ADV_OPT_GRP
#define EXP_PRESETS_GRP            		IOSN_EXPORT "|" IOSN_PRESETS_GRP
#define EXP_STATISTICS          		IOSN_EXPORT "|" IOSN_STATISTICS_GRP "|" IOSN_STATISTICS
#define EXP_FIRST_TIME_RUN_NOTICE_GRP   IOSN_EXPORT "|" IOSN_FIRST_TIME_RUN_NOTICE
#define EXP_INFORMATION_GRP				IOSN_EXPORT "|" IOSN_INFORMATION_GRP

#define EXP_PLUGIN_GRP                  IOSN_EXPORT "|" IOSN_PLUGIN_GRP
#define EXP_INCLUDE_GRP         		IOSN_EXPORT "|" IOSN_INCLUDE_GRP
#define EXP_FBX_EXT_SDK_GRP             IOSN_EXPORT "|" IOSN_FBX_EXTENTIONS_SDK

#define EXP_UNITS_GRP           		EXP_ADV_OPT_GRP "|" IOSN_UNITS_GRP
#define EXP_FILEFORMAT          		EXP_ADV_OPT_GRP "|" IOSN_FILE_FORMAT
#define EXP_AXISCONV_GRP        		EXP_ADV_OPT_GRP "|" IOSN_AXISCONV_GRP
#define EXP_CACHE_GRP                   EXP_ADV_OPT_GRP "|" IOSN_CACHE_GRP

#define EXP_UI                  		EXP_ADV_OPT_GRP "|" IOSN_UI

#define EXP_FBX_EXTENTIONS_SDK_WARNING  EXP_FBX_EXT_SDK_GRP "|" IOSN_FBX_EXTENTIONS_SDK_WARNING
#define EXP_FIRST_TIME_RUN_NOTICE       EXP_FIRST_TIME_RUN_NOTICE_GRP "|" IOSN_FIRST_TIME_RUN_NOTICE

#define EXP_SCALEFACTOR			        EXP_AXISCONV_GRP "|" IOSN_SCALEFACTOR
#define EXP_AXISCONVERSIONMETHOD	    EXP_AXISCONV_GRP "|" IOSN_AXISCONVERSIONMETHOD
#define EXP_UPAXIS					    EXP_AXISCONV_GRP "|" IOSN_UPAXIS

#define EXP_UNITS_SCALE            		EXP_UNITS_GRP "|" IOSN_UNITS_SCALE
#define EXP_MASTERSCALE                 EXP_UNITS_GRP  "|" IOSN_MASTERSCALE

#define EXP_DYN_SCALE_CONVERSION		EXP_UNITS_GRP "|" IOSN_DYN_SCALE_CONVERSION
#define EXP_UNITSELECTOR                EXP_UNITS_GRP "|" IOSN_UNITSELECTOR

#define EXP_TOTAL_UNITS_SCALE_TB        EXP_UNITS_GRP "|" IOSN_TOTAL_UNITS_SCALE_TB

#define EXP_SHOW_UI_MODE                EXP_UI "|" IOSN_SHOW_UI_MODE
#define EXP_SHOW_UI_WARNING			    EXP_UI "|" IOSN_SHOW_UI_WARNING
#define EXP_SHOW_WARNINGS_MANAGER       EXP_UI "|" IOSN_SHOW_WARNINGS_MANAGER
#define EXP_GENERATE_LOG_DATA           EXP_UI "|" IOSN_GENERATE_LOG_DATA
#define EXP_PLUGIN_VERSIONS_URL			EXP_UI "|" IOSN_PLUGIN_VERSIONS_URL

#define EXP_PRESETS                     EXP_PRESETS_GRP "|" IOSN_PRESETS

#define EXP_CAMERA_GRP                  EXP_INCLUDE_GRP "|" IOSN_CAMERA_GRP
#define EXP_LIGHT_GRP					EXP_INCLUDE_GRP "|" IOSN_LIGHT_GRP

#define EXP_GEOMETRY            		EXP_INCLUDE_GRP "|" IOSN_GEOMETRY
#define EXP_ANIMATION           		EXP_INCLUDE_GRP "|" IOSN_ANIMATION
#define EXP_PIVOTTONULLS                EXP_INCLUDE_GRP "|" IOSN_PIVOTTONULLS
#define EXP_LIGHT						EXP_LIGHT_GRP "|" IOSN_LIGHT
#define EXP_LIGHTATTENUATION            EXP_INCLUDE_GRP "|" IOSN_LIGHTATTENUATION
#define EXP_ENVIRONMENT				    EXP_LIGHT_GRP "|" IOSN_ENVIRONMENT
#define EXP_CAMERA						EXP_CAMERA_GRP "|" IOSN_CAMERA	
#define EXP_BINDPOSE					EXP_INCLUDE_GRP "|" IOSN_BINDPOSE
#define EXP_SELECTIONONLY               EXP_INCLUDE_GRP "|" IOSN_SELECTIONONLY


#define EXP_INPUTCONNECTIONS_GRP        EXP_INCLUDE_GRP "|" IOSN_INPUTCONNECTIONS_GRP
#define EXP_INPUTCONNECTIONS	        EXP_INPUTCONNECTIONS_GRP "|" IOSN_INPUTCONNECTIONS

#define EXP_BYPASSRRSINHERITANCE        EXP_INCLUDE_GRP "|" IOSN_BYPASSRRSINHERITANCE

#define EXP_EMBEDTEXTURE_GRP      		EXP_INCLUDE_GRP "|" IOSN_EMBEDTEXTURE_GRP
#define EXP_EMBEDTEXTURE                EXP_EMBEDTEXTURE_GRP "|" IOSN_EMBEDTEXTURE
#define EXP_CONVERTTOTIFF       		EXP_EMBEDTEXTURE "|" IOSN_CONVERTTOTIFF


#define EXP_CURVEFILTERS        		EXP_ANIMATION "|" IOSN_CURVE_FILTER

#define EXP_DEFORMATION					EXP_ANIMATION "|" IOSN_DEFORMATION
#define EXP_BAKECOMPLEXANIMATION	    EXP_ANIMATION "|" IOSN_BAKECOMPLEXANIMATION
#define EXP_BONE						EXP_ANIMATION "|" IOSN_BONE

#define EXP_SAMPLINGFRAMERATE           EXP_ANIMATION "|" IOSN_SAMPLINGFRAMERATE
#define EXP_POINTCACHE       			EXP_ANIMATION "|" IOSN_POINTCACHE
#define EXP_SMOOTHKEYASUSER             EXP_ANIMATION "|" IOSN_SMOOTHKEYASUSER

#define EXP_EXTRA_GRP					EXP_ANIMATION "|" IOSN_EXTRA_GRP

#define EXP_REMOVE_SINGLE_KEY           EXP_EXTRA_GRP "|" IOSN_REMOVE_SINGLE_KEY
#define EXP_NAMETAKE                    EXP_EXTRA_GRP "|" IOSN_NAMETAKE
#define EXP_QUATERNION          		EXP_EXTRA_GRP "|" IOSN_QUATERNION

#define EXP_CONSTRAINTS_GRP				EXP_ANIMATION "|" IOSN_CONSTRAINTS_GRP

#define EXP_CONSTRAINT          		EXP_CONSTRAINTS_GRP "|" IOSN_CONSTRAINT
#define EXP_CHARACTER            		EXP_CONSTRAINTS_GRP "|" IOSN_CHARACTER


#define EXP_MRCUSTOMATTRIBUTES		 	EXP_GEOMETRY "|" IOSN_MRCUSTOMATTRIBUTES
#define EXP_MESHPRIMITIVE			 	EXP_GEOMETRY "|" IOSN_MESHPRIMITIVE
#define EXP_MESHTRIANGLE			 	EXP_GEOMETRY "|" IOSN_MESHTRIANGLE 
#define EXP_MESHPOLY				 	EXP_GEOMETRY "|" IOSN_MESHPOLY
#define EXP_NURB					 	EXP_GEOMETRY "|" IOSN_NURB
#define EXP_PATCH					 	EXP_GEOMETRY "|" IOSN_PATCH
#define EXP_BIP2FBX					 	EXP_GEOMETRY "|" IOSN_BIP2FBX
#define EXP_GEOMNORMALPERPOLY			EXP_GEOMETRY "|" IOSN_GEOMNORMALPERPOLY
#define EXP_TANGENTSPACE				EXP_GEOMETRY "|" IOSN_TANGENTS_BINORMALS
#define EXP_SMOOTHMESH                  EXP_GEOMETRY "|" IOSN_SMOOTH_MESH
#define EXP_SELECTIONSET                EXP_GEOMETRY "|" IOSN_SELECTION_SET

#define EXP_FINESTSUBDIVLEVEL			EXP_GEOMETRY "|" IOSN_FINESTSUBDIVLEVEL
#define EXP_MAXBONEASBONE				EXP_GEOMETRY "|" IOSN_MAXBONEASBONE
#define EXP_MAXNURBSSTEP				EXP_GEOMETRY "|" IOSN_MAXNURBSSTEP
#define EXP_CREASE              		EXP_GEOMETRY "|" IOSN_CREASE
#define EXP_BLINDDATA					EXP_GEOMETRY "|" IOSN_BLINDDATA
#define EXP_NURBSSURFACEAS				EXP_GEOMETRY "|" IOSN_GEOMETRYNURBSSURFACEAS
#define EXP_SMOOTHING_GROUPS			EXP_GEOMETRY "|" IOSN_SMOOTHING_GROUPS
#define EXP_HARDEDGES					EXP_GEOMETRY "|" IOSN_EXP_HARDEDGES
#define EXP_ANIMATIONONLY				EXP_GEOMETRY "|" IOSN_ANIMATIONONLY
#define EXP_INSTANCES					EXP_GEOMETRY "|" IOSN_INSTANCES
#define EXP_CONTAINEROBJECTS			EXP_GEOMETRY "|" IOSN_CONTAINEROBJECTS
#define EXP_TRIANGULATE					EXP_GEOMETRY "|" IOSN_TRIANGULATE
#define EXP_EDGE_ORIENTATION			EXP_GEOMETRY "|" IOSN_EDGE_ORIENTATION

#define EXP_SELECTIONSETNAMEASPOINTCACHE EXP_POINTCACHE "|" IOSN_SELECTIONSETNAMEASPOINTCACHE

#define EXP_GEOMETRYMESHPRIMITIVEAS  	EXP_GEOMETRY "|" IOSN_GEOMETRYMESHPRIMITIVEAS
#define EXP_GEOMETRYMESHTRIANGLEAS   	EXP_GEOMETRY "|" IOSN_GEOMETRYMESHTRIANGLEAS 
#define EXP_GEOMETRYMESHPOLYAS	     	EXP_GEOMETRY "|" IOSN_GEOMETRYMESHPOLYAS     
#define EXP_GEOMETRYNURBSAS	         	EXP_GEOMETRY "|" IOSN_GEOMETRYNURBSAS        
#define EXP_GEOMETRYPATCHAS          	EXP_GEOMETRY "|" IOSN_GEOMETRYPATCHAS        

#define EXP_BAKEFRAMESTART				EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMESTART			
#define EXP_BAKEFRAMEEND				EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMEEND			
#define EXP_BAKEFRAMESTEP				EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMESTEP	

#define EXP_BAKE_RESAMPLE_ANIMATION_CURVES EXP_BAKECOMPLEXANIMATION "|" IOSN_RESAMPLE_ANIMATION_CURVES

#define EXP_BAKEFRAMESTARTNORESET		EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMESTARTNORESET	
#define EXP_BAKEFRAMEENDNORESET			EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMEENDNORESET	
#define EXP_BAKEFRAMESTEPNORESET		EXP_BAKECOMPLEXANIMATION "|" IOSN_BAKEFRAMESTEPNORESET	

#define EXP_FBX                 		EXP_ADV_OPT_GRP "|" IOSN_FBX
#define EXP_DXF                 		EXP_ADV_OPT_GRP "|" IOSN_DXF
#define EXP_COLLADA             		EXP_ADV_OPT_GRP "|" IOSN_COLLADA

// note: EXP_FILEFORMAT group is not visible
#define EXP_OBJ                 		EXP_FILEFORMAT "|" IOSN_OBJ
#define EXP_3DS                 		EXP_FILEFORMAT "|" IOSN_3DS
#define EXP_MOTION_BASE         		EXP_FILEFORMAT "|" IOSN_MOTION_BASE
#define EXP_BIOVISION_BVH       		EXP_FILEFORMAT "|" IOSN_BIOVISION_BVH
#define EXP_ACCLAIM_ASF         		EXP_FILEFORMAT "|" IOSN_ACCLAIM_ASF
#define EXP_ACCLAIM_AMC         		EXP_FILEFORMAT "|" IOSN_ACCLAIM_AMC


#define EXP_ASCIIFBX                    EXP_FBX "|" IOSN_ASCIIFBX

#define EXP_CACHE_SIZE                  EXP_CACHE_GRP "|" IOSN_CACHE_SIZE

#define EXP_SHAPE               		EXP_DEFORMATION "|" IOSN_SHAPE
#define EXP_SKINS			    		EXP_DEFORMATION "|" IOSN_SKINS

#define EXP_APPLYCSTKEYRED              EXP_CURVEFILTERS "|" IOSN_APPLYCSTKEYRED
#define EXP_SAMPLINGRATE				EXP_APPLYCSTKEYRED "|" IOSN_SAMPLINGRATE
#define EXP_CSTKEYREDTPREC				EXP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDTPREC	
#define EXP_CSTKEYREDRPREC				EXP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDRPREC	
#define EXP_CSTKEYREDSPREC				EXP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDSPREC  
#define EXP_CSTKEYREDOPREC				EXP_APPLYCSTKEYRED "|" IOSN_CSTKEYREDOPREC  
#define EXP_AUTOTANGENTSONLY            EXP_APPLYCSTKEYRED "|" IOSN_AUTOTANGENTSONLY

#define EXP_APPLYKEYREDUCE				EXP_CURVEFILTERS "|" IOSN_APPLYKEYREDUCE  
#define EXP_KEYREDUCEPREC				EXP_APPLYKEYREDUCE "|" IOSN_KEYREDUCEPREC   
#define EXP_APPLYKEYSONFRM				EXP_APPLYKEYREDUCE "|" IOSN_APPLYKEYSONFRM  
#define EXP_APPLYKEYSYNC				EXP_APPLYKEYREDUCE "|" IOSN_APPLYKEYSYNC  

#define EXP_APPLYUNROLL					EXP_CURVEFILTERS "|" IOSN_APPLYUNROLL     
#define EXP_UNROLLPREC					EXP_APPLYUNROLL "|" IOSN_UNROLLPREC      
#define EXP_UNROLLPATH					EXP_APPLYUNROLL "|" IOSN_UNROLLPATH 
#define EXP_UNROLLFORCEAUTO             EXP_APPLYUNROLL "|" IOSN_UNROLLFORCEAUTO

#define EXP_PLUGIN_UI_WIDTH             EXP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_WIDTH
#define EXP_PLUGIN_UI_HEIGHT            EXP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_HEIGHT
#define EXP_PRESET_SELECTED             EXP_PLUGIN_GRP "|" IOSN_PRESET_SELECTED

#define EXP_UIL                         EXP_PLUGIN_GRP "|" IOSN_UIL
#define EXP_PLUGIN_PRODUCT_FAMILY       EXP_PLUGIN_GRP "|" IOSN_PLUGIN_PRODUCT_FAMILY

#define EXP_PLUGIN_UI_XPOS              EXP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_XPOS     
#define EXP_PLUGIN_UI_YPOS              EXP_PLUGIN_GRP "|" IOSN_PLUGIN_UI_YPOS     

#define EXP_BUTTON_WEB_UPDATE           EXP_INFORMATION_GRP "|" IOSN_BUTTON_WEB_UPDATE
#define EXP_PI_VERSION                  EXP_INFORMATION_GRP "|" IOSN_PI_VERSION

#define EXP_BUTTON_EDIT                 EXP_PLUGIN_GRP "|" IOSN_BUTTON_EDIT      
#define EXP_BUTTON_OK                   EXP_PLUGIN_GRP "|" IOSN_BUTTON_OK        
#define EXP_BUTTON_CANCEL               EXP_PLUGIN_GRP "|" IOSN_BUTTON_CANCEL    
#define EXP_MENU_EDIT_PRESET            EXP_PLUGIN_GRP "|" IOSN_MENU_EDIT_PRESET 
#define EXP_MENU_SAVE_PRESET            EXP_PLUGIN_GRP "|" IOSN_MENU_SAVE_PRESET 
// internal use
#define EXP_USETMPFILEPERIPHERAL	    EXP_PLUGIN_GRP "|" IOSN_USETMPFILEPERIPHERAL
#define EXP_CONSTRUCTIONHISTORY	        EXP_PLUGIN_GRP "|" IOSN_CONSTRUCTIONHISTORY
    
#define EXP_COLLADA_TRIANGULATE         EXP_COLLADA "|" IOSN_COLLADA_TRIANGULATE 
#define EXP_COLLADA_SINGLEMATRIX        EXP_COLLADA "|" IOSN_COLLADA_SINGLEMATRIX
#define EXP_COLLADA_FRAME_RATE          EXP_COLLADA "|" IOSN_COLLADA_FRAME_RATE  

#define EXP_DXF_TRIANGULATE             EXP_DXF "|" IOSN_DXF_TRIANGULATE
#define EXP_DXF_DEFORMATION             EXP_DXF "|" IOSN_DXF_DEFORMATION

#define EXP_OBJ_TRIANGULATE             EXP_OBJ "|" IOSN_OBJ_TRIANGULATE
#define EXP_OBJ_DEFORMATION             EXP_OBJ "|" IOSN_OBJ_DEFORMATION

#define EXP_3DS_REFERENCENODE           EXP_3DS "|" IOSN_3DS_REFERENCENODE	
#define EXP_3DS_TEXTURE                 EXP_3DS "|" IOSN_3DS_TEXTURE      	
#define EXP_3DS_MATERIAL                EXP_3DS "|" IOSN_3DS_MATERIAL     	
#define EXP_3DS_ANIMATION               EXP_3DS "|" IOSN_3DS_ANIMATION    	
#define EXP_3DS_MESH                    EXP_3DS "|" IOSN_3DS_MESH         	
#define EXP_3DS_LIGHT                   EXP_3DS "|" IOSN_3DS_LIGHT        	
#define EXP_3DS_CAMERA                  EXP_3DS "|" IOSN_3DS_CAMERA       	
#define EXP_3DS_AMBIENT_LIGHT           EXP_3DS "|" IOSN_3DS_AMBIENT_LIGHT	
#define EXP_3DS_RESCALING               EXP_3DS "|" IOSN_3DS_RESCALING    	
#define EXP_3DS_TEXUVBYPOLY             EXP_3DS "|" IOSN_3DS_TEXUVBYPOLY	

#define EXP_FBX_TEMPLATE                 EXP_FBX "|" IOSN_TEMPLATE
#define EXP_FBX_PIVOT                    EXP_FBX "|" IOSN_PIVOT
#define EXP_FBX_GLOBAL_SETTINGS          EXP_FBX "|" IOSN_GLOBAL_SETTINGS
#define EXP_FBX_CHARACTER                EXP_FBX "|" IOSN_CHARACTER
#define EXP_FBX_CONSTRAINT               EXP_FBX "|" IOSN_CONSTRAINT
#define EXP_FBX_GOBO                     EXP_FBX "|" IOSN_GOBO
#define EXP_FBX_SHAPE                    EXP_FBX "|" IOSN_SHAPE
#define EXP_FBX_MATERIAL                 EXP_FBX "|" IOSN_MATERIAL
#define EXP_FBX_TEXTURE                  EXP_FBX "|" IOSN_TEXTURE
#define EXP_FBX_MODEL                    EXP_FBX "|" IOSN_MODEL
#define EXP_FBX_ANIMATION                EXP_FBX "|" IOSN_ANIMATION
#define EXP_FBX_EMBEDDED                 EXP_FBX "|" IOSN_EMBEDDED 
#define EXP_FBX_PASSWORD                 EXP_FBX "|" IOSN_PASSWORD        
#define EXP_FBX_PASSWORD_ENABLE          EXP_FBX "|" IOSN_PASSWORD_ENABLE 
#define EXP_FBX_COLLAPSE_EXTERNALS       EXP_FBX "|" IOSN_COLLAPSE_EXTERNALS
#define EXP_FBX_COMPRESS_ARRAYS          EXP_FBX "|" IOSN_COMPRESS_ARRAYS
#define EXP_FBX_COMPRESS_LEVEL           EXP_FBX "|" IOSN_COMPRESS_LEVEL
#define EXP_FBX_COMPRESS_MINSIZE         EXP_FBX "|" IOSN_COMPRESS_MINSIZE
#define EXP_FBX_EMBEDDED_PROPERTIES_SKIP EXP_FBX "|" IOSN_EMBEDDED_PROPERTIES_SKIP
#define EXP_FBX_EXPORT_FILE_VERSION		 EXP_FBX "|" IOSN_EXPORT_FILE_VERSION


// end of export defined path
//---------------------------

//---------------------------
// Motion files related options
#define IOSN_MOTION_START									"MotionStart"
#define IOSN_MOTION_FRAME_COUNT								"MotionFrameCount"                       
#define IOSN_MOTION_FRAME_RATE								"MotionFrameRate"                        
#define IOSN_MOTION_ACTOR_PREFIX							"MotionActorPrefix"                      
#define IOSN_MOTION_RENAME_DUPLICATE_NAMES					"MotionRenameDuplicateNames"            
#define IOSN_MOTION_EXACT_ZERO_AS_OCCLUDED					"MotionExactZeroAsOccluded"            
#define IOSN_MOTION_SET_OCCLUDED_TO_LAST_VALID_POSITION		"MotionSetOccludedToLastValidPos"
#define IOSN_MOTION_AS_OPTICAL_SEGMENTS						"MotionAsOpticalSegments"               
#define IOSN_MOTION_ASF_SCENE_OWNED							"MotionASFSceneOwned" 
#define IOSN_MOTION_MOTION_FROM_GLOBAL_POSITION				"MotionFromGlobalPosition"
#define IOSN_MOTION_GAPS_AS_VALID_DATA						"MotionGapsAsValidData"  
#define IOSN_MOTION_C3D_REAL_FORMAT							"MotionC3DRealFormat"     
#define IOSN_MOTION_CREATE_REFERENCE_NODE					"MotionCreateReferenceNode"
#define IOSN_MOTION_TRANSLATION						    	"MotionTranslation"
#define IOSN_MOTION_BASE_T_IN_OFFSET						"MotionBaseTInOffset"
#define IOSN_MOTION_BASE_R_IN_PREROTATION					"MotionBaseRInPrerotation"
#define IOSN_MOTION_DUMMY_NODES						    	"MotionDummyNodes"
#define IOSN_MOTION_LIMITS						        	"MotionLimits"
#define IOSN_MOTION_FRAME_RATE_USED							"MotionFrameRateUsed"
#define IOSN_MOTION_FRAME_RANGE						    	"MotionFrameRange"
#define IOSN_MOTION_WRITE_DEFAULT_AS_BASE_TR                "MotionWriteDefaultAsBaseTR"

// Import

//Motion Base options
#define IMP_MOB_START										IMP_MOTION_BASE "|" IOSN_MOTION_START
#define IMP_MOB_FRAME_COUNT									IMP_MOTION_BASE "|" IOSN_MOTION_FRAME_COUNT
#define IMP_MOB_FRAME_RATE									IMP_MOTION_BASE "|" IOSN_MOTION_FRAME_RATE
#define IMP_MOB_ACTOR_PREFIX								IMP_MOTION_BASE "|" IOSN_MOTION_ACTOR_PREFIX
#define IMP_MOB_RENAME_DUPLICATE_NAMES						IMP_MOTION_BASE "|" IOSN_MOTION_RENAME_DUPLICATE_NAMES
#define IMP_MOB_EXACT_ZERO_AS_OCCLUDED						IMP_MOTION_BASE "|" IOSN_MOTION_EXACT_ZERO_AS_OCCLUDED
#define IMP_MOB_SET_OCCLUDED_TO_LAST_VALID_POSITION			IMP_MOTION_BASE "|" IOSN_MOTION_SET_OCCLUDED_TO_LAST_VALID_POSITION
#define IMP_MOB_AS_OPTICAL_SEGMENTS							IMP_MOTION_BASE "|" IOSN_MOTION_AS_OPTICAL_SEGMENTS
#define IMP_MOB_ASF_SCENE_OWNED								IMP_MOTION_BASE "|" IOSN_MOTION_ASF_SCENE_OWNED

// Acclaim AMC options
#define IMP_ACCLAIM_AMC_CREATE_REFERENCE_NODE				IMP_ACCLAIM_AMC "|" IOSN_MOTION_CREATE_REFERENCE_NODE
#define IMP_ACCLAIM_AMC_MOTION_BASE_T_IN_OFFSET         	IMP_ACCLAIM_AMC "|" IOSN_MOTION_BASE_T_IN_OFFSET
#define IMP_ACCLAIM_AMC_MOTION_BASE_R_IN_PREROTATION		IMP_ACCLAIM_AMC "|" IOSN_MOTION_BASE_R_IN_PREROTATION
#define IMP_ACCLAIM_AMC_DUMMY_NODES                         IMP_ACCLAIM_AMC "|" IOSN_MOTION_DUMMY_NODES
#define IMP_ACCLAIM_AMC_MOTION_LIMITS                       IMP_ACCLAIM_AMC "|" IOSN_MOTION_LIMITS

// Acclaim ASF options
#define IMP_ACCLAIM_ASF_CREATE_REFERENCE_NODE				IMP_ACCLAIM_ASF "|" IOSN_MOTION_CREATE_REFERENCE_NODE
#define IMP_ACCLAIM_ASF_MOTION_BASE_T_IN_OFFSET         	IMP_ACCLAIM_ASF "|" IOSN_MOTION_BASE_T_IN_OFFSET
#define IMP_ACCLAIM_ASF_MOTION_BASE_R_IN_PREROTATION    	IMP_ACCLAIM_ASF "|" IOSN_MOTION_BASE_R_IN_PREROTATION
#define IMP_ACCLAIM_ASF_DUMMY_NODES                         IMP_ACCLAIM_ASF "|" IOSN_MOTION_DUMMY_NODES 
#define IMP_ACCLAIM_ASF_MOTION_LIMITS                       IMP_ACCLAIM_ASF "|" IOSN_MOTION_LIMITS

// Biovision BVH options
#define IMP_BIOVISION_BVH_CREATE_REFERENCE_NODE				IMP_BIOVISION_BVH "|" IOSN_MOTION_CREATE_REFERENCE_NODE

// Motion Analysis HTR options
#define IMP_MOTIONANALYSIS_HTR_CREATE_REFERENCE_NODE		IMP_MOTIONANALYSIS_HTR "|" IOSN_MOTION_CREATE_REFERENCE_NODE
#define IMP_MOTIONANALYSIS_HTR_MOTION_BASE_T_IN_OFFSET  	IMP_MOTIONANALYSIS_HTR "|" IOSN_MOTION_BASE_T_IN_OFFSET
#define IMP_MOTIONANALYSIS_HTR_MOTION_BASE_R_IN_PREROTATION IMP_MOTIONANALYSIS_HTR "|" IOSN_MOTION_BASE_R_IN_PREROTATION  

// Export

//Motion Base options
#define EXP_MOB_START										EXP_MOTION_BASE "|" IOSN_MOTION_START
#define EXP_MOB_FRAME_COUNT									EXP_MOTION_BASE "|" IOSN_MOTION_FRAME_COUNT
#define EXP_MOB_FROM_GLOBAL_POSITION						EXP_MOTION_BASE "|" IOSN_MOTION_MOTION_FROM_GLOBAL_POSITION
#define EXP_MOB_FRAME_RATE									EXP_MOTION_BASE "|" IOSN_MOTION_FRAME_RATE
#define EXP_MOB_GAPS_AS_VALID_DATA							EXP_MOTION_BASE "|" IOSN_MOTION_GAPS_AS_VALID_DATA
#define EXP_MOB_C3D_REAL_FORMAT								EXP_MOTION_BASE "|" IOSN_MOTION_C3D_REAL_FORMAT
#define EXP_MOB_ASF_SCENE_OWNED								EXP_MOTION_BASE "|" IOSN_MOTION_ASF_SCENE_OWNED

//Acclaim AMC options
#define EXP_ACCLAIM_AMC_MOTION_TRANSLATION					EXP_ACCLAIM_AMC "|" IOSN_MOTION_TRANSLATION
#define EXP_ACCLAIM_AMC_FRAME_RATE_USED						EXP_ACCLAIM_AMC "|" IOSN_MOTION_FRAME_RATE_USED
#define EXP_ACCLAIM_AMC_FRAME_RANGE							EXP_ACCLAIM_AMC "|" IOSN_MOTION_FRAME_RANGE
#define EXP_ACCLAIM_AMC_WRITE_DEFAULT_AS_BASE_TR			EXP_ACCLAIM_AMC "|" IOSN_MOTION_WRITE_DEFAULT_AS_BASE_TR

//Acclaim ASF options
#define EXP_ACCLAIM_ASF_MOTION_TRANSLATION					EXP_ACCLAIM_ASF "|" IOSN_MOTION_TRANSLATION
#define EXP_ACCLAIM_ASF_FRAME_RATE_USED						EXP_ACCLAIM_ASF "|" IOSN_MOTION_FRAME_RATE_USED
#define EXP_ACCLAIM_ASF_FRAME_RANGE							EXP_ACCLAIM_ASF "|" IOSN_MOTION_FRAME_RANGE
#define EXP_ACCLAIM_ASF_WRITE_DEFAULT_AS_BASE_TR            EXP_ACCLAIM_ASF "|" IOSN_MOTION_WRITE_DEFAULT_AS_BASE_TR

//Biovision BVH options
#define EXP_BIOVISION_BVH_MOTION_TRANSLATION				EXP_BIOVISION_BVH "|" IOSN_MOTION_TRANSLATION

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_IO_SETTINGS_PATH_H_ */
