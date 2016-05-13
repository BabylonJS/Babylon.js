/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxsdk_def.h
  * FBX SDK environment definition.
  *
  * This file is the principal FBX SDK environment definition. It is used at the top of
  * every header and source file so that every unit is using the same definitions.
  */
#ifndef _FBXSDK_DEFINITION_H_
#define _FBXSDK_DEFINITION_H_

//---------------------------------------------------------------------------------------
//System Includes
#include <stdlib.h>
#include <stdarg.h>
#include <stddef.h>
#include <stdio.h>
#include <ctype.h>
#include <string.h>
#include <wchar.h>
#include <locale.h>
#include <float.h>
#include <math.h>
#include <time.h>

//---------------------------------------------------------------------------------------
//Define Version and Namespace
#include <fbxsdk/fbxsdk_version.h>

//---------------------------------------------------------------------------------------
//Define Architecture
#include <fbxsdk/core/arch/fbxarch.h>
#include <fbxsdk/core/arch/fbxtypes.h>
#include <fbxsdk/core/arch/fbxdebug.h>
#include <fbxsdk/core/arch/fbxalloc.h>
#include <fbxsdk/core/arch/fbxnew.h>
#include <fbxsdk/core/arch/fbxstdcompliant.h>

//---------------------------------------------------------------------------------------
//Useful Macros
#define FBX_SAFE_DELETE(p)			{FbxDelete(p);(p)=NULL;}
#define FBX_SAFE_DELETE_ARRAY(a)	{FbxDeleteArray(a);(a)=NULL;}
#define FBX_SAFE_DESTROY(p)			if(p){(p)->Destroy();(p)=NULL;}
#define FBX_SAFE_FREE(p)			if(p){FbxFree(p);(p)=NULL;}

#endif /* _FBXSDK_DEFINITION_H_ */
