/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxfiletokens.h
#ifndef _FBXSDK_FILEIO_FILE_TOKENS_H_
#define _FBXSDK_FILEIO_FILE_TOKENS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//
// Summary
//
#define FIELD_SUMMARY                               "Summary"
#define FIELD_SUMMARY_VERSION                       "Version"
#define FIELD_SUMMARY_TEMPLATE                      "Template"
#define FIELD_SUMMARY_PASSWORD_PROTECTION           "PasswordProtection"
#define FIELD_SUMMARY_CONTENT_COUNT                 "ContentCount"
#define FIELD_SUMMARY_CONTENT_COUNT_MODEL           "Model"
#define FIELD_SUMMARY_CONTENT_COUNT_DEVICE          "Device"
#define FIELD_SUMMARY_CONTENT_COUNT_CHARACTER       "Character"
#define FIELD_SUMMARY_CONTENT_COUNT_ACTOR           "Actor"
#define FIELD_SUMMARY_CONTENT_COUNT_CONSTRAINT      "Constraint"
#define FIELD_SUMMARY_CONTENT_COUNT_MEDIA           "Media"
#define FIELD_SUMMARY_CONTENT_COUNT_COMPONENT       "Component"
#define FIELD_SUMMARY_TAKES                         "Takes"
#define FIELD_SUMMARY_TAKES_VERSION                 "Version"
#define FIELD_SUMMARY_TAKES_CURRENT                 "Current"
#define FIELD_SUMMARY_TAKES_TAKE                    "Take"
#define FIELD_SUMMARY_TAKES_TAKE_COMMENT            "Comments"
#define FIELD_SUMMARY_TAKES_TAKE_LOCAL_TIME         "LocalTime"
#define FIELD_SUMMARY_TAKES_TAKE_REFERENCE_TIME     "ReferenceTime"


//
// FbxObject references, document ownership
//
#define FIELD_KFBXOBJECT_REFERENCE_TO               "ReferenceTo"
#define FIELD_KFBXOBJECT_DOCUMENT                   "Doc"

// (sic)
#define FIELD_KFBXOBECT_REFERENCE_TO                FIELD_KFBXOBJECT_REFERENCE_TO

//
// FbxContainer
//
#define FIELD_KFBXCONTAINER_VERSION				"Version"
#define FIELD_KFBXCONTAINER_CONTAINER			"Container"


//
// Thumbnail
//
#define FIELD_THUMBNAIL                             "Thumbnail"
#define FIELD_THUMBNAIL_VERSION                     "Version"
#define FIELD_THUMBNAIL_SIZE                        "Size"
#define FIELD_THUMBNAIL_FORMAT                      "Format"
#define FIELD_THUMBNAIL_ENCODING                    "ImageEncoding"
#define FIELD_THUMBNAIL_IMAGE                       "ImageData"


//
// FbxGlobalLightSettings
//
#define FIELD_KFBXGLOBALLIGHTSETTINGS_VERSION           "Version"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_SHADOWPLANES      "ShadowPlanes"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_COUNT             "Count"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_PLANE             "Plane"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_USESHADOW         "UseShadow"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_SHADOWINTENSITY   "ShadowIntensity"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_AMBIENTRENDER     "AmbientRenderSettings"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_AMBIENTLIGHTCOLOR "AmbientLightColor"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGOPTIONS        "FogOptions"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGENABLE         "FlogEnable"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGMODE           "FogMode"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGDENSITY        "FogDensity"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGSTART          "FogStart"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGEND            "FogEnd"
#define FIELD_KFBXGLOBALLIGHTSETTINGS_FOGCOLOR          "FogColor"


//
// FbxGlobalCameraSettings
//
#define FIELD_KFBXGLOBALCAMERASETTINGS_RENDERER_SETTINGS "RendererSetting"
#define FIELD_KFBXGLOBALCAMERASETTINGS_DEFAULT_CAMERA "DefaultCamera"
#define FIELD_KFBXGLOBALCAMERASETTINGS_DEFAULT_VIEWING_MODE "DefaultViewingMode"
#define FIELD_KFBXGLOBALCAMERASETTINGS_SETTINGS "Settings"
#define FIELD_KFBXGLOBALCAMERASETTINGS_CAMERA "Camera"


//
// FbxGlobalTimeSettings
//
#define FIELD_KFBXGLOBALTIMESETTINGS_TIME_MODE "TimeMode"
#define FIELD_KFBXGLOBALTIMESETTINGS_FRAMERATE "FrameRate"
#define FIELD_KFBXGLOBALTIMESETTINGS_TIME_PROTOCOL "TimeFormat"
#define FIELD_KFBXGLOBALTIMESETTINGS_SNAP_ON_FRAMES "SnapOnFrames"
#define FIELD_KFBXGLOBALTIMESETTINGS_REFERENCE_TIME_INDEX "ReferenceTimeIndex"
#define FIELD_KFBXGLOBALTIMESETTINGS_REFERENCE_TIME_MARKER "TimeMarker"
#define FIELD_KFBXGLOBALTIMESETTINGS_REFERENCE_TIME "Time"
#define FIELD_KFBXGLOBALTIMESETTINGS_REFERENCE_LOOP "Loop"
#define FIELD_KFBXGLOBALTIMESETTINGS_TIMELINE_START_TIME "TimeLineStartTime"
#define FIELD_KFBXGLOBALTIMESETTINGS_TIMELINE_STOP_TIME "TimeLineStopTime"


//
// Media
//
#define FIELD_MEDIA_MEDIA               "Media"
#define FIELD_MEDIA_VIDEO               "Video"
#define FIELD_MEDIA_TYPE                "Type"
#define TOKEN_MEDIA_CLIP                "Clip"
#define FIELD_MEDIA_VERSION             "Version"
#define FIELD_MEDIA_ORIGINAL_FORMAT     "OriginalFormat"
#define FIELD_MEDIA_ORIGINAL_FILENAME   "OriginalFilename"
#define FIELD_MEDIA_FILENAME            "Filename"
#define FIELD_MEDIA_RELATIVE_FILENAME   "RelativeFilename"
#define FIELD_MEDIA_CONTENT             "Content"


//
// Properties
//
#define FIELD_PROPERTIES                "Properties"
#define FIELD_PROPERTIES_VERSION        "Version"
#define FIELD_USERPROPERTIES            "UserProperty"
#define FIELD_USERPROPERTIES_NAME       "Name"
#define FIELD_USERPROPERTIES_TYPE       "Type"
#define FIELD_USERPROPERTIES_LABEL      "Label"
#define FIELD_USERPROPERTIES_MIN        "Min"
#define FIELD_USERPROPERTIES_MAX        "Max"
#define FIELD_USERPROPERTIES_VALUE      "Value"


//
// FbxNode
//
#define FIELD_KFBXNODE_VERSION               "Version"
#define FIELD_KFBXNODE_ANIMATION_MODE        "AnimationMode"
#define FIELD_KFBXNODE_TYPE                  "Type"
#define FIELD_KFBXNODE_TYPE_FLAGS            "TypeFlags"
#define FIELD_KFBXNODE_MODEL                 "Model"
#define FIELD_KFBXNODE_HIDDEN                "Hidden"
#define FIELD_KFBXNODE_SHADING               "Shading"
#define FIELD_KFBXNODE_TRANSFORM             "Transform"
#define FIELD_KFBXNODE_DEFAULT               "Default"
#define FIELD_KFBXNODE_TRANSLATION           "T"
#define FIELD_KFBXNODE_ROTATION              "R"
#define FIELD_KFBXNODE_SCALING               "S"
#define FIELD_KFBXNODE_CHILDREN              "Children"

#define FIELD_KFBXNODE_CULLING_TYPE          "Culling"
#define TOKEN_KFBXNODE_CULLING_OFF           "CullingOff"
#define TOKEN_KFBXNODE_CULLING_ON_CCW        "CullingOnCCW"
#define TOKEN_KFBXNODE_CULLING_ON_CW         "CullingOnCW"

#define FIELD_KFBXNODE_LIMITS                "Limits"
#define FIELD_KFBXNODE_LIMITS_T_AUTO         "TAuto"
#define FIELD_KFBXNODE_LIMITS_R_AUTO         "RAuto"
#define FIELD_KFBXNODE_LIMITS_S_AUTO         "SAuto"
#define FIELD_KFBXNODE_LIMITS_T_ENABLE       "TEnable"
#define FIELD_KFBXNODE_LIMITS_R_ENABLE       "REnable"
#define FIELD_KFBXNODE_LIMITS_S_ENABLE       "SEnable"
#define FIELD_KFBXNODE_LIMITS_T_X_DEFAULT    "TXDefault"
#define FIELD_KFBXNODE_LIMITS_T_Y_DEFAULT    "TYDefault"
#define FIELD_KFBXNODE_LIMITS_T_Z_DEFAULT    "TZDefault"
#define FIELD_KFBXNODE_LIMITS_R_X_DEFAULT    "RXDefault"
#define FIELD_KFBXNODE_LIMITS_R_Y_DEFAULT    "RYDefault"
#define FIELD_KFBXNODE_LIMITS_R_Z_DEFAULT    "RZDefault"
#define FIELD_KFBXNODE_LIMITS_S_X_DEFAULT    "SXDefault"
#define FIELD_KFBXNODE_LIMITS_S_Y_DEFAULT    "SYDefault"
#define FIELD_KFBXNODE_LIMITS_S_Z_DEFAULT    "SZDefault"
#define FIELD_KFBXNODE_LIMITS_T_X_MIN        "TXMin"
#define FIELD_KFBXNODE_LIMITS_T_Y_MIN        "TYMin"
#define FIELD_KFBXNODE_LIMITS_T_Z_MIN        "TZMin"
#define FIELD_KFBXNODE_LIMITS_R_X_MIN        "RXMin"
#define FIELD_KFBXNODE_LIMITS_R_Y_MIN        "RYMin"
#define FIELD_KFBXNODE_LIMITS_R_Z_MIN        "RZMin"
#define FIELD_KFBXNODE_LIMITS_S_X_MIN        "SXMin"
#define FIELD_KFBXNODE_LIMITS_S_Y_MIN        "SYMin"
#define FIELD_KFBXNODE_LIMITS_S_Z_MIN        "SZMin"
#define FIELD_KFBXNODE_LIMITS_T_X_MAX        "TXMax"
#define FIELD_KFBXNODE_LIMITS_T_Y_MAX        "TYMax"
#define FIELD_KFBXNODE_LIMITS_T_Z_MAX        "TZMax"
#define FIELD_KFBXNODE_LIMITS_R_X_MAX        "RXMax"
#define FIELD_KFBXNODE_LIMITS_R_Y_MAX        "RYMax"
#define FIELD_KFBXNODE_LIMITS_R_Z_MAX        "RZMax"
#define FIELD_KFBXNODE_LIMITS_S_X_MAX        "SXMax"
#define FIELD_KFBXNODE_LIMITS_S_Y_MAX        "SYMax"
#define FIELD_KFBXNODE_LIMITS_S_Z_MAX        "SZMax"
#define FIELD_KFBXNODE_LIMITS_R_TYPE         "RType"
#define FIELD_KFBXNODE_LIMITS_R_CLAMP_TYPE   "RClampType"
#define FIELD_KFBXNODE_LIMITS_R_X_AXIS       "RXAxis"
#define FIELD_KFBXNODE_LIMITS_R_Y_AXIS       "RYAxis"
#define FIELD_KFBXNODE_LIMITS_R_Z_AXIS       "RZAxis"
#define FIELD_KFBXNODE_LIMITS_AXIS_LENGTH    "AxisLen"

#define FIELD_KFBXNODE_TARGET                "LookAtModel"
#define FIELD_KFBXNODE_UP_VECTOR_MODEL       "UpVectorModel"
#define FIELD_KFBXNODE_POST_TARGET_ROTATION  "PostTargetRotation"
#define FIELD_KFBXNODE_TARGET_UP_VECTOR      "UpTargetRotation"

#define FIELD_KFBXNODE_PIVOTS                "Pivots"
#define FIELD_KFBXNODE_PACKAGE               "Package"
#define FIELD_KFBXNODE_FILE                  "File"
#define FIELD_KFBXNODE_TRANSLATION_OFFSET    "TranslationOffset"
#define FIELD_KFBXNODE_ROTATION_PIVOT        "RotationPivot"
#define FIELD_KFBXNODE_PRE_ROTATION          "PreRotation"
#define FIELD_KFBXNODE_POST_ROTATION         "PostRotation"
#define FIELD_KFBXNODE_SCALING_PIVOT         "ScalingPivot"
#define FIELD_KFBXNODE_PIVOT_ENABLED         "PivotEnabled"

//
// FbxGenericNode
//
#define FIELD_KFBXGENERICNODE_VERSION        "Version"
#define FIELD_KFBXGENERICNODE_GENERICNODE    "GenericNode"

//
// FbxGeometry
//
#define FIELD_KFBXGEOMETRY_MATERIAL              "Material"
#define FIELD_KFBXGEOMETRY_TEXTURE               "Texture"
#define FIELD_KFBXGEOMETRY_LINK                  "Link"
#define FIELD_KFBXGEOMETRY_SHAPE                 "Shape"

//
// FbxMarker
//
#define FIELD_KFBXMARKER_LOOK                    "Look"
#define FIELD_KFBXMARKER_SIZE                    "Size"
#define FIELD_KFBXMARKER_COLOR                   "Color"
#define FIELD_KFBXMARKER_SHOW_LABEL              "ShowLabel"
#define FIELD_KFBXMARKER_IK_PIVOT                "IKPivot"
#define FIELD_KFBXMARKER_IK_REACH_TRANSLATION    "IKReachTranslation"
#define FIELD_KFBXMARKER_IK_REACH_ROTATION       "IKReachRotation"
#define FIELD_KFBXMARKER_IK_PULL                 "IKPull"
#define FIELD_KFBXMARKER_IK_PULL_HIPS            "IKPullHips"

//
// FbxCamera
//
#define FIELD_KFBXGEOMETRYCAMERA_VERSION                     "Version"
#define FIELD_KFBXGEOMETRYCAMERA_GEOMETRY_VERSION            "GeometryVersion"
#define FIELD_KFBXGEOMETRYCAMERA_NAME                        "Name"

// Camera Position and Orientation
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_POSITION             "Position"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_UP_VECTOR            "Up"
#define FIELD_KFBXGEOMETRYCAMERA_DEFAULT_CAMERA_INTEREST_POSITION "LookAt"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_ROLL                 "Roll"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_TURNTABLE            "TurnTable"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_PROJECTION_TYPE      "Type"

// Viewing Area Controls
#define FIELD_KFBXGEOMETRYCAMERA_FORMAT_NAME                 "FormatName"
#define TOKEN_KFBXGEOMETRYCAMERA_NTSC                        "NTSC"
#define TOKEN_KFBXGEOMETRYCAMERA_D1_NTSC                     "D1 NTSC"
#define TOKEN_KFBXGEOMETRYCAMERA_PAL                         "PAL"
#define TOKEN_KFBXGEOMETRYCAMERA_D1_PAL                      "D1 PAL"
#define TOKEN_KFBXGEOMETRYCAMERA_HD                          "HD"
#define TOKEN_KFBXGEOMETRYCAMERA_640x480                     "640x480"
#define TOKEN_KFBXGEOMETRYCAMERA_320x200                     "320x200"
#define TOKEN_KFBXGEOMETRYCAMERA_320x240                     "320x240"
#define TOKEN_KFBXGEOMETRYCAMERA_128x128                     "128x128"
#define TOKEN_KFBXGEOMETRYCAMERA_FULL_SCREEN                 "Full Screen"
#define TOKEN_KFBXGEOMETRYCAMERA_CUSTOM_FORMAT               "Custom"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_ASPECT_TYPE          "AspectType"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_ASPECT_WIDTH         "AspectW"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_ASPECT_HEIGHT        "AspectH"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_PIXEL_RATIO          "PixelRatio"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_NEAR_PLANE           "NearPlane"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_FAR_PLANE            "FarPlane"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_LOCK                 "CameraLock"

// Aperture and Film Controls
#define FIELD_KFBXGEOMETRYCAMERA_APERTURE_FORMAT_NAME        "ApertureFormat"
#define TOKEN_KFBXGEOMETRYCAMERA_16MM_THEATRICAL             "16mm Theatrical"
#define TOKEN_KFBXGEOMETRYCAMERA_SUPER_16MM                  "Super 16mm"
#define TOKEN_KFBXGEOMETRYCAMERA_35MM_ACADEMY                "35mm Academy"
#define TOKEN_KFBXGEOMETRYCAMERA_35MM_TV_PROJECTION          "35mm TV Projection"
#define TOKEN_KFBXGEOMETRYCAMERA_35MM_FULL_APERTURE          "35mm Full Aperture"
#define TOKEN_KFBXGEOMETRYCAMERA_35MM_185_PROJECTION         "35mm 1.85 Projection"
#define TOKEN_KFBXGEOMETRYCAMERA_35MM_ANAMORPHIC             "35mm Anamorphic"
#define TOKEN_KFBXGEOMETRYCAMERA_70MM_PROJECTION             "70mm Projection"
#define TOKEN_KFBXGEOMETRYCAMERA_VISTA_VISION                "VistaVision"
#define TOKEN_KFBXGEOMETRYCAMERA_DYNAVISION                  "Dynavision"
#define TOKEN_KFBXGEOMETRYCAMERA_IMAX                        "Imax"
#define TOKEN_KFBXGEOMETRYCAMERA_CUSTOM_APERTURE_FORMAT      "Custom"
#define FIELD_KFBXGEOMETRYCAMERA_APERTURE_MODE               "ApertureMode"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_APERTURE_DIMENSION   "CameraAperture"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_SQUEEZERATIO         "SqueezeRatio"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_FOCAL_LENGTH         "FocalLength"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_APERTURE             "Aperture"

#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_APERTURE_X           "FieldOfViewXProperty"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_APERTURE_Y           "FieldOfViewYProperty"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_OPTICAL_CENTER_X     "OpticalCenterXProperty"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_OPTICAL_CENTER_Y     "OpticalCenterYProperty"

// Background Properties
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_MEDIA_NAME             "Media"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_TEXTURE                "BackgroundTexture"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_VIDEO_CLIP_TEXTURE     "VideoClipTexture"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_DISPLAY_MODE           "ViewFrustumPlane"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_DRAWING_MODE           "BackgroundMode"
#define FIELD_KFBXGEOMETRYCAMERA_FOREGROUND_MATTE_THRESHOLD_ENABLE "ForegroundTransparent"
#define FIELD_KFBXGEOMETRYCAMERA_FOREGROUND_MATTE_TRESHOLD         "BackgroundTreshold"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_PLACEMENT_OPTIONS      "DisplayMode"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_DISTANCE               "ViewFrustumPlaneDistance"
#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_DISTANCE_MODE          "ViewFrustumPlaneDistanceMode"

// Camera View Options
#define FIELD_KFBXGEOMETRYCAMERA_VIEW_CAMERA_INTEREST        "ViewLookAt"
#define FIELD_KFBXGEOMETRYCAMERA_VIEW_NEAR_FAR_PLANES        "ViewFrustum"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_GRID                   "ShowGrid"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_AXIS                   "ShowAzimut"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_NAME                   "ShowName"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_INFO_ON_MOVING         "ShowInfoOnMoving"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_TIME_CODE              "ShowTimeCode"
#define FIELD_KFBXGEOMETRYCAMERA_DISPLAY_SAFE_AREA           "DisplaySafeArea"
#define FIELD_KFBXGEOMETRYCAMERA_SAFE_AREA_STYLE             "SafeAreaStyle"
#define FIELD_KFBXGEOMETRYCAMERA_DISPLAY_SAFE_AREA_ON_RENDER "DisplaySafeAreaOnRender"
#define FIELD_KFBXGEOMETRYCAMERA_SHOW_AUDIO                  "ShowAudio"

#define FIELD_KFBXGEOMETRYCAMERA_BACKGROUND_COLOR            "BackGroundColor"
#define FIELD_KFBXGEOMETRYCAMERA_AUDIO_COLOR                 "AudioColor"
#define FIELD_KFBXGEOMETRYCAMERA_USE_FRAME_COLOR             "UseFrameColor"
#define FIELD_KFBXGEOMETRYCAMERA_FRAME_COLOR                 "FrameColor"
#define FIELD_KFBXGEOMETRYCAMERA_ORTHO_ZOOM                  "CameraOrthoZoom"

// Rendering Options
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_LENS                 "CameraAndLens"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_LENS_DEPTH_OF_FIELD  "DepthOfField"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_LENS_ANTIALIASING    "Antialiasing"
#define FIELD_KFBXGEOMETRYCAMERA_CAMERA_LENS_OVERSAMPLING    "OverSampling"
#define FIELD_KFBXGEOMETRYCAMERA_RENDER_OPTIONS_USAGE_TIME   "UseOverSamplingTime"

//
// FbxCameraStereo
//
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_VERSION                     "Version"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_GEOMETRY_VERSION            "GeometryVersion"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_NAME                        "Name"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_STEREO                      "Stereo"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_INTERAXIAL_SEP              "InteraxialSeparation"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_ZERO_PARALLAX               "ZeroParallax"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_TOE_IN_ADJUST               "ToeInAdjust"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_FILM_OFFSET_RIGHT_CAM       "FilmOffsetRightCam"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_FILM_OFFSET_LEFT_CAM        "FilmOffsetLeftCam"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_PRECOMP_FILE_NAME           "PrecompFileName"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_RELATIVE_PRECOMP_FILE_NAME  "RelativePrecompFileName"
#define FIELD_KFBXGEOMETRYCAMERA_STEREO_PRECOMP_FILE_CONTENT        "PrecompFileContent"

//
// FbxCameraSwitcher
//
#define FIELD_KFBXGEOMETRYCAMERASWITCHER_SWITCHER            "Switcher"
#define FIELD_KFBXGEOMETRYCAMERASWITCHER_NAME                "Name"
#define FIELD_KFBXGEOMETRYCAMERASWITCHER_CAMERA_ID           "CameraId"
#define FIELD_KFBXGEOMETRYCAMERASWITCHER_CAMERA_NAME         "CameraName"
#define FIELD_KFBXGEOMETRYCAMERASWITCHER_CAMERA_INDEX_NAME   "CameraIndexName"


//
// FbxLight
//
#define FIELD_KFBXGEOMETRYLIGHT_GEOMETRY_VERSION      "GeometryVersion"
#define FIELD_KFBXGEOMETRYLIGHT_LIGHT_TYPE            "LightType"
#define FIELD_KFBXGEOMETRYLIGHT_LIGHT_TYPE_VERSION    "LightTypeVersion"
#define FIELD_KFBXGEOMETRYLIGHT_CAST_LIGHT            "CastLight"


//
// FbxMesh
//
#define FIELD_KFBXGEOMETRYMESH_UV_VERSION            "Version"
#define FIELD_KFBXGEOMETRYMESH_GEOMETRY_VERSION      "GeometryVersion"
#define FIELD_KFBXGEOMETRYMESH_VERTICES              "Vertices"
#define FIELD_KFBXGEOMETRYMESH_EDGES                 "Edges"
#define FIELD_KFBXGEOMETRYMESH_INTERNAL_EDGES        "InternalEdges"
#define FIELD_KFBXGEOMETRYMESH_NORMALS               "Normals"
#define FIELD_KFBXGEOMETRYMESH_NORMALS_WCOMPONENT    "NormalsW"
#define FIELD_KFBXGEOMETRYMESH_BINORMALS             "Binormals"
#define FIELD_KFBXGEOMETRYMESH_BINORMALS_WCOMPONENT  "BinormalsW"
#define FIELD_KFBXGEOMETRYMESH_TANGENTS              "Tangents"
#define FIELD_KFBXGEOMETRYMESH_TANGENTS_WCOMPONENT   "TangentsW"
#define FIELD_KFBXGEOMETRYMESH_NORMALS_INDEX         "NormalsIndex"
#define FIELD_KFBXGEOMETRYMESH_BINORMALS_INDEX       "BinormalsIndex"
#define FIELD_KFBXGEOMETRYMESH_TANGENTS_INDEX        "TangentsIndex"
#define FIELD_KFBXGEOMETRYMESH_MATERIAL_ASSIGNATION  "MaterialAssignation"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_ASSIGNATION   "TextureMode"
#define FIELD_KFBXGEOMETRYMESH_POLYGON_INDEX         "PolygonVertexIndex"
#define FIELD_KFBXGEOMETRYMESH_POLYGON_GROUP         "PolygonGroup"
#define FIELD_KFBXGEOMETRYMESH_MATERIALS_ID          "Materials"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_ID            "TextureId"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_TYPE          "TextureType"
#define FIELD_KFBXGEOMETRYMESH_UV_TYPE               "UVType"
#define FIELD_KFBXGEOMETRYMESH_MAPPING_INFO_TYPE     "MappingInformationType"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_UV            "TextureUV"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_POLYGON_UV    "TexturePUV"
#define FIELD_KFBXGEOMETRYMESH_GEOMETRY_UV_INFO      "GeometryUVInfo"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_VERTEX_INDEX  "TextureVertexIndex"
#define FIELD_KFBXGEOMETRYMESH_TEXTURE_UV_INDEX      "TextureUVVerticeIndex"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_COLOR_INFO        "VertexColorInfo"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_COLOR_VERSION     "Version"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_COLOR_ASSIGNATION "MappingInformationType"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_COLOR_VALUES      "Colors"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_COLOR_INDEX       "ColorIndex"
#define FIELD_KFBXGEOMETRYMESH_SMOOTHING             "Smoothing"
#define FIELD_KFBXGEOMETRYMESH_VERTEX_CREASE         "VertexCrease"
#define FIELD_KFBXGEOMETRYMESH_EDGE_CREASE           "EdgeCrease"
#define FIELD_KFBXGEOMETRYMESH_HOLE                  "Hole"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA             "UserData"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_INDEX       "UserDataIndex"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_TYPE        "UserDataType"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_DIRECT_INDICES "UserDataDirectIndices"// remove me
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_DIRECT_COUNT   "UserDataDirectCount" //remove me
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_ID          "UserDataId"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_ARRAY       "UserDataArray"
#define FIELD_KFBXGEOMETRYMESH_USER_DATA_NAME        "UserDataName"
#define FIELD_KFBXGEOMETRYMESH_VISIBILITY             "Visibility"
#define FIELD_KFBXGEOMETRYMESH_SMOOTHNESS             "Smoothness"
#define FIELD_KFBXGEOMETRYMESH_PREVIEW_DIVSION_LEVELS    "PreviewDivisionLevels"
#define FIELD_KFBXGEOMETRYMESH_RENDER_DIVSION_LEVELS    "RenderDivisionLevels"
#define FIELD_KFBXGEOMETRYMESH_DISPLAY_SUBDIVISIONS     "DisplaySubdivisions"
#define FIELD_KFBXGEOMETRYMESH_PRESERVE_BORDERS         "PreserveBorders"
#define FIELD_KFBXGEOMETRYMESH_PRESERVE_HARD_EDGES      "PreserveHardEdges"
#define FIELD_KFBXGEOMETRYMESH_PROPAGATE_EDGE_HARDNESS  "PropagateEdgeHardness"
#define FIELD_KFBXGEOMETRYMESH_BOUNDARY_RULE            "BoundaryRule"

#define FIELD_KFBXGEOMETRYMESH_U_EXTENDED_COUNT      "UExtendedCount"
#define FIELD_KFBXGEOMETRYMESH_U_CLOSED              "UClosed"
#define FIELD_KFBXGEOMETRYMESH_U_TOPCAP              "UTopCap"
#define FIELD_KFBXGEOMETRYMESH_U_STEP                "UStep"
#define FIELD_KFBXGEOMETRYMESH_U_COUNT               "UCount"

#define FIELD_KFBXGEOMETRYMESH_V_EXTENDED_COUNT      "VExtendedCount"
#define FIELD_KFBXGEOMETRYMESH_V_CLOSED              "VClosed"
#define FIELD_KFBXGEOMETRYMESH_V_TOPCAP              "VTopCap"
#define FIELD_KFBXGEOMETRYMESH_V_STEP                "VStep"
#define FIELD_KFBXGEOMETRYMESH_V_COUNT               "VCount"

#define TOKEN_KFBXGEOMETRYMESH_NO_MAPPING_INFORMATION "NoMappingInformation"
#define TOKEN_KFBXGEOMETRYMESH_BY_VERTICE            "ByVertice"
#define TOKEN_KFBXGEOMETRYMESH_BY_POLYGON            "ByPolygon"
#define TOKEN_KFBXGEOMETRYMESH_BY_POLYGON_VERTEX     "ByPolygonVertex"
#define TOKEN_KFBXGEOMETRYMESH_BY_FACE               "ByFace"
#define TOKEN_KFBXGEOMETRYMESH_BY_EDGE               "ByEdge"
#define TOKEN_KFBXGEOMETRYMESH_ALL_SAME              "AllSame"
#define TOKEN_KFBXGEOMETRYMESH_BY_MODEL              "ByModel"

//
// FbxSubDiv
//
#define FIELD_KFBXGEOMETRYSUBDIV_GEOMETRY               "SubdivGeometry"
#define FIELD_KFBXGEOMETRYSUBDIV_GEOMETRY_VERSION       "GeometryVersion"
#define FIELD_KFBXGEOMETRYSUBDIV_LEVEL_COUNT            "LevelCount"
#define FIELD_KFBXGEOMETRYSUBDIV_CURRENT_LEVEL          "CurrentLevel"
#define FIELD_KFBXGEOMETRYSUBDIV_DISPLAY_SMOOTHNESS     "Smoothness"

//
// Reference
//
#define TOKEN_REFERENCE_DIRECT                      "Direct"
#define TOKEN_REFERENCE_INDEX                       "Index"
#define TOKEN_REFERENCE_INDEX_TO_DIRECT             "IndexToDirect"

//
// FbxNurbs
//
#define FIELD_KFBXGEOMETRYNURB_NURB_VERSION          "NurbVersion"
#define FIELD_KFBXGEOMETRYNURB_NURB_ORDER            "NurbOrder"
#define FIELD_KFBXGEOMETRYNURB_DIMENSION             "Dimensions"
#define FIELD_KFBXGEOMETRYNURB_STEP                  "Step"
#define FIELD_KFBXGEOMETRYNURB_FORM                  "Form"
#define FIELD_KFBXGEOMETRYNURB_UCAPPED               "UCapped"
#define FIELD_KFBXGEOMETRYNURB_VCAPPED               "VCapped"
#define FIELD_KFBXGEOMETRYNURB_POINTS                "Points"
#define FIELD_KFBXGEOMETRYNURB_MULTIPLICITY_U        "MultiplicityU"
#define FIELD_KFBXGEOMETRYNURB_MULTIPLICITY_V        "MultiplicityV"
#define FIELD_KFBXGEOMETRYNURB_KNOTVECTOR_U          "KnotVectorU"
#define FIELD_KFBXGEOMETRYNURB_KNOTVECTOR_V          "KnotVectorV"
#define FIELD_KFBXGEOMETRYNURB_MATERIALS             "Materials"
#define FIELD_KFBXGEOMETRYNURB_SURFACE_DISPLAY       "SurfaceDisplay"

//
// FbxNurbsSurface
//
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_NURB_VERSION          "NurbsSurfaceVersion"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_NURB_ORDER            "NurbsSurfaceOrder"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_DIMENSION             "Dimensions"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_STEP                  "Step"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_FORM                  "Form"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_UCAPPED               "UCapped"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_VCAPPED               "VCapped"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_POINTS                "Points"
//#define FIELD_KFBXGEOMETRYNURBS_SURFACE_MULTIPLICITY_U        "MultiplicityU"
//#define FIELD_KFBXGEOMETRYNURBS_SURFACE_MULTIPLICITY_V        "MultiplicityV"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_KNOTVECTOR_U          "KnotVectorU"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_KNOTVECTOR_V          "KnotVectorV"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_MATERIALS             "Materials"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_SURFACE_DISPLAY       "SurfaceDisplay"
#define FIELD_KFBXGEOMETRYNURBS_SURFACE_FLIP_NORMALS          "FlipNormals"

//
// FbxTrimNurbsSurface
//
#define FIELD_KFBXGEOMETRYTRIM_NURBS_SURFACE_VERSION          "TrimmedNurbVersion"
#define FIELD_KFBXGEOMETRYTRIM_NURBS_SURFACE_FLIP_NORMALS     "FlipNormals"
//#define FIELD_KFBXGEOMETRYTRIM_NURB_SURFACE          "NurbSurface"
//#define FIELD_KFBXGEOMETRYTRIM_NURB_BOUNDARY         "TrimBoundary"
//#define FIELD_KFBXGEOMETRYTRIM_NURB_EDGE             "BoundaryEdge"

//
// FbxBoundary
//
#define FIELD_KFBXGEOMETRYBOUNDARY_VERSION          "BoundaryVersion"

//
// FbxLine
//
#define FIELD_KFBXGEOMETRYLINE_VERSION          "LineVersion"
#define FIELD_KFBXGEOMETRYLINE_POINTS           "Points"
#define FIELD_KFBXGEOMETRYLINE_POINTS_INDEX     "PointsIndex"

//
// FbxSubDiv
//
#define FIELD_KFBXGEOMETRYSUBDIVISION_VERSION          "SubdivisionVersion"

//
// FbxNurbsCurve
//
#define FIELD_KFBXGEOMETRYNURBS_CURVE_VERSION          "NurbsCurveVersion"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_ORDER            "Order"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_DIMENSION        "Dimension"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_KNOTVECTOR       "KnotVector"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_FORM             "Form"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_POINTS           "Points"
#define FIELD_KFBXGEOMETRYNURBS_CURVE_RATIONAL         "Rational"

//
// FbxPatch
//
#define FIELD_KFBXGEOMETRYPATCH_PATCH_VERSION         "PatchVersion"
#define FIELD_KFBXGEOMETRYPATCH_PATCH_TYPE            "PatchType"
#define FIELD_KFBXGEOMETRYPATCH_DIMENSIONS            "Dimensions"
#define FIELD_KFBXGEOMETRYPATCH_STEP                  "Step"
#define FIELD_KFBXGEOMETRYPATCH_CLOSED                "Closed"
#define FIELD_KFBXGEOMETRYPATCH_UCAPPED               "UCapped"
#define FIELD_KFBXGEOMETRYPATCH_VCAPPED               "VCapped"
#define FIELD_KFBXGEOMETRYPATCH_POINTS                "Points"
#define FIELD_KFBXGEOMETRYPATCH_SURFACE_DISPLAY       "SurfaceDisplay"
#define FIELD_KFBXGEOMETRYPATCH_MATERIALS             "Materials"


//
// FbxGeometryWeightedMap
//

#define FIELD_KFBXGEOMETRY_WEIGHTED_MAP_VERSION         "Version"
#define FIELD_KFBXGEOMETRY_WEIGHTED_MAP_SRC_COUNT       "SourceCount"
#define FIELD_KFBXGEOMETRY_WEIGHTED_MAP_DST_COUNT       "DestinationCount"
#define FIELD_KFBXGEOMETRY_WEIGHTED_MAP_INDEX_MAPPING   "IndexMapping"

//
// FbxSkeleton
//
#define FIELD_KFBXGEOMETRYSKELETON_LIMB_LENGTH           "LimbLength"
#define FIELD_KFBXGEOMETRYSKELETON_LIMB_NODE_SIZE        "Size"
#define FIELD_KFBXGEOMETRYSKELETON_LIMB_NODE_COLOR       "Color"

//
// FbxVideo
//
#define FIELD_KFBXVIDEO_USEMIPMAP                               "UseMipMap"

//
// FbxTexture
//
#define FIELD_KFBXTEXTURE_TEXTURE                               "Texture"
#define FIELD_KFBXTEXTURE_TYPE                                  "Type"
#define FIELD_KFBXTEXTURE_VERSION                               "Version"
#define FIELD_KFBXTEXTURE_TEXTURE_NAME                          "TextureName"
#define FIELD_KFBXTEXTURE_MEDIA                                 "Media"
#define FIELD_KFBXTEXTURE_FILENAME                              "FileName"
#define FIELD_KFBXTEXTURE_RELATIVE_FILENAME                     "RelativeFilename"
#define FIELD_KFBXTEXTURE_TRANSLATION                           "Translation"
#define FIELD_KFBXTEXTURE_SCALING                               "Scaling"
#define FIELD_KFBXTEXTURE_UV_TRANSLATION                        "ModelUVTranslation"
#define FIELD_KFBXTEXTURE_UV_SCALING                            "ModelUVScaling"
#define FIELD_KFBXTEXTURE_ROTATION                              "Rotation"
#define FIELD_KFBXTEXTURE_TILING                                "Tilling"
#define FIELD_KFBXTEXTURE_ALPHA_SRC                             "Texture_Alpha_Source"
#define FIELD_KFBXTEXTURE_CROPPING                              "Cropping"
#define FIELD_KFBXTEXTURE_MAPPING_TYPE                          "Texture_Mapping_Type"
#define FIELD_KFBXTEXTURE_PLANAR_NORMAL                         "Texture_Planar_Mapping_Normal"
#define FIELD_KFBXTEXTURE_SWAPUV                                "SwapUV"
#define FIELD_KFBXTEXTURE_MATERIAL_USE                          "MaterialMode"
#define FIELD_KFBXTEXTURE_TEXTURE_USE                           "TextureUse"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_STANDARD                  "Standard"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_SHADOW_MAP                "ShadowMap"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_LIGHT_MAP                 "LightMap"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_SPHERICAL_REFLEXION_MAP   "SphericalReflexionMap"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_SPHERE_REFLEXION_MAP      "SphereReflexionMap"
#define TOKEN_KFBXTEXTURE_TEXTURE_USE_BUMP_NORMAL_MAP           "BumpNormalMap"
#define TOKEN_KFBXTEXTURE_BLEND_TRANSLUCENT                     "Translucent"
#define TOKEN_KFBXTEXTURE_BLEND_ADD                             "Add"
#define TOKEN_KFBXTEXTURE_BLEND_MODULATE                        "Modulate"
#define TOKEN_KFBXTEXTURE_BLEND_MODULATE2                       "Modulate2"
#define TOKEN_KFBXTEXTURE_BLEND_OVER                            "Over"
#define TOKEN_KFBXTEXTURE_BLEND_NORMAL                          "Normal"
#define TOKEN_KFBXTEXTURE_BLEND_DISSOLVE                        "Dissolve"
#define TOKEN_KFBXTEXTURE_BLEND_DARKEN		                    "Darken"
#define TOKEN_KFBXTEXTURE_BLEND_COLORBURN                       "Colorburn"
#define TOKEN_KFBXTEXTURE_BLEND_LINEARBURN 	                    "Linearburn"
#define TOKEN_KFBXTEXTURE_BLEND_DARKERCOLOR                     "Darkercolor"
#define TOKEN_KFBXTEXTURE_BLEND_LIGHTEN		                    "Lighten"
#define TOKEN_KFBXTEXTURE_BLEND_SCREEN		                    "Screen	"
#define TOKEN_KFBXTEXTURE_BLEND_COLORDODGE                      "Colordodge"
#define TOKEN_KFBXTEXTURE_BLEND_LINEARDODGE                     "Lineardodge"
#define TOKEN_KFBXTEXTURE_BLEND_LIGHTERCOLOR                    "Lightercolor"
#define TOKEN_KFBXTEXTURE_BLEND_SOFTLIGHT		                "Softlight"
#define TOKEN_KFBXTEXTURE_BLEND_HARDLIGHT		                "Hardlight	"
#define TOKEN_KFBXTEXTURE_BLEND_VIVIDLIGHT                      "Vividlight"
#define TOKEN_KFBXTEXTURE_BLEND_LINEARLIGHT                     "Linearlight"
#define TOKEN_KFBXTEXTURE_BLEND_PINLIGHT 		                "Pinlight"
#define TOKEN_KFBXTEXTURE_BLEND_HARDMIX		                    "Hardmix"
#define TOKEN_KFBXTEXTURE_BLEND_DIFFERENCE 	                    "Difference"
#define TOKEN_KFBXTEXTURE_BLEND_EXCLUSION 	                    "Exclusion"
#define TOKEN_KFBXTEXTURE_BLEND_SUBTRACT                        "Subtract"
#define TOKEN_KFBXTEXTURE_BLEND_DIVIDE                          "Divide"
#define TOKEN_KFBXTEXTURE_BLEND_HUE 			                "Hue"
#define TOKEN_KFBXTEXTURE_BLEND_SATURATION	                    "Saturation"
#define TOKEN_KFBXTEXTURE_BLEND_COLOR		                    "Color"
#define TOKEN_KFBXTEXTURE_BLEND_LUMINOSITY                      "Luminosity"
#define TOKEN_KFBXTEXTURE_BLEND_OVERLAY                         "Overlay"
#define TOKEN_KFBXTEXTURE_BLEND_MAXBLEND                        "MaxBlend"
#define FIELD_KFBXTEXTURE_WRAP_U                                "WrapU"
#define FIELD_KFBXTEXTURE_WRAP_V                                "WrapV"
#define FIELD_KFBXTEXTURE_BLEND_MODE                            "BlendMode"
#define FIELD_KFBXTEXTURE_ALPHA                                 "TextureAlpha"

//
// FbxSurfaceMaterial
//
#define FIELD_KFBXMATERIAL_MATERIAL      "Material"
#define FIELD_KFBXMATERIAL_VERSION       "Version"
#define FIELD_KFBXMATERIAL_SHADING_MODEL "ShadingModel"
#define FIELD_KFBXMATERIAL_AMBIENT       "Ambient"
#define FIELD_KFBXMATERIAL_DIFFUSE       "Diffuse"
#define FIELD_KFBXMATERIAL_SPECULAR      "Specular"
#define FIELD_KFBXMATERIAL_EMISSIVE      "Emissive"
#define FIELD_KFBXMATERIAL_SHININESS     "Shininess"
#define FIELD_KFBXMATERIAL_REFLECTIVITY  "Reflectivity"
#define FIELD_KFBXMATERIAL_ALPHA         "Alpha"
#define FIELD_KFBXMATERIAL_MULTI_LAYER   "MultiLayer"

//
// FbxCluster
//
#define FIELD_KFBXLINK_LINK              "Link"
#define FIELD_KFBXLINK_MODE              "Mode"
#define FIELD_KFBXLINK_USERDATA          "UserData"
#define FIELD_KFBXLINK_INDEXES           "Indexes"
#define FIELD_KFBXLINK_WEIGHTS           "Weights"
#define FIELD_KFBXLINK_TRANSFORM         "Transform"
#define FIELD_KFBXLINK_TRANSFORM_LINK    "TransformLink"
#define FIELD_KFBXLINK_ASSOCIATE_MODEL   "AssociateModel"
#define FIELD_KFBXLINK_TRANSFORM_PARENT  "TransformParent"
#define TOKEN_KFBXLINK_AVERAGE           "Average"
#define TOKEN_KFBXLINK_ADDITIVE          "Additive"
#define TOKEN_KFBXLINK_TOTAL1            "Total1"

//
// FbxDeformer
//
#define FIELD_KFBXDEFORMER_DEFORMER         "Deformer"
#define FIELD_KFBXDEFORMER_VERSION          "Version"
#define FIELD_KFBXDEFORMER_TYPE             "Type"
#define FIELD_KFBXDEFORMER_MULTI_LAYER      "MultiLayer"
#define FIELD_KFBXDEFORMER_MODE             "Mode"
#define FIELD_KFBXDEFORMER_USERDATA         "UserData"
#define FIELD_KFBXDEFORMER_INDEXES          "Indexes"
#define FIELD_KFBXDEFORMER_WEIGHTS          "Weights"
#define FIELD_KFBXDEFORMER_TRANSFORM        "Transform"
#define FIELD_KFBXDEFORMER_TRANSFORM_LINK   "TransformLink"
#define FIELD_KFBXDEFORMER_ASSOCIATE_MODEL  "AssociateModel"
#define FIELD_KFBXDEFORMER_TRANSFORM_PARENT "TransformParent"
#define TOKEN_KFBXDEFORMER_AVERAGE          "Average"
#define TOKEN_KFBXDEFORMER_ADDITIVE         "Additive"
#define TOKEN_KFBXDEFORMER_TOTAL1           "Total1"

//
// FbxSkin
//
#define FIELD_KFBXSKIN_VERSION              "Version"
#define FIELD_KFBXSKIN_DEFORM_ACCURACY      "Link_DeformAcuracy"
#define FIELD_KFBXSKIN_SKINNINGTYPE         "SkinningType"
#define TOKEN_KFBXSKIN_LINEAR               "Linear"
#define TOKEN_KFBXSKIN_DUALQUATERNION       "DualQuaternion"
#define TOKEN_KFBXSKIN_BLEND                "Blend"
#define FIELD_KFBXSKIN_INDEXES              "Indexes"
#define FIELD_KFBXSKIN_BLENDWEIGHTS         "BlendWeights"

//
// FbxCluster
//
#define FIELD_KFBXCLUSTER_VERSION          "Version"
#define FIELD_KFBXCLUSTER_MODE             "Mode"
#define FIELD_KFBXCLUSTER_USERDATA         "UserData"
#define FIELD_KFBXCLUSTER_INDEXES          "Indexes"
#define FIELD_KFBXCLUSTER_WEIGHTS          "Weights"
#define FIELD_KFBXCLUSTER_TRANSFORM        "Transform"
#define FIELD_KFBXCLUSTER_TRANSFORM_LINK   "TransformLink"
#define FIELD_KFBXCLUSTER_ASSOCIATE_MODEL  "AssociateModel"
#define FIELD_KFBXCLUSTER_TRANSFORM_PARENT "TransformParent"
#define TOKEN_KFBXCLUSTER_AVERAGE          "Average"
#define TOKEN_KFBXCLUSTER_ADDITIVE         "Additive"
#define TOKEN_KFBXCLUSTER_TOTAL1           "Total1"

//
// FbxBlendShape
//
#define FIELD_KFBXBLENDSHAPE_VERSION        "Version"

//
// FbxBlendShapeChannel
//
#define FIELD_KFBXBLENDSHAPECHANNEL_VERSION                    "Version"
#define FIELD_KFBXBLENDSHAPECHANNEL_DEFORMPERCENT              "DeformPercent"
#define FIELD_KFBXBLENDSHAPECHANNEL_FULLWEIGHTS                "FullWeights"

//
// FbxShape
//
#define FIELD_KFBXSHAPE_SHAPE         "Shape"
#define FIELD_KFBXSHAPE_VERSION       "Version"
#define FIELD_KFBXSHAPE_INDEXES       "Indexes"
#define FIELD_KFBXSHAPE_VERTICES      "Vertices"
#define FIELD_KFBXSHAPE_NORMALS       "Normals"

//
// FbxVertexCacheDeformer
//
#define FILED_KFBXVERTEXCACHEDEFORMER_VERSION           "Version"
#define FILED_KFBXVERTEXCACHEDEFORMER_CACHE_CHANNEL     "CacheChannel"

//
// FbxCache
//
#define FIELD_KFBXCACHE_VERTEX_CACHE        "Cache"
#define FIELD_KFBXCACHE_VERSION             "Version"
#define FIELD_KFBXCACHE_CACHE_PATH          "CachePath"

//
// FbxBindingTable
//
#define FIELD_KFBXBINDINGTABLE_BINDING_TABLE            "BindingTable"
#define FIELD_KFBXBINDINGTABLE_VERSION                  "Version"
#define FIELD_KFBXBINDINGTABLE_TARGET                   "Target"
#define FIELD_KFBXBINDINGTABLE_ENTRY                    "Entry"

//
// FbxImplementation
//
#define FIELD_KFBXIMPLEMENTATION_IMPLEMENTATION         "Implementation"
#define FIELD_KFBXIMPLEMENTATION_VERSION                "Version"

//
// FbxBindingOperator
//
#define FIELD_KFBXBINDINGOPERATOR_BINDING_OPERATOR      "BindingOperator"
#define FIELD_KFBXBINDINGOPERATOR_VERSION               "Version"
#define FIELD_KFBXBINDINGOPERATOR_ENTRY                 "Entry"

//
// FbxCollection
//
#define FIELD_KFBXCOLLECTION_COLLECTION                 "Collection"
#define FIELD_KFBXCOLLECTION_VERSION                    "Version"

//
// FbxCollectionExclusive
//
#define FIELD_KFBXCOLLECTIONEXCLUSIVE_COLLECTIONEXCLUSIVE "CollectionExclusive"
#define FIELD_KFBXCOLLECTIONEXCLUSIVE_VERSION             "Version"

//
// FbxSelectionSet
//
#define FIELD_KFBXSELECTIONSET_VERTICE_INDEXARRAY           "VertexIndexArray"
#define FIELD_KFBXSELECTIONSET_EDGE_INDEXARRAY              "EdgeIndexArray"
#define FIELD_KFBXSELECTIONSET_POLYGONVERTICES_INDEXARRAY   "PolygonIndexArray"

//
// FbxDisplayLayer
//
#define FIELD_KFBXDISPLAYLAYER_DISPLAYLAYER             "DisplayLayer"
#define FIELD_KFBXDISPLAYLAYER_VERSION                  "Version"

//
// FbxDocument
//
#define FIELD_KFBXDOCUMENT_DOCUMENT                     "Document"
#define FIELD_KFBXDOCUMENT_VERSION                      "Version"

//
// FbxLayeredTexture
//
#define FIELD_KFBXLAYEREDTEXTURE_LAYERED_TEXTURE        "LayeredTexture"
#define FIELD_KFBXLAYEREDTEXTURE_VERSION                "Version"
#define FIELD_KFBXLAYEREDTEXTURE_BLENDMODES             "BlendModes"
#define FIELD_KFBXLAYEREDTEXTURE_ALPHAS                 "Alphas"

//
// FbxGobo
//
#define FIELD_KFBXGOBO_GOBOMANAGER       "GoboManager"
#define FIELD_KFBXGOBO_GOBO              "Gobo"
#define FIELD_KFBXGOBO_LIGHTGOBO         "LightGobo"
#define FIELD_KFBXGOBO_VERSION           "Version"
#define FIELD_KFBXGOBO_GOBONAME          "GoboName"
#define FIELD_KFBXGOBO_GOBOPATH          "GoboPath"
#define FIELD_KFBXGOBO_DRAWCOMPONENT     "DrawComponent"


//
// Password
//
#define FIELD_PASSWORD          "NodeId"
#define FIELD_OLD_PASSWORD      "Param2a"
#define FIELD_XOR_STRING        "?|/?*"


// Meanfull names for MB 6.0
#define FIELD_KFBXLAYER_ELEMENT_UV                  "LayerElementUV"
#define FIELD_KFBXLAYER_ELEMENT_SMOOTHING           "LayerElementSmoothing"
#define FIELD_KFBXLAYER_ELEMENT_VERTEX_CREASE       "LayerElementVertexCrease"
#define FIELD_KFBXLAYER_ELEMENT_EDGE_CREASE         "LayerElementEdgeCrease"
#define FIELD_KFBXLAYER_ELEMENT_HOLE                "LayerElementHole"
#define FIELD_KFBXLAYER_ELEMENT_USER_DATA           "LayerElementUserData"
#define FIELD_KFBXLAYER_ELEMENT_VISIBILITY          "LayerElementVisibility"
#define FIELD_KFBXLAYER_ELEMENT_NORMAL              "LayerElementNormal"
#define FIELD_KFBXLAYER_ELEMENT_BINORMAL            "LayerElementBinormal"
#define FIELD_KFBXLAYER_ELEMENT_TANGENT             "LayerElementTangent"
#define FIELD_KFBXLAYER_ELEMENT_MATERIAL            "LayerElementMaterial"
#define FIELD_KFBXLAYER_ELEMENT_TEXTURE             "LayerElementTexture"
#define FIELD_KFBXLAYER_ELEMENT_COLOR               "LayerElementColor"
#define FIELD_KFBXLAYER_ELEMENT_POLYGON_GROUP       "LayerElementPolygonGroup"
#define FIELD_KFBXLAYER_ELEMENT_VERSION             "Version"
#define FIELD_KFBXLAYER_ELEMENT_NAME                "Name"
#define FIELD_KFBXLAYER_ELEMENT_TYPED_INDEX         "TypedIndex"
#define FIELD_KFBXLAYER_ELEMENT_MAPPING_INFO_TYPE   "MappingInformationType"
#define FIELD_KFBXLAYER_ELEMENT_REFERENCE_INFO_TYPE "ReferenceInformationType"
#define FIELD_KFBXLAYER                             "Layer"
#define FIELD_KFBXLAYER_VERSION                     "Version"
#define FIELD_KFBXLAYER_ELEMENT                     "LayerElement"
#define FIELD_KFBXLAYER_ELEMENT_TYPE                "Type"

//
// FbxLayer
//
#define FIELD_KFBXLAYER_GEOMETRY_LAYER              "GeometryLayer"
#define FIELD_KFBXLAYER_LAYER_TEXTURE_INFO          "LayerTextureInfo"
#define FIELD_KFBXLAYER_TEXTURE_MODE                "TextureMode"
#define FIELD_KFBXLAYER_TEXTURE_BLEND_MODE          "TextureBlendMode"
#define FIELD_KFBXLAYER_TEXTURE_ID_COUNT            "TextureIdCount"
#define FIELD_KFBXLAYER_TEXTURE_ID                  "TextureId"
#define FIELD_KFBXLAYER_UV_MODE                     "UVMode"
#define FIELD_KFBXLAYER_UV_COUNT                    "UVCount"
#define FIELD_KFBXLAYER_UV                          "UV"
#define FIELD_KFBXLAYER_UV_INDEX                    "UVIndex"
#define FIELD_KFBXLAYER_UV_ID_COUNT                 "UVIdCount"
#define FIELD_KFBXLAYER_UV_ID                       "UVId"

//
// FbxPose
//
#define FIELD_KFBXPOSE_VERSION                      "Version"
#define FIELD_KFBXPOSE_TYPE                         "Type"
#define FIELD_KFBXPOSE_POSE                         "Pose"
#define FIELD_KFBXPOSE_BIND_POSE                    "BindPose"
#define FIELD_KFBXPOSE_REST_POSE                    "RestPose"


//
// KSceneInfo
//
#define FIELD_SCENEINFO                     "SceneInfo"
#define FIELD_SCENEINFO_TYPE                "Type"
#define FIELD_SCENEINFO_VERSION             "Version"
#define FIELD_SCENEINFO_METADATA            "MetaData"
#define FIELD_SCENEINFO_METADATA_VERSION    "Version"
#define FIELD_SCENEINFO_METADATA_TITLE      "Title"
#define FIELD_SCENEINFO_METADATA_SUBJECT    "Subject"
#define FIELD_SCENEINFO_METADATA_AUTHOR     "Author"
#define FIELD_SCENEINFO_METADATA_KEYWORDS   "Keywords"
#define FIELD_SCENEINFO_METADATA_REVISION   "Revision"
#define FIELD_SCENEINFO_METADATA_COMMENT    "Comment"

//
// Global setting:
//
#define FIELD_GLOBAL_SETTINGS                 "GlobalSettings"
#define FIELD_GLOBAL_SETTINGS_VERSION         "Version"

//
// FbxSceneReference:
//
#define FIELD_KFBXREFERENCE_REFERENCE         "SceneReference"
#define FIELD_KFBXREFERENCE_VERSION           "Version"

//
// Constraints
//
#define FIELD_CONSTRAINT                                "Constraint"
#define FIELD_CONSTRAINT_VERSION                        "Version"
#define FIELD_CONSTRAINT_OFFSET                         "Offset"
#define TOKEN_KFBXCONSTRAINT_CONSTRAINT                 "Constraint"
#define TOKEN_KFBXCONSTRAINT_POSITION                   "Position From Positions"
#define TOKEN_KFBXCONSTRAINT_ROTATION                   "Rotation From Rotations"
#define TOKEN_KFBXCONSTRAINT_SCALE                      "Scale From Scales"
#define TOKEN_KFBXCONSTRAINT_PARENT                     "Parent-Child"
#define TOKEN_KFBXCONSTRAINT_SINGLECHAINIK              "Single Chain IK"
#define TOKEN_KFBXCONSTRAINT_AIM                        "Aim"
#define TOKEN_KFBXCONSTRAINT_CHARACTER                  "Character"
#define TOKEN_KFBXCONSTRAINT_CUSTOM						"Custom"

//
// Controlset plug
//


//
// Object definition
//
#define FIELD_OBJECT_DESCRIPTION                                        "Document"
#define FIELD_OBJECT_DESCRIPTION_NAME                                   "Name"
#define FIELD_OBJECT_REFERENCES                                         "References"
#define FIELD_OBJECT_REFERENCES_FILE_PATH_URL                           "FilePathUrl"
#define FIELD_OBJECT_REFERENCES_REFERENCE                               "Reference"
#define FIELD_OBJECT_DEFINITION                                         "Definitions"
#define FIELD_OBJECT_PROPERTY_TEMPLATE                                  "PropertyTemplate"
#define FIELD_OBJECT_DEFINITION_VERSION                                 "Version"
#define FIELD_OBJECT_DEFINITION_COUNT                                   "Count"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE                             "ObjectType"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_REFERENCE                   "SceneReference"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_CONTAINER                   "Container"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_MODEL                       "Model"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_GEOMETRY                    "Geometry"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_NODE_ATTRIBUTE              "NodeAttribute"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_GEOMETRY_WEIGHTED_MAP       "GeometryWeightedMap"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_MARKETSET                   "MarkerSet"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_MATERIAL                    "Material"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_COLLECTION                  "Collection"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_COLLECTION_EXCLUSIVE        "CollectionExclusive"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_DISPLAY_LAYER               "DisplayLayer"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_TEXTURE                     "Texture"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_THUMBNAIL                   "Thumbnail"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_VIDEO                       "Video"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_DEFORMER                    "Deformer"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_SUBDEFORMER                 "SubDeformer"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_SHAPE                       "Shape"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_BLENDSHAPE                  "BlendShape"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_BLENDSHAPECHANNEL           "BlendShapeChannel"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_CONSTRAINT                  "Constraint"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_CONTROLSET_PLUG             "ControlSetPlug"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_POSE                        "Pose"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_GENERIC_NODE                "GenericNode"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_BOUNDARY                    "Boundary"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_CACHE                       "Cache"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_IMPLEMENTATION              "Implementation"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_BINDINGTABLE                "BindingTable"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_BINDINGOPERATOR             "BindingOperator"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_LAYERED_TEXTURE             "LayeredTexture"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_PROCEDURAL_TEXTURE          "ProceduralTexture"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_SCENEINFO                   FIELD_SCENEINFO
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_SCENE                       "Scene"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_LIBRARY                     "Library"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_DOCUMENT                    "Document"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_FOLDER                      "Folder"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_CLIP                        "Clip"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_TIMELINE                    "TimelineX"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_TIMELINE_TRACK              "TimelineXTrack"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ENVIRONMENT                 "KFbxEnvironment"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_OBJECTMETADATA              "ObjectMetaData"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_PLUGIN_PARAMS				"PluginParameters"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ANIM_STACK					"AnimationStack"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ANIM_LAYER					"AnimationLayer"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ANIM_CURVENODE              "AnimationCurveNode"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ANIM_CURVE                  "AnimationCurve"  
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_ANIM_EVALUATOR              "AnimationEvaluator"

#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_SELECTIONNODE               "SelectionNode"

#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_MESH                         "Mesh"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_SUBDIV                       "Subdiv"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_PATCH                        "Patch"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_NURB                         "Nurb"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_NURBS_SURFACE                "NurbsSurface"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_NURBS_CURVE                  "NurbsCurve"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_TRIM_NURB_SURFACE            "TrimNurbsSurface"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_BOUNDARY                     "Boundary"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_LINE                         "Line"
#define FIELD_OBJECT_TYPE_GEOMETRY_SUBTYPE_SHAPE                        "Shape"
#define FIELD_OBJECT_DEFINITION_OBJECT_TYPE_GLOBAL_SETTINGS             FIELD_GLOBAL_SETTINGS

//
// Object properties
//
#define FIELD_OBJECT_PROPERTIES                      "Objects"


//
// Object relations
//
#define FIELD_OBJECT_RELATIONS                       "Relations"
#define FIELD_OBJECT_RELATIONS_TYPE_MODEL            "Model"
#define FIELD_OBJECT_RELATIONS_TYPE_MATERIAL         "Material"
#define FIELD_OBJECT_RELATIONS_TYPE_TEXTURE          "Texture"
#define FIELD_OBJECT_RELATIONS_TYPE_VIDEO            "Video"
#define FIELD_OBJECT_RELATIONS_TYPE_CONSTRAINT       "Constraint"
#define FIELD_OBJECT_RELATIONS_TYPE_DEFORMER         "Deformer"
#define FIELD_OBJECT_RELATIONS_TYPE_POSE             "Pose"
#define FIELD_OBJECT_RELATIONS_TYPE_SCENEINFO        FIELD_SCENEINFO
#define FIELD_OBJECT_RELATIONS_TYPE_CACHE            "Cache"

//
// Object connections
//
#define FIELD_OBJECT_CONNECTIONS                     "Connections"


//
// Takes
//
#define FIELD_TAKES                                  "Takes"

// Embedded files
#define FIELD_EMBEDDED_FILES                         "Embedding"
#define FIELD_EMBEDDED_FILE                          "File"
// Original filename, relative to the fbx
// It may point to a file not below the fbx.
#define FIELD_EMBEDDED_ORIGINAL_FILENAME             "Original"
// Embedded filename, unique to the fbx, always relative to the fbx file;
// if two original filenames, in separate folders, are embedded in an fbx file,
// one of them will be renamed by using a folder.
#define FIELD_EMBEDDED_FILENAME                      "Filename"

// Link back to the objects which use this file.
#define FIELD_EMBEDDED_CONSUMERS                     "Consumers"
#define FIELD_EMBEDDED_CONSUMER                      "Consumer"

//
// Node Attribute
//
#define FIELD_NODE_ATTRIBUTE_NAME                   "NodeAttributeName"
#define FIELD_NODE_ATTRIBUTE_REFTO                  "NodeAttributeRefTo"

//
// Old sections
//
#define FIELD_OLD_SECTION_VERSION5                  "Version5"
#define FIELD_OLD_SECTION_HIERARCHYVIEW             "HierarchyView"

#define OBJECT_OLD_SECTION_VERSION5                 "OldSection_VersionFive"
#define OBJECT_OLD_SECTION_HIERARCHYVIEW            "OldSection_HierarchyView"

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FILE_TOKENS_H_ */
