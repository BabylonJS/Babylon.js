/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmodule.h
#ifndef _FBXSDK_CORE_MODULE_H_
#define _FBXSDK_CORE_MODULE_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/fbxsdk_nsbegin.h>

typedef void* FbxModule;

/** Loads the specified module into the address space of the calling process.
  * \param pFilePath The full file path name of the module to load.
  * \return The module handle if it successfully loaded, otherwise NULL.
  * \remark The specified module may cause other modules to be loaded.
  */
FBXSDK_DLL FbxModule FbxModuleLoad(const char* pFilePath);

/** Retrieves the address of an exported function or variable from the specified module.
  * \param pModuleHandle A valid module handle.
  * \param pProcName The procedure name to search.
  * \return The procedure handle if valid, otherwise NULL.
  */
FBXSDK_DLL void* FbxModuleGetProc(FbxModule pModuleHandle, const char* pProcName);

/** Frees the loaded module and, if necessary, decrements its reference count.
  * \param pModuleHandle A valid module handle.
  * \return \c true on success, \c false otherwise.
  * \remark When the reference count reaches zero, the module is unloaded from the address space of the calling process and the handle is no longer valid.
  */
FBXSDK_DLL bool FbxModuleFree(FbxModule pModuleHandle);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_MODULE_H_ */
