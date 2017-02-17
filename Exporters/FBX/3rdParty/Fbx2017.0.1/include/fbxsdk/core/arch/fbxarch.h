/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxarch.h
  * Architecture definition.
  * 
  * List of available preprocessor defines that can appear on various systems:
  *
  * Operating System Environment:
  *    FBXSDK_ENV_WIN (Windows)
  *    FBXSDK_ENV_WINSTORE (Windows Store App)
  *    FBXSDK_ENV_MAC (MacOSX)
  *    FBXSDK_ENV_IOS (iOS)
  *    FBXSDK_ENV_LINUX (Linux)
  *
  * Architecture:
  *    FBXSDK_ARCH_IX86 (Intel x86)
  *    FBXSDK_ARCH_AMD64 (AMD64)
  *    FBXSDK_ARCH_ARM (Advanced RISC Machine)
  *
  * Processor:
  *    FBXSDK_CPU_32 (32bit processor)
  *    FBXSDK_CPU_64 (64bit processor)
  *
  * Compiler:
  *    FBXSDK_COMPILER_MSC (Microsoft Compiler)
  *    FBXSDK_COMPILER_GNU (GNU Compiler)
  *    FBXSDK_COMPILER_INTEL (Intel Compiler)
  *    FBXSDK_COMPILER_CLANG (Clang Compiler)
  *
  * These definitions are based on the information found here:
  * http://predef.sourceforge.net/index.php
  *
  */
#ifndef _FBXSDK_CORE_ARCH_ARCH_H_
#define _FBXSDK_CORE_ARCH_ARCH_H_

#if defined(_WIN32) || defined(_WIN64) //Microsoft Windows ------------------------------

	#define FBXSDK_ENV_WIN 1

	#if defined(WINAPI_FAMILY) && (WINAPI_FAMILY == WINAPI_FAMILY_APP)
		#define FBXSDK_ENV_WINSTORE 1
	#endif

	#if defined(_M_X64)
		#define FBXSDK_ARCH_AMD64 1
		#define FBXSDK_CPU_64 1
	#elif defined(_M_IX86)
		#define FBXSDK_ARCH_IX86 1
		#define FBXSDK_CPU_32 1
	#elif defined(_M_ARM)
		#define FBXSDK_ARCH_ARM 1
		#define FBXSDK_CPU_32 1
	#else
		#error Unsupported architecture!
	#endif

	#if defined(_MSC_VER)
		#define FBXSDK_COMPILER_MSC 1
	#elif defined(__GNUC__)
		#define FBXSDK_COMPILER_GNU 1
	#elif defined(__ICL)
		#define FBXSDK_COMPILER_INTEL 1
	#else
		#error Unsupported compiler!
	#endif

#elif defined(__APPLE__) || defined(__MACH__) //Apple MacOS/X ---------------------------

    #include "TargetConditionals.h"

	#define FBXSDK_ENV_MAC 1

    #if TARGET_OS_IPHONE || TARGET_IPHONE_SIMULATOR
        #define FBXSDK_ENV_IOS 1
    #endif

	#if defined(__i386__)
		#define FBXSDK_ARCH_IX86 1
		#define FBXSDK_CPU_32 1
	#elif defined(__x86_64__) || defined(__x86_64)
		#define FBXSDK_ARCH_AMD64 1
		#define FBXSDK_CPU_64 1
	#elif defined(__arm__)
		#define FBXSDK_ARCH_ARM 1
		#define FBXSDK_CPU_32 1
    #elif defined(__arm64__)
        #define FBXSDK_ARCH_ARM 1
        #define FBXSDK_CPU_64 1
	#else
		#error Unsupported architecture!
	#endif

	#if defined(__GNUC__)
		#define FBXSDK_COMPILER_GNU 1
	#endif

    #if defined(__clang__)
        #define FBXSDK_COMPILER_CLANG 1
	#endif

	#if !defined(FBXSDK_COMPILER_GNU) && !defined(FBXSDK_COMPILER_CLANG)
		#error Unsupported compiler!
	#endif

#elif defined(__linux__) || defined(__CYGWIN__) || defined(EMSCRIPTEN) || defined(ANDROID) //Linux ---------------------------------

	#define FBXSDK_ENV_LINUX 1

  	#if defined(EMSCRIPTEN)
  		#define FBXSDK_ENV_EMSCRIPTEN 1
  	#endif

	#if defined(ANDROID)
		#define FBXSDK_ENV_ANDROID 1
	#endif

	#if defined(__i386__)
		#define FBXSDK_ARCH_IX86 1
		#define FBXSDK_CPU_32 1
	#elif defined(__x86_64__) || defined(__x86_64)
		#define FBXSDK_ARCH_AMD64 1
		#define FBXSDK_CPU_64 1
    #elif defined(__arm__)
		#define FBXSDK_ARCH_ARM 1
		#define FBXSDK_CPU_32 1
	#elif defined(EMSCRIPTEN)
  		#define FBXSDK_ARCH_AMD64 1
		#define FBXSDK_CPU_64 1
  	#else
		#error Unsupported architecture!
	#endif

	#if defined(__GNUC__)
		#define FBXSDK_COMPILER_GNU 1
	#elif defined(EMSCRIPTEN)
  		#define FBXSDK_COMPILER_EMSCRIPTEN 1 
	#else
		#error Unsupported compiler!
	#endif
 #else
	#error Unsupported platform!
#endif

//---------------------------------------------------------------------------------------
//Compiler Specifics
#if defined(FBXSDK_SHARED)
	#if defined(FBXSDK_COMPILER_MSC) || defined(FBXSDK_COMPILER_INTEL)
		#define FBXSDK_DLLIMPORT __declspec(dllimport)
		#define FBXSDK_DLLEXPORT __declspec(dllexport)
	#elif defined(FBXSDK_COMPILER_GNU) && (__GNUC__ >= 4)
		#define FBXSDK_DLLIMPORT __attribute__((visibility("default")))
		#define FBXSDK_DLLEXPORT __attribute__((visibility("default")))
	#else
		#define FBXSDK_DLLIMPORT
		#define FBXSDK_DLLEXPORT
	#endif
#else
	#define FBXSDK_DLLIMPORT
	#define FBXSDK_DLLEXPORT
#endif

#ifndef FBXSDK_DLL
	#define FBXSDK_DLL FBXSDK_DLLIMPORT
#endif

#if defined(FBXSDK_COMPILER_MSC)
	#pragma warning(disable : 4251)	//'identifier' : class 'type' needs to have dll-interface to be used by clients of class 'type2'
    #if _MSC_VER >= 1300 // 7.1
        #define FBX_DEPRECATED __declspec(deprecated)
    #else
        #define FBX_DEPRECATED
    #endif
#elif defined(FBXSDK_COMPILER_GNU) || defined(FBXSDK_COMPILER_EMSCRIPTEN)
    #define FBX_DEPRECATED __attribute__((deprecated))
#elif defined(FBXSDK_COMPILER_INTEL)
    #if __INTEL_COMPILER >= 810
        #define FBX_DEPRECATED __declspec(deprecated)
    #else
        #define FBX_DEPRECATED
    #endif
#else
	#error Unsupported compiler!
#endif

#ifdef FBXSDK_COMPILER_CLANG
	#define FBX_UNUSED(p) _Pragma(FBX_STRINGIFY(unused(p)))
#else
	#define FBX_UNUSED(p) (void)(p)
#endif

//---------------------------------------------------------------------------------------
//Platform Standardization
#ifndef NULL
	#if defined(__GNUG__) && (__GNUC__ > 2 || (__GNUC__ == 2 && __GNUC_MINOR__ >= 8))
		#define NULL (__null)
	#else	
    	#if defined(__cplusplus)
    		#define NULL 0
    	#else
    		#define NULL ((void*)0)
    	#endif
    #endif
#endif

#if !defined(_MAX_PATH)
	#define _MAX_PATH 260
#endif

#if defined(FBXSDK_ENV_WIN)
	#define snprintf _snprintf //for stdio.h platform compatibility
#endif

#if !defined(FBXSDK_COMPILER_MSC)
	#ifndef strcmpi
		#define strcmpi strcasecmp
	#endif
	#ifndef stricmp
		#define stricmp strcasecmp
	#endif
	#ifndef strncmpi
		#define strncmpi strncasecmp
	#endif
	#ifndef strnicmp
		#define strnicmp strncasecmp
	#endif
#endif

#endif /* _FBXSDK_CORE_ARCH_ARCH_H_ */
