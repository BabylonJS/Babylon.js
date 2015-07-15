/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxenvironment.h
#ifndef _FBXSDK_SCENE_ENVIRONMENT_H_
#define _FBXSDK_SCENE_ENVIRONMENT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains the description of a scene environment. It contains the properties of sun parameters,
  * sky parameters, daylight controller parameters ,environment map parameters 
  * and cloud map parameters.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxEnvironment : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxEnvironment, FbxObject);

public:
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	bool ProvidesLighting() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ENVIRONMENT_H_ */
