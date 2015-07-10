/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxstdcompliant.h
* Macros to properly support the CRT secure functions. */
#ifndef _FBXSDK_CORE_ARCH_STDCOMPLIANT_H_
#define _FBXSDK_CORE_ARCH_STDCOMPLIANT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#if defined(FBXSDK_ENV_WIN)
	#define FBXSDK_printf							printf_s
	#define FBXSDK_fprintf							fprintf_s
	inline int FBXSDK_sprintf(char* dst, size_t dstsize, const char* format, ...){ va_list vl; va_start(vl, format); int ret = vsprintf_s(dst, dstsize, format, vl); va_end(vl); return ret; }
	inline int FBXSDK_snprintf(char* dst, size_t dstsize, const char* format, ...){ va_list vl; va_start(vl, format); int ret = vsnprintf_s(dst, dstsize, _TRUNCATE, format, vl); va_end(vl); return ret; }
	inline int FBXSDK_vsprintf(char* dst, size_t dstsize, const char* format, va_list vl){ return vsprintf_s(dst, dstsize, format, vl); }
	inline int FBXSDK_vsnprintf(char* dst, size_t dstsize, const char* format, va_list vl){ return vsnprintf_s(dst, dstsize, _TRUNCATE, format, vl); }
	#define FBXSDK_stricmp(dst, src)				_stricmp(dst, src)
	#define FBXSDK_strnicmp(dst, src, count)		_strnicmp(dst, src, count)
	#define FBXSDK_strcpy(dst, size, src)			strcpy_s(dst, size, src)
	#define FBXSDK_strncpy(dst, size, src, count)	strncpy_s(dst, size, src, count)
	#define FBXSDK_strcat(dst, size, src)			strcat_s(dst, size, src)
	#define FBXSDK_strtok(str, delim, ctx)			strtok_s(str, delim, ctx)
	#define FBXSDK_wcscpy(dst, size, src)			wcscpy_s(dst, size, src)
	#define FBXSDK_wcscat(dst, size, src)			wcscat_s(dst, size, src)
#if !defined(FBXSDK_ENV_WINSTORE)
	#define FBXSDK_getpid							_getpid
	#define FBXSDK_getcwd							_getcwd
#else
	inline int FBXSDK_getpid(){ return 0; }
	inline char* FBXSDK_getcwd(char*,int){ return NULL; }
#endif
	#define FBXSDK_localtime(ptm, time)				{ struct tm tms; ptm = &tms; localtime_s(ptm, time); }
	#define FBXSDK_gmtime(ptm, time)				{ struct tm tms; ptm = &tms; gmtime_s(ptm, time); }
	#define FBXSDK_fopen(fp, name, mode)			fopen_s(&fp, name, mode)

#elif defined(FBXSDK_ENV_MAC) || defined(FBXSDK_ENV_LINUX)
	#define FBXSDK_printf							printf
	#define FBXSDK_fprintf							fprintf
	inline int FBXSDK_sprintf(char* dst, size_t dstsize, const char* format, ...){ va_list vl; va_start(vl, format); int ret = vsprintf(dst, format, vl); va_end(vl); return ret; }
	inline int FBXSDK_snprintf(char* dst, size_t dstsize, const char* format, ...){ va_list vl; va_start(vl, format); int ret = vsnprintf(dst, dstsize, format, vl); va_end(vl); return ret; }
	inline int FBXSDK_vsprintf(char* dst, size_t dstsize, const char* format, va_list vl){ return vsprintf(dst, format, vl); }
	inline int FBXSDK_vsnprintf(char* dst, size_t dstsize, const char* format, va_list vl){ return vsnprintf(dst, dstsize, format, vl); }
	#define FBXSDK_stricmp(dst, src)				stricmp(dst, src)
	#define FBXSDK_strnicmp(dst, src, count)		strnicmp(dst, src, count)
	#define FBXSDK_strcpy(dst, size, src)			strcpy(dst, src)
	#define FBXSDK_strncpy(dst, size, src, count)	strncpy(dst, src, count)
	#define FBXSDK_strcat(dst, size, src)			strcat(dst, src)
	#define FBXSDK_strtok(str, delim, ctx)			strtok(str, delim)
	#define FBXSDK_wcscpy(dst, size, src)			wcscpy(dst, src)
	#define FBXSDK_wcscat(dst, size, src)			wcscat_s(dst, src)
	#define FBXSDK_getpid							getpid	
	#define FBXSDK_getcwd							getcwd
	#define FBXSDK_localtime(tm, time)				tm=localtime(time)
	#define FBXSDK_gmtime(tm, time)					tm=gmtime(time)
	#define FBXSDK_fopen(fp, name, mode)			fp=fopen(name, mode)

#else
	#error Unsupported platform!
#endif

#define FBXSDK_strdup								FbxStrDup

//The scanf family functions cannot easily be used in both secure and non-secure versions because
//Microsoft's secure version expects the size of the string/char* arguments following their address.
//On Unix machines the scanf family functions do not have this behavior and trying to use the same
//calls would result in compiler errors because the arguments would not match the format string.
//Using the following macros in the code will simply desable the warning at compile time.
#if defined(FBXSDK_COMPILER_MSC) && (_MSC_VER >= 1300)
	#define FBXSDK_CRT_SECURE_NO_WARNING_BEGIN\
	{\
		__pragma(warning(push))\
		__pragma(warning(disable : 4996))\
	}
    
	#define FBXSDK_CRT_SECURE_NO_WARNING_END\
	{\
		__pragma(warning(pop))\
	}
#else
	#define FBXSDK_CRT_SECURE_NO_WARNING_BEGIN
	#define FBXSDK_CRT_SECURE_NO_WARNING_END
#endif

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_ARCH_STDCOMPLIANT_H_ */
