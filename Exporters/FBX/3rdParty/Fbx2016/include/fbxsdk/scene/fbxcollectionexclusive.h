/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcollectionexclusive.h
#ifndef _FBXSDK_SCENE_COLLECTION_EXCLUSIVE_H_
#define _FBXSDK_SCENE_COLLECTION_EXCLUSIVE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxcollection.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class for exclusive collections. An object (FbxObject) should belong to only one exclusive collection at most.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxCollectionExclusive : public FbxCollection
{
    FBXSDK_OBJECT_DECLARE(FbxCollectionExclusive, FbxCollection);

public:
    /** Add a member if it's not a member of any other FbxCollectionExclusive objects.
      * \param pMember Object to be added
      */
    bool AddMember(FbxObject* pMember);
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_COLLECTION_EXCLUSIVE_H_ */
