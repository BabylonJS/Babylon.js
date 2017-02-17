/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxscopedloadingfilename.h
#ifndef _FBXSDK_CORE_SCOPED_LOADING_FILENAME_H_
#define _FBXSDK_CORE_SCOPED_LOADING_FILENAME_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/fbxloadingstrategy.h>
#include <fbxsdk/core/fbxmodule.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** 
 * A plug-in loading strategy that loads a single DLL by specifying the file name in the constructor, and unloads the DLL in its destructor.
 */
class FBXSDK_DLL FbxScopedLoadingFileName : public FbxLoadingStrategy
{
public:
    /**
     *\name Public interface
     */
    //@{
		/** Constructor.
		  * Load plug-in.
		  * \param pPath The file path.
		  */
		explicit FbxScopedLoadingFileName(const char* pPath);

		/** Destructor.
		 * Unload plug-in.
		 */
		virtual ~FbxScopedLoadingFileName();
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    virtual bool SpecificLoad(FbxPluginData& pData);
    virtual void SpecificUnload(FbxPluginData& pData);

    FbxModule mInstance;
    FbxString mPath;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_SCOPED_LOADING_FILENAME_H_ */
