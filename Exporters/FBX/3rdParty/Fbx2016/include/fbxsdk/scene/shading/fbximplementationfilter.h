/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbximplementationfilter.h
#ifndef _FBXSDK_SCENE_SHADING_IMPLEMENTATION_FILTER_H_
#define _FBXSDK_SCENE_SHADING_IMPLEMENTATION_FILTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxobjectfilter.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCriteria;

/** \brief This object represents a shading node filter criteria 
  * based on the shading node implementation.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxImplementationFilter : public FbxObjectFilter
{

public:

	/** The default shading API.
      */
	static const char * sCHR_ANY_SHADING_API;

	/** The default shading API version.
      */
	static const char * sCHR_ANY_SHADING_API_VERSION;

	/** The default shading language.
      */
	static const char * sCHR_ANY_SHADING_LANGUAGE;
	
	/** The default shading language version.
      */
	static const char * sCHR_ANY_SHADING_LANGUAGE_VERSION;


    /** Constructor
	  * \param pShadingAPI a string containing the implementation API name:
	  *		MentalRay
	  *		OpenGL
	  *		DirectX
	  *
	  * \param pShadingAPIVersion a string containing the implementation API version:
	  *		eg. 1.0
	  *
	  * \param pShadingLanguage a string identifying the implementation language name:
	  *		GLSL	= GL Shading Language
	  *		HLSL	= High Level Shading Language
	  *		CGFX	= CG effect(NVidia)
	  *		RIB		= RenderMan (RIB)
	  *		etc...
	  *
	  * \param pShadingLanguageVersion a string identifying the implementation language version:
	  *		eg. 1.0
	  *
	  * \remarks by default the created criteria correspond to any shader
	  */
	FbxImplementationFilter(
		const char * pShadingAPI				= sCHR_ANY_SHADING_API,
		const char * pShadingAPIVersion			= sCHR_ANY_SHADING_API_VERSION,
		const char * pShadingLanguage			= sCHR_ANY_SHADING_LANGUAGE,
		const char * pShadingLanguageVersion	= sCHR_ANY_SHADING_LANGUAGE_VERSION
	);

    //! Destructor.
    virtual ~FbxImplementationFilter();

	/** Tells if this filter matches the given shading node implementation
	  * \param pObjectPtr The given shading node implementation
	  */
	virtual bool Match(const FbxObject * pObjectPtr) const;

	//! Stores the shading API
	FbxString mShadingAPI;

	//! Stores the shading API Version
	FbxString mShadingAPIVersion;

	//! Stores the shading language
	FbxString mShadingLanguage;

	//! Stores the shading language version
	FbxString mShadingLanguageVersion;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	/** Utility method to determine if the given object is a shading node
	  * that we recognize.
	  */
	static bool IsShadingObject( const FbxObject* pObject );

	/** Returns a criteria suitable for use with querying connections 
	  * to shading nodes that we recognize, on FbxObject.
	  */
	static FbxCriteria Criteria();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_IMPLEMENTATION_FILTER_H_ */
