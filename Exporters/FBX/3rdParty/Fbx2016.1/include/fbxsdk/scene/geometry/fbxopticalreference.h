/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxopticalreference.h
#ifndef _FBXSDK_SCENE_GEOMETRY_OPTICAL_REFERENCE_H_
#define _FBXSDK_SCENE_GEOMETRY_OPTICAL_REFERENCE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	\brief This node attribute contains the properties of an optical reference.
  * \nosubgrouping
  * Mainly used for optical motion capture systems.
  */
class FBXSDK_DLL FbxOpticalReference : public FbxNodeAttribute
{
	FBXSDK_OBJECT_DECLARE(FbxOpticalReference,FbxNodeAttribute);

public:
	//! Return the type of node attribute which is FbxNodeAttribute::EType::eOpticalReference.
	virtual FbxNodeAttribute::EType GetAttributeType() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual FbxStringList	GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_OPTICAL_REFERENCE_H_ */
