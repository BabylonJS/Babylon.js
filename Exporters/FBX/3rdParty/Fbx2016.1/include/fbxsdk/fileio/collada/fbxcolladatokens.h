/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladatokens.h
#ifndef _FBXSDK_FILEIO_COLLADA_TOKENS_H_
#define _FBXSDK_FILEIO_COLLADA_TOKENS_H_

#define XML_STR (const xmlChar*) 

// In COLLADA, 1 means total control, while 100 means total control in FBX.
const int COLLADA_MORPH_WEIGHT_TO_FBX_RATIO = 100;

#define COLLADA_VERSION_PROPERTY			"version"
#define COLLADA_VERSION						"1.4.1"
#define COLLADA_SCHEMA						"http://www.collada.org/2005/11/COLLADASchema"

// COLLADA 1.4 elements
#define COLLADA_LIBRARY_ANIMATION_ELEMENT			"library_animations"
#define COLLADA_LIBRARY_ANIMATION_CLIP_ELEMENT		"library_animation_clips"
#define COLLADA_LIBRARY_CAMERA_ELEMENT				"library_cameras"
#define COLLADA_LIBRARY_CONTROLLER_ELEMENT			"library_controllers"
#define COLLADA_LIBRARY_EFFECT_ELEMENT				"library_effects"
#define COLLADA_LIBRARY_FFIELDS_ELEMENT				"library_force_fields"
#define COLLADA_LIBRARY_GEOMETRY_ELEMENT			"library_geometries"
#define COLLADA_LIBRARY_IMAGE_ELEMENT				"library_images"
#define COLLADA_LIBRARY_LIGHT_ELEMENT				"library_lights"
#define COLLADA_LIBRARY_MATERIAL_ELEMENT			"library_materials"
#define COLLADA_LIBRARY_NODE_ELEMENT				"library_nodes"
#define COLLADA_LIBRARY_PMATERIAL_ELEMENT			"library_physics_materials"
#define COLLADA_LIBRARY_PMODEL_ELEMENT				"library_physics_models"
#define COLLADA_LIBRARY_PSCENE_ELEMENT				"library_physics_scenes"
#define COLLADA_LIBRARY_VSCENE_ELEMENT				"library_visual_scenes"

#define COLLADA_INSTANCE_ANIMATION_ELEMENT				"instance_animation"
#define COLLADA_INSTANCE_CAMERA_ELEMENT					"instance_camera"
#define COLLADA_INSTANCE_CONTROLLER_ELEMENT				"instance_controller"
#define COLLADA_INSTANCE_EFFECT_ELEMENT					"instance_effect"
#define COLLADA_INSTANCE_GEOMETRY_ELEMENT				"instance_geometry"
#define COLLADA_INSTANCE_LIGHT_ELEMENT					"instance_light"
#define COLLADA_INSTANCE_NODE_ELEMENT					"instance_node"
#define COLLADA_INSTANCE_VSCENE_ELEMENT					"instance_visual_scene"
#define COLLADA_INSTANCE_PSCENE_ELEMENT					"instance_physics_scene"
#define COLLADA_INSTANCE_MATERIAL_ELEMENT				"instance_material"

#define COLLADA_ANIMCLIP_ELEMENT						"animation_clip"
#define COLLADA_BINDMATERIAL_ELEMENT					"bind_material"
#define COLLADA_EFFECT_ELEMENT							"effect"
#define COLLADA_INITFROM_ELEMENT						"init_from"
#define COLLADA_SAMPLER_ELEMENT							"sampler"
#define COLLADA_SKELETON_ELEMENT						"skeleton"
#define COLLADA_TARGETS_ELEMENT							"targets"
#define COLLADA_TECHNIQUE_COMMON_ELEMENT				"technique_common"
#define COLLADA_VSCENE_ELEMENT							"visual_scene"
#define COLLADA_WEIGHTS_ELEMENT							"vertex_weights"
#define COLLADA_VERTEXCOUNT_ELEMENT						"vcount"

#define COLLADA_FX_PROFILE_COMMON_ELEMENT				"profile_COMMON"
#define COLLADA_FX_PROFILE_CG_ELEMENT					"profile_CG"
#define COLLADA_FX_PROFILE_HLSL_ELEMENT					"profile_HLSL"
#define COLLADA_FX_PROFILE_GLSL_ELEMENT					"profile_GLSL"
#define COLLADA_FX_PROFILE_GLES_ELEMENT					"profile_GLES"

#define COLLADA_FXCMN_FLOAT_ELEMENT						"float"
#define COLLADA_FXCMN_FLOAT4_ELEMENT					"float4"
#define COLLADA_FXCMN_FLOAT4X4_ELEMENT					"float4x4"
#define COLLADA_FXCMN_INCLUDE_ELEMENT					"include"
#define COLLADA_FXCMN_SURFACE_ELEMENT					"surface"
#define COLLADA_FXCMN_SAMPLER1D_ELEMENT					"sampler1D"
#define COLLADA_FXCMN_SAMPLER2D_ELEMENT					"sampler2D"
#define COLLADA_FXCMN_SAMPLER3D_ELEMENT					"sampler3D"
#define COLLADA_FXCMN_SAMPLERCUBE_ELEMENT				"samplerCUBE"
#define COLLADA_FXCMN_NEWPARAM_ELEMENT					"newparam"
#define COLLADA_FXCMN_SETPARAM_ELEMENT					"setparam"
#define COLLADA_FXCMN_STRING_ELEMENT					"string"

#define COLLADA_TECHNIQUE_STANDARD_PARAMETER			"standard"

#define COLLADA_FXSTD_CONSTANT_ELEMENT					"constant"
#define COLLADA_FXSTD_LAMBERT_ELEMENT					"lambert"
#define COLLADA_FXSTD_PHONG_ELEMENT						"phong"
#define COLLADA_FXSTD_BLINN_ELEMENT						"blinn"
#define COLLADA_FXSTD_COLOR_ELEMENT						"color"
#define COLLADA_FXSTD_FLOAT_ELEMENT						"float"
#define COLLADA_FXSTD_SAMPLER_ELEMENT					"texture"
#define COLLADA_FXSTD_TEXTURE_ATTRIBUTE					"texture"
#define COLLADA_FXSTD_TEXTURESET_ATTRIBUTE				"texcoord"

#define COLLADA_CONTROLLER_SKIN_ELEMENT					"skin"
#define COLLADA_CONTROLLER_MORPH_ELEMENT				"morph"

#define COLLADA_CAMERA_PERSP_ELEMENT					"perspective"
#define COLLADA_CAMERA_ORTHO_ELEMENT					"orthographic"

#define COLLADA_ASPECT_CAMERA_PARAMETER					"aspect_ratio"
#define COLLADA_XFOV_CAMERA_PARAMETER					"xfov"	
#define COLLADA_YFOV_CAMERA_PARAMETER					"yfov"	
#define COLLADA_ZNEAR_CAMERA_PARAMETER					"znear"	
#define COLLADA_ZFAR_CAMERA_PARAMETER					"zfar"	
#define COLLADA_XMAG_CAMERA_PARAMETER					"xmag"	
#define COLLADA_YMAG_CAMERA_PARAMETER					"ymag"
#define COLLADA_CAMERA_VERTICAL_APERTURE_PARAMETER      "vertical_aperture"
#define COLLADA_CAMERA_HORIZONTAL_APERTURE_PARAMETER    "horizontal_aperture"
#define COLLADA_CAMERA_LENS_SQUEEZE_PARAMETER           "lens_squeeze"

#define COLLADA_AMBIENT_MATERIAL_PARAMETER				"ambient"
#define COLLADA_BUMP_MATERIAL_PARAMETER					"bump"
#define COLLADA_DIFFUSE_MATERIAL_PARAMETER				"diffuse"
#define COLLADA_EMISSION_MATERIAL_PARAMETER				"emission"
#define COLLADA_TRANSPARENCY_MATERIAL_PARAMETER			"transparency"
#define COLLADA_TRANSPARENT_MATERIAL_PARAMETER			"transparent"
#define COLLADA_REFLECTIVE_MATERIAL_PARAMETER			"reflective"
#define COLLADA_REFLECTIVITY_MATERIAL_PARAMETER			"reflectivity"
#define COLLADA_SHININESS_MATERIAL_PARAMETER			"shininess"
#define COLLADA_SPECULAR_MATERIAL_PARAMETER				"specular"
#define COLLADA_INDEXOFREFRACTION_MATERIAL_PARAMETER	"index_of_refraction"
#define COLLADA_OPAQUE_MODE_ATTRIBUTE                   "opaque"
#define COLLADA_OPAQUE_MODE_A_ONE                       "A_ONE"
#define COLLADA_OPAQUE_MODE_RGB_ONE                     "RGB_ONE"
#define COLLADA_OPAQUE_MODE_A_ZERO                      "A_ZERO"
#define COLLADA_OPAQUE_MODE_RGB_ZERO                    "RGB_ZERO"

#define COLLADA_LIGHT_AMBIENT_ELEMENT					"ambient"		
#define COLLADA_LIGHT_POINT_ELEMENT						"point"
#define COLLADA_LIGHT_DIRECTIONAL_ELEMENT				"directional"
#define COLLADA_LIGHT_SPOT_ELEMENT						"spot"

#define COLLADA_COLOR_LIGHT_PARAMETER					"color"
#define COLLADA_CONST_ATTENUATION_LIGHT_PARAMETER		"constant_attenuation"
#define COLLADA_LIN_ATTENUATION_LIGHT_PARAMETER			"linear_attenuation"
#define COLLADA_QUAD_ATTENUATION_LIGHT_PARAMETER		"quadratic_attenuation"
#define COLLADA_FALLOFFEXPONENT_LIGHT_PARAMETER			"falloff_exponent"
#define COLLADA_FALLOFFANGLE_LIGHT_PARAMETER			"falloff_angle"

#define COLLADA_BINDSHAPEMX_SKIN_PARAMETER				"bind_shape_matrix"

#define COLLADA_CONTRIBUTOR_ASSET_ELEMENT				"contributor"
#define COLLADA_AUTHOR_ASSET_PARAMETER					"author"
#define COLLADA_AUTHORINGTOOL_ASSET_PARAMETER			"authoring_tool"
#define COLLADA_CREATED_ASSET_PARAMETER					"created"
#define COLLADA_MODIFIED_ASSET_PARAMETER				"modified"
#define COLLADA_REVISION_ASSET_PARAMETER				"revision"
#define COLLADA_SOURCEDATA_ASSET_PARAMETER				"source_data"
#define COLLADA_UNITS_ASSET_PARAMETER					"unit"
#define COLLADA_UPAXIS_ASSET_PARAMETER					"up_axis"

#define COLLADA_SYMBOL_PROPERTY				"symbol"

// From Collada 1.3
#define COLLADA_DOCUMENT_STRUCTURE			"COLLADA"
#define COLLADA_ASSET_STRUCTURE				"asset"
#define COLLADA_REVISION_STRUCTURE			"revision"
#define COLLADA_AUTHORING_TOOL_STRUCTURE	"authoring_tool"
#define COLLADA_CREATED_STRUCTURE			"created"
#define COLLADA_MODIFIED_STRUCTURE			"modified"
#define COLLADA_AUTHOR_STRUCTURE			"author"
#define COLLADA_TITLE_STRUCTURE				"title"
#define COLLADA_SUBJECT_STRUCTURE			"subject"
#define COLLADA_KEYWORDS_STRUCTURE			"keywords"
#define COLLADA_COMMENTS_STRUCTURE			"comments"
#define COLLADA_UNIT_STRUCTURE				"unit"
#define COLLADA_SOURCE_DATA_STRUCTURE		"source_data"
#define COLLADA_UP_AXIS_STRUCTURE			"up_axis"
#define COLLADA_LIBRARY_STRUCTURE			"library"		// Deprecated 1.4
#define COLLADA_SCENE_STRUCTURE				"scene"
#define COLLADA_NODE_STRUCTURE				"node"
#define COLLADA_MATRIX_STRUCTURE			"matrix"
#define COLLADA_TRANSFORM_STRUCTURE         "transform"
#define COLLADA_TRANSLATE_STRUCTURE			"translate"
#define COLLADA_TRANSLATION_STRUCTURE       "translation"   // For ColladaMax
#define COLLADA_TRANSLATE_ORIGIN			"origin"        //A fix for Poser(Bug 309548). Handle translate origin info exported from Poser.
#define COLLADA_TRANSLATE_LOCATION			"location"      //A fix for ? (Bug BARB-154). "location" is synonyn of "translate" ?
#define COLLADA_ROTATE_STRUCTURE			"rotate"
#define COLLADA_SCALE_STRUCTURE				"scale"
#define COLLADA_SKEW_STRUCTURE				"skew"
#define COLLADA_ROTATE_X					"rotateX"
#define COLLADA_ROTATE_Y					"rotateY"
#define COLLADA_ROTATE_Z					"rotateZ"
#define COLLADA_ROT_X                       "RotX"          // For ColladaMax
#define COLLADA_ROT_Y                       "RotY"
#define COLLADA_ROT_Z                       "RotZ"
#define COLLADA_ROTATION_X                  "rotation_x"    // For XSI
#define COLLADA_ROTATION_Y                  "rotation_y"
#define COLLADA_ROTATION_Z                  "rotation_z"
#define COLLADA_ROTATIONX                   "rotationX"     // BARB-154
#define COLLADA_ROTATIONY                   "rotationY"
#define COLLADA_ROTATIONZ                   "rotationZ"

#define COLLADA_ROTATE_PIVOT				"rotatePivot"	// the next 6 subids are recognized by ColladaMaya
#define COLLADA_SCALE_PIVOT					"scalePivot"
#define COLLADA_ROTATE_PIVOT_INVERSE		"rotatePivotInverse"
#define COLLADA_SCALE_PIVOT_INVERSE			"scalePivotInverse"
#define COLLADA_ROTATE_PIVOT_OFFSET			"rotatePivotTranslation"
#define COLLADA_SCALE_PIVOT_OFFSET			"scalePivotTranslation"
#define COLLADA_PRE_ROTATION_X				"jointOrientX"	// these 3 subids recognized by ColladaMaya
#define COLLADA_PRE_ROTATION_Y				"jointOrientY"
#define COLLADA_PRE_ROTATION_Z				"jointOrientZ"
#define COLLADA_POST_ROTATION_X				"post-rotationX"	// these 3 subids NOT recognized by ColladaMaya
#define COLLADA_POST_ROTATION_Y				"post-rotationY"
#define COLLADA_POST_ROTATION_Z				"post-rotationZ"
#define COLLADA_ROTATE_AXIS_X               "rotateAxisX"       // these 3 subids recognized by ColladaMaya
#define COLLADA_ROTATE_AXIS_Y               "rotateAxisY"
#define COLLADA_ROTATE_AXIS_Z               "rotateAxisZ"
#define COLLADA_LOOKAT_STRUCTURE			"lookat"
#define COLLADA_PERSPECTIVE_STRUCTURE		"perspective"
#define COLLADA_GEOMETRY_STRUCTURE			"geometry"
#define COLLADA_MESH_STRUCTURE				"mesh"
#define COLLADA_VERTICES_STRUCTURE			"vertices"
#define COLLADA_POLYGONS_STRUCTURE			"polygons"
#define COLLADA_POLYLIST_STRUCTURE			"polylist" 
#define COLLADA_TRIANGLES_STRUCTURE			"triangles"
#define COLLADA_P_STRUCTURE                 "p"
#define COLLADA_ANIMATION_STRUCTURE			"animation"
#define COLLADA_CONTROLLER_STRUCTURE		"controller"
#define COLLADA_SKIN_STRUCTURE				"skin"
#define COLLADA_COMBINER_STRUCTURE			"combiner"
#define COLLADA_JOINTS_STRUCTURE			"joints"
#define COLLADA_VALUE_STRUCTURE				"v"
#define COLLADA_MATERIAL_STRUCTURE			"material"
#define COLLADA_SHADER_STRUCTURE			"shader"
#define COLLADA_PASS_STRUCTURE				"pass"
#define COLLADA_PROGRAM_STRUCTURE			"program"
#define COLLADA_TEXTURE_STRUCTURE			"texture"
#define COLLADA_IMAGE_STRUCTURE				"image"
#define COLLADA_INPUT_STRUCTURE				"input"
#define COLLADA_TECHNIQUE_STRUCTURE			"technique"
#define COLLADA_SOURCE_STRUCTURE			"source"
#define COLLADA_ACCESSOR_STRUCTURE			"accessor"
#define COLLADA_EXTRA_STRUCTURE				"extra"
#define COLLADA_BOUNDINGBOX_STRUCTURE		"boundingbox"
#define COLLADA_MIN_STRUCTURE				"min"
#define COLLADA_MAX_STRUCTURE				"max"

#define COLLADA_ARRAY_STRUCTURE				"array"
#define COLLADA_FLOAT_ARRAY_STRUCTURE		"float_array"
#define COLLADA_INT_ARRAY_STRUCTURE			"int_array"
#define COLLADA_NAME_ARRAY_STRUCTURE		"Name_array"
#define COLLADA_IDREF_ARRAY_STRUCTURE		"IDREF_array"
#define COLLADA_BOOL_ARRAY_STRUCTURE		"bool_array"

#define COLLADA_SAMPLER_STRUCTURE			"sampler"
#define COLLADA_CHANNEL_STRUCTURE			"channel"
#define COLLADA_CAMERA_STRUCTURE			"camera"
#define COLLADA_LIGHT_STRUCTURE				"light"
#define COLLADA_OPTICS_STRUCTURE			"optics"
#define COLLADA_PROGRAM_STRUCTURE			"program"
#define COLLADA_PARAMETER_STRUCTURE			"param"

#define COLLADA_TYPE_PROPERTY				"type"
#define COLLADA_ID_PROPERTY					"id"
#define COLLADA_SUBID_PROPERTY				"sid"
#define COLLADA_NAME_PROPERTY				"name"
#define COLLADA_LAYER_PROPERTY              "layer"
#define COLLADA_COUNT_PROPERTY				"count"
#define COLLADA_STRIDE_PROPERTY				"stride"
#define COLLADA_URL_PROPERTY				"url"
#define COLLADA_SEMANTIC_PROPERTY			"semantic"
#define COLLADA_SOURCE_PROPERTY				"source"
#define COLLADA_TARGET_PROPERTY				"target"
#define COLLADA_PROFILE_PROPERTY			"profile"
#define COLLADA_MATERIAL_PROPERTY			"material"
#define COLLADA_METER_PROPERTY				"meter"
#define COLLADA_IDX_PROPERTY				"idx"
#define COLLADA_SET_PROPERTY				"set"
#define COLLADA_OFFSET_PROPERTY				"offset"
#define COLLADA_FLOW_PROPERTY				"flow"
#define COLLADA_FORMAT_PROPERTY				"format"
#define COLLADA_HEIGHT_PROPERTY				"height"
#define COLLADA_WIDTH_PROPERTY				"width"
#define COLLADA_DEPTH_PROPERTY				"depth"
#define COLLADA_REF_PROPERTY                "ref"

#define COLLADA_GEOMETRY_LIBRARY_TYPE		"GEOMETRY"
#define COLLADA_CONTROLLER_LIBRARY_TYPE		"CONTROLLER"
#define COLLADA_ANIMATION_LIBRARY_TYPE		"ANIMATION"
#define COLLADA_MATERIAL_LIBRARY_TYPE		"MATERIAL"
#define COLLADA_TEXTURE_LIBRARY_TYPE		"TEXTURE"
#define COLLADA_IMAGE_LIBRARY_TYPE			"IMAGE"
#define COLLADA_LIGHT_LIBRARY_TYPE			"LIGHT"
#define COLLADA_CAMERA_LIBRARY_TYPE			"CAMERA"

#define COLLADA_LAMBERT_SHADER_TYPE			"LAMBERT"
#define COLLADA_PHONG_SHADER_TYPE			"PHONG"
#define COLLADA_CONSTANT_SHADER_TYPE		"CONSTANT"

#define COLLADA_NAME_TYPE					"name"
#define COLLADA_IDREF_TYPE					"IDREF"
#define COLLADA_FLOAT_TYPE					"float"
#define COLLADA_BOOL_TYPE					"bool"
#define COLLADA_INT_TYPE					"int"
#define COLLADA_FLOAT3_TYPE					"float3"
#define COLLADA_FLOAT4_TYPE					"float4"
#define COLLADA_FUNCTION_TYPE				"function"
#define COLLADA_MATRIX_TYPE					"float4x4"
#define COLLADA_STRING_TYPE                 "string"

#define COLLADA_JOINT_NODE_TYPE				"JOINT"
#define COLLADA_NODE_NODE_TYPE				"NODE"

#define COLLADA_TEXTURE_SEMANTIC			"TEXTURE"
#define COLLADA_IMAGE_SEMANTIC				"IMAGE"
#define COLLADA_INPUT_SEMANTIC				"INPUT"
#define COLLADA_OUTPUT_SEMANTIC				"OUTPUT"
#define COLLADA_IN_TANGENT_SEMANTIC			"IN_TANGENT"
#define COLLADA_OUT_TANGENT_SEMANTIC		"OUT_TANGENT"
#define COLLADA_INTERPOLATION_SEMANTIC		"INTERPOLATION"
#define COLLADA_JOINT_SEMANTIC				"JOINT"
#define COLLADA_BIND_POSITION_SEMANTIC		"BIND_SHAPE_POSITION"
#define COLLADA_BIND_NORMAL_SEMANTIC		"BIND_SHAPE_NORMAL"
#define COLLADA_JOINT_AND_WEIGHT_SEMANTIC	"JOINTS_AND_WEIGHTS"
#define COLLADA_BIND_MATRIX_SEMANTIC		"INV_BIND_MATRIX"
#define COLLADA_JOINT_PARAMETER				"JOINT"
#define COLLADA_WEIGHT_PARAMETER			"WEIGHT"
#define COLLADA_MORPH_TARGET_SEMANTIC		"MORPH_TARGET"
#define COLLADA_MORPH_WEIGHT_SEMANTIC		"MORPH_WEIGHT"

#define COLLADA_GENERIC_TECHNIQUE			"COMMON"

#define COLLADA_TIME_TARGET					"TIME"

#define COLLADA_VERTEX_INPUT				"VERTEX"
#define COLLADA_POSITION_INPUT				"POSITION"
#define COLLADA_NORMAL_INPUT				"NORMAL"
#define COLLADA_COLOR_INPUT					"COLOR"
#define COLLADA_MAPPING_INPUT				"UV"
#define COLLADA_TEXCOORD_INPUT				"TEXCOORD"
#define COLLADA_TEXTANGENT_INPUT            "TEXTANGENT"
#define COLLADA_TEXBINORMAL_INPUT           "TEXBINORMAL"

#define COLLADA_LIGHT_INTENSITY_PARAMETER_14			"intensity"
#define COLLADA_LIGHT_PENUMBRA_ANGLE_PARAMETER_14		"penumbra_angle"
#define COLLADA_LIGHT_DROPOFF_PARAMETER					"dropoff"

#define COLLADA_CAMERA_YFOV_PARAMETER			"YFOV"
#define COLLADA_CAMERA_ZNEAR_PARAMETER			"ZNEAR"
#define COLLADA_CAMERA_ZFAR_PARAMETER			"ZFAR"
#define COLLADA_CAMERA_ORTHO_BOTTOM_PARAMETER	"BOTTOM"
#define COLLADA_CAMERA_ORTHO_TOP_PARAMETER		"TOP"
#define COLLADA_CAMERA_ORTHO_LEFT_PARAMETER		"LEFT"
#define COLLADA_CAMERA_ORTHO_RIGHT_PARAMETER	"RIGHT"

#define COLLADA_TEXTURE_WRAPU_PARAMETER					"wrapU"
#define COLLADA_TEXTURE_WRAPV_PARAMETER					"wrapV"
#define COLLADA_TEXTURE_MIRRORU_PARAMETER				"mirrorU"
#define COLLADA_TEXTURE_MIRRORV_PARAMETER				"mirrorV"
#define COLLADA_TEXTURE_BLEND_MODE_PARAMETER			"BLEND_MODE"
#define COLLADA_TEXTURE_BLEND_MODE_PARAMETER_14			"blend_mode"
#define COLLADA_TEXTURE_REPEATU_PARAMETER				"repeatU"
#define COLLADA_TEXTURE_REPEATV_PARAMETER				"repeatV"

#define COLLADA_CONSTANT_FUNCTION			"CONSTANT"
#define COLLADA_LINEAR_FUNCTION				"LINEAR"
#define COLLADA_QUADRATIC_FUNCTION			"QUADRATIC"

#define COLLADA_INTERPOLATION_TYPE_LINEAR	"LINEAR"
#define COLLADA_INTERPOLATION_TYPE_BEZIER	"BEZIER"
#define COLLADA_INTERPOLATION_TYPE_CARDINAL	"CARDINAL"
#define COLLADA_INTERPOLATION_TYPE_HERMITE	"HERMITE"
#define COLLADA_INTERPOLATION_TYPE_BSPLINE	"BSPLINE"
#define COLLADA_INTERPOLATION_TYPE_STEP		"STEP"

#define COLLADA_X_UP						"X_UP"
#define COLLADA_Y_UP						"Y_UP"
#define COLLADA_Z_UP						"Z_UP"

#define COLLADA_IN_FLOW						"IN"
#define COLLADA_OUT_FLOW					"OUT"
#define COLLADA_INOUT_FLOW					"INOUT"

// Obsolete, but kept here for backward compatibility.
#define COLLADA_RGB_TYPE					"ColorRGB"  // use float3 instead
#define COLLADA_RGBA_TYPE					"ColorRGBA" // use float4 instead
#define COLLADA_RGB_INPUT					"COLORRGB"	// beta MAX exporter has been known to generate them
#define COLLADA_RGBA_INPUT					"COLORRGBA"	// beta MAX exporter has been known to generate them

// Physics extension. Currently in prototype phase.
#define COLLADA_PHYSICS_LIBRARY_TYPE		"PHYSICS"
#define COLLADA_SHAPE_STRUCTURE				"shape"
#define	COLLADA_RIGID_BODY_STRUCTURE		"rigidbody"
#define COLLADA_DYNAMIC_STRUCTURE			"dynamic"
#define COLLADA_MASS_STRUCTURE				"mass"
#define COLLADA_PHYSICS_MATERIAL_STRUCTURE	"physics_material"
#define COLLADA_STATIC_FRICTION_ATTRIBUTE	"STATIC_FRICTION"
#define COLLADA_DYNAMIC_FRICTION_ATTRIBUTE	"DYNAMIC_FRICTION"
#define COLLADA_ELASTICITY_ATTRIBUTE		"ELASTICITY"
#define COLLADA_BOX_STRUCTURE				"box"
#define COLLADA_SPHERE_STRUCTURE			"sphere"
#define COLLADA_CAPSULE_STRUCTURE			"capsule"
#define COLLADA_CYLINDER_STRUCTURE			"cylinder"
#define COLLADA_ELLIPSOID_STRUCTURE			"ellipsoid"
#define COLLADA_SIZE_STRUCTURE				"size"
#define COLLADA_RADIUS_STRUCTURE			"radius"
#define COLLADA_PHYSICS_ENVIRONMENT_STRUCTURE	"physics_environment"
#define COLLADA_ENVIRONMENT_ID				"Environment"
#define COLLADA_TIMESTEP_ATTRIBUTE			"TIMESTEP"
#define COLLADA_GRAVITY_ATTRIBUTE			"gravity"
#define COLLADA_INITIAL_VELOCITY_STRUCTURE	"initial_velocity"
#define COLLADA_INITIAL_ANGULAR_VELOCITY_STRUCTURE	"initial_angular_velocity"
#define COLLADA_CONVEX_MESH_STRUCTURE		"convex_mesh"
#define COLLADA_INERTIA_STRUCTURE			"inertia"
#define COLLADA_DENSITY_STRUCTURE			"density"
#define COLLADA_CENTER_OF_MASS_STRUCTURE	"center_of_mass"
#define COLLADA_DYNAMICS_STRUCTURE			"dynamics"
#define COLLADA_RIGID_CONSTRAINT_STRUCTURE	"rigid_constraint"
#define COLLADA_BODY_PROPERTY				"body"
#define COLLADA_ATTACHMENT_STRUCTURE		"attachment"
#define COLLADA_ROT_LIMIT_MIN_STRUCTURE		"rot_limit_min"
#define COLLADA_ROT_LIMIT_MAX_STRUCTURE		"rot_limit_max"
#define COLLADA_TRANS_LIMIT_MIN_STRUCTURE	"trans_limit_min"
#define COLLADA_TRANS_LIMIT_MAX_STRUCTURE	"trans_limit_max"
#define COLLADA_ENABLED_STRUCTURE			"enabled"
#define COLLADA_INTERPENETRATE_STRUCTURE	"interpenetrate"
#define COLLADA_SPRING_STRUCTURE			"spring"
#define COLLADA_STIFFNESS_STRUCTURE			"stiffness"
#define COLLADA_DAMPING_STRUCTURE			"damping"
#define COLLADA_REST_LENGTH_STRUCTURE		"rest_length"
#define COLLADA_P0_STRUCTURE				"p0"
#define COLLADA_P1_STRUCTURE				"p1"
#define COLLADA_TRUE_KEYWORD				"TRUE"
#define COLLADA_FALSE_KEYWORD				"FALSE"

#define COLLADA_LINES_STRUCTURE				"lines"
#define COLLADA_LINESTRIP_STRUCTURE			"linestrips"
#define COLLADA_TRIFANS_STRUCTURE			"trifans"
#define COLLADA_TRISTRIPS_STRUCTURE			"tristrips"

// Extensions

// Feeling Software ColladaMaya extensions
#define COLLADA_MAYA_PROFILE                "MAYA"

#define COLLADA_MAYA_LAYER_ELEMENT          "layer"

// Feeling Software ColladaMax extensions
#define COLLADA_MAX3D_PROFILE               "MAX3D"

#define COLLADA_MAX3D_FRAMERATE_ELEMENT     "frame_rate"

// Feeling Software FCollada extensions
#define COLLADA_FCOLLADA_PROFILE            "FCOLLADA"

#define COLLADA_FCOLLADA_STARTTIME_ELEMENT  "start_time"
#define COLLADA_FCOLLADA_ENDTIME_ELEMENT    "end_time"
#define COLLADA_FCOLLADA_VISIBILITY_ELEMENT "visibility"

// XSI COLLADA extensions
#define COLLADA_XSI_PROFILE                 "XSI"

#define COLLADA_XSI_VISIBILITY_ELEMENT      "SI_Visibility"

// FBX COLLADA extensions
#define COLLADA_FBX_PROFILE                 "FBX"

#define COLLADA_FBX_TARGET_ELEMENT          "target"

// NVidia FXComposer extension -----------------------------------------------//

#define COLLADA_NVIDIA_FXCOMPOSER_PROFILE           "NVIDIA_FXCOMPOSER"

#define COLLADA_NVIDIA_FXCOMPOSER_IMPORT_ELEMENT    "import"
#define COLLADA_NVIDIA_FXCOMPOSER_URL_ATTRIBUTE     "url"
#define COLLADA_NVIDIA_FXCOMPOSER_COMPILER_OPTIONS_ATTRIBUTE  "compiler_options"
#define COLLADA_NVIDIA_FXCOMPOSER_PROFILE_ATTRIBUTE "profile"

#endif /* _FBXSDK_FILEIO_COLLADA_TOKENS_H_ */
