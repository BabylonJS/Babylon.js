/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxdebug.h
  * Debugging macros and functions.
  * 
  * All macros and functions are removed in release builds. To enable asserts, a debug build is required as well
  * as the environment variable "FBXSDK_ASSERT" set to 1 is also required. By default, assertions will pop-up
  * a window. It is possible to disable the pop-up on the Windows platform by calling the following code:
  * \code
  * _CrtSetReportMode(_CRT_ASSERT, _CRTDBG_MODE_DEBUG);
  * \endcode
  */
#ifndef _FBXSDK_CORE_ARCH_DEBUG_H_
#define _FBXSDK_CORE_ARCH_DEBUG_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** If this environment variable is set to 1, the FBX SDK will assert in debug builds */
#define FBXSDK_ASSERT_ENVSTR "FBXSDK_ASSERT"

/** The assertion procedure signature. If a different assertion procedure must be provided, it should have this signature.
* \param pFileName The file name where the assertion occurred.
* \param pFunctionName The function name where the assertion occurred.
* \param pLineNumber The line number in the file where the assertion occurred.
* \param pMessage The message to display when the assertion occurs. */
typedef void (*FbxAssertProc)(const char* pFileName, const char* pFunctionName, const unsigned int pLineNumber, const char* pMessage);

/** Change the procedure used when assertion occurs.
* \param pAssertProc The procedure to be called when assertions occurs. */
FBXSDK_DLL void FbxAssertSetProc(FbxAssertProc pAssertProc);

//! Change the procedure back to the default one.
FBXSDK_DLL void FbxAssertSetDefaultProc();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

FBXSDK_DLL void _FbxAssert(const char* pFileName, const char* pFunctionName, const unsigned int pLineNumber, bool pFormat, const char* pMessage, ...);
FBXSDK_DLL void _FbxTrace(const char* pMessage, ...);

#ifdef _DEBUG
    template <bool x> struct FbxStaticAssertType;
    template<> struct FbxStaticAssertType<true>			{enum{value=1};};
    template<> struct FbxStaticAssertType<false>		{enum{value=-1};};
	#define FBX_ASSERT(Condition)						{if(!(Condition)){_FbxAssert(__FILE__,__FUNCTION__,__LINE__,false,#Condition);}}
	#define FBX_ASSERT_MSG(Condition, Message, ...)		{if(!(Condition)){_FbxAssert(__FILE__,__FUNCTION__,__LINE__,true,Message,##__VA_ARGS__);}}
	#define FBX_ASSERT_NOW(Message, ...)				_FbxAssert(__FILE__,__FUNCTION__,__LINE__,true,Message,##__VA_ARGS__);
	#define FBX_ASSERT_RETURN(Condition)				{if(!(Condition)){FBX_ASSERT_NOW(#Condition); return;}}
	#define FBX_ASSERT_RETURN_VALUE(Condition, Value)	{if(!(Condition)){FBX_ASSERT_NOW(#Condition); return Value;}}
	#define FBX_ASSERT_STATIC(Condition)				typedef char FbxBuildBreakIfFalse[FbxStaticAssertType<(bool)(Condition)>::value];
	#define FBX_TRACE(Message, ...)						{_FbxTrace(Message,##__VA_ARGS__);}
#else
	#define FBX_ASSERT(Condition)						((void)0)
	#define FBX_ASSERT_MSG(Condition, Message, ...)		((void)0)
	#define FBX_ASSERT_NOW(Message, ...)				((void)0)
	#define FBX_ASSERT_RETURN(Condition)				if(!(Condition)){return;}
	#define FBX_ASSERT_RETURN_VALUE(Condition, Value)	if(!(Condition)){return Value;}
	#define FBX_ASSERT_STATIC(Condition)
	#define FBX_TRACE(Message, ...)						((void)0)
#endif

template<typename T> struct FbxIncompatibleWithArray{ enum {value = 0}; };

#define FBXSDK_INCOMPATIBLE_WITH_ARRAY_TEMPLATE(T)\
	struct FbxIncompatibleWithArray< T >{\
		union {\
			T t();\
		} catcherr;\
		enum {value = 1};}

#define FBXSDK_INCOMPATIBLE_WITH_ARRAY(T)\
	template<> FBXSDK_INCOMPATIBLE_WITH_ARRAY_TEMPLATE(T)

#define FBXSDK_IS_INCOMPATIBLE_WITH_ARRAY(T) ((bool) FbxIncompatibleWithArray<T>::value)

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_ARCH_DEBUG_H_ */
