/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreference.h
#ifndef _FBXSDK_SCENE_REFERENCE_H_
#define _FBXSDK_SCENE_REFERENCE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Contains information about a referenced file.
* \nosubgrouping
*/
class FBXSDK_DLL FbxSceneReference : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxSceneReference, FbxObject);

public:
    /// \name Basic properties
    //@{
    //! Path to the referenced file.
    FbxPropertyT< FbxString >	 	  ReferenceFilePath;
    //! Referenced file's namespace.
    FbxPropertyT< FbxString >	 	  ReferenceNameSpace;
    //! Referenced file's node name.
    FbxPropertyT< FbxString >	 	  ReferenceNodeName;
    //! Referenced file's node depth.
    FbxPropertyT< FbxInt>	 		      ReferenceDepth;
    //! \c True if referenced file is loaded.
    FbxPropertyT< FbxBool >	 		  IsLoaded;
    //! \c True if referenced file is locked.
    FbxPropertyT< FbxBool >	 		  IsLocked;
    //@}

    /// \name Proxy related properties.
    //@{
    	//! \c True if referenced file is the original proxy.
    	FbxPropertyT< FbxBool >	 		  IsOriginalProxy;

    	//! \c True if referenced file is active.
    	FbxPropertyT< FbxBool >	 		  IsActiveProxy;

    	//! The name of proxy manager where the referenced file's proxy can be found.
    	FbxPropertyT< FbxString >	 	  ProxyManagerName;
     	/** Referenced file's proxy tag.
		  * \remarks Proxy tags are unique names assigned to proxy references to more easily manage those references in Maya.
		  */
		FbxPropertyT< FbxString >	 	  ProxyTag;
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_REFERENCE_H_ */
