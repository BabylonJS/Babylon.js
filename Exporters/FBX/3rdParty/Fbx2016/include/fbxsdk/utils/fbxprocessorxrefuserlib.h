/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxprocessorxrefuserlib.h
#ifndef _FBXSDK_UTILS_PROCESSOR_XREF_USERLIB_H_
#define _FBXSDK_UTILS_PROCESSOR_XREF_USERLIB_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/utils/fbxprocessorxref.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**
  * Specialized xref copy processor
  */
class FBXSDK_DLL FbxProcessorXRefCopyUserLibrary : public FbxProcessorXRefCopy
{
    FBXSDK_OBJECT_DECLARE(FbxProcessorXRefCopyUserLibrary, FbxProcessorXRefCopy);

public:
    /**
    * \name Properties
    */
    //@{
        // Do we copy files even if they are in the system library?
        // Defaults to FALSE.
        FbxPropertyT<FbxBool>     CopyAllAssets;

        // Do we copy files even if they are not within the scene?  This is
        // the typical use case when creating a new library, and defaults to
        // TRUE.  If you want to extract assets from a specific library you
        // you would set this to FALSE to ignore assets from external (user,
        // system) libraries.
        FbxPropertyT<FbxBool>     CopyExternalAssets;

        // Do we copy assets that use absolute paths?  If true, then after
        // the scene processor has run through the URL will be relative to
        // the scene document.
        // Defaults to TRUE.
        FbxPropertyT<FbxBool>     CopyAbsoluteUrlAssets;
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
    virtual bool ValidPropertyForXRefCopy(FbxObject* pObject, FbxProperty& lProperty) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_PROCESSOR_XREF_USERLIB_H_ */
