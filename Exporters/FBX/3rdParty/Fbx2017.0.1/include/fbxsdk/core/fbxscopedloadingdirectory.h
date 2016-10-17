/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxscopedloadingdirectory.h
#ifndef _FBXSDK_CORE_SCOPED_LOADING_DIRECTORY_H_
#define _FBXSDK_CORE_SCOPED_LOADING_DIRECTORY_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/fbxloadingstrategy.h>
#include <fbxsdk/core/fbxmodule.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxPluginHandle;

//! A plug-in loading strategy that loads all DLLs with a specific extension from a specific directory. When this class is destroyed all of the plug-ins are unloaded.
class FBXSDK_DLL FbxScopedLoadingDirectory : public FbxLoadingStrategy
{
public:
	/** Constructor, which also load plug-ins in the folder specified.
	* \param pDirectoryPath The directory path.
	* \param pPluginExtension The plug-in extension. */
	FbxScopedLoadingDirectory(const char* pDirectoryPath, const char* pPluginExtension);

	/** Destructor. Unload plug-ins. */
	virtual ~FbxScopedLoadingDirectory();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	virtual bool SpecificLoad(FbxPluginData& pData);
	virtual void SpecificUnload(FbxPluginData& pData);

	FbxString mDirectoryPath;
	FbxString mExtension;

	FbxArray<FbxModule> mPluginHandles;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_SCOPED_LOADING_DIRECTORY_H_ */
