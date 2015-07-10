/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxtypes.h
  * Basic types definition.
  *
  * Standard basic types used across the FBX SDK. There is also platform independent
  * definitions that guarantee size across operating systems. The FBXSDK_SYSTEM_IS_LP64
  * define is set to 1 when the operating system defines the "long" C++ type as 64-bit.
  */
#ifndef _FBXSDK_CORE_ARCH_TYPES_H_
#define _FBXSDK_CORE_ARCH_TYPES_H_

#include <fbxsdk/core/arch/fbxarch.h>

//Note: On MacOSX and Linux 64-bit, long is defined as 64-bits while on Windows
//it is still a 32-bits for backward compatibility. We stick with Windows standard.
#if defined(FBXSDK_CPU_64) && !defined(FBXSDK_ENV_WIN)
	#define FBXSDK_SYSTEM_IS_LP64 1
#endif

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxObject;

typedef bool			FbxBool;
typedef signed char		FbxChar;
typedef unsigned char	FbxUChar;
typedef signed short	FbxShort;
typedef unsigned short	FbxUShort;
typedef signed int		FbxInt;
typedef unsigned int	FbxUInt;
typedef float			FbxFloat;
typedef double			FbxDouble;

typedef FbxBool*		FbxBoolPtr;
typedef FbxChar*		FbxCharPtr;
typedef FbxUChar*		FbxUCharPtr;
typedef FbxShort*		FbxShortPtr;
typedef FbxUShort*		FbxUShortPtr;
typedef FbxInt*			FbxIntPtr;
typedef FbxUInt*		FbxUIntPtr;
typedef FbxFloat*		FbxFloatPtr;
typedef FbxDouble*		FbxDoublePtr;

typedef FbxInt			FbxEnum;
typedef FbxObject*		FbxReference;

//-------------------------------------------------------------------------------------
//Architecture independent defines (guarantee size)
#if defined(FBXSDK_COMPILER_MSC)
	#define FBXSDK_LONGLONG(x)	(x##i64)
	#define FBXSDK_ULONGLONG(x)	(x##Ui64)

	typedef signed __int8		FbxInt8;
	typedef unsigned __int8		FbxUInt8;
	typedef signed __int16		FbxInt16;
	typedef unsigned __int16	FbxUInt16;
	typedef signed __int32		FbxInt32;
	typedef unsigned __int32	FbxUInt32;
	typedef signed __int64		FbxInt64;
	typedef unsigned __int64	FbxUInt64;
#else
	#define FBXSDK_LONGLONG(x)	(x##LL)
	#define FBXSDK_ULONGLONG(x)	(x##ULL)

	typedef signed char			FbxInt8;
	typedef unsigned char		FbxUInt8;
	typedef signed short		FbxInt16;
	typedef unsigned short		FbxUInt16;
	typedef signed int			FbxInt32;
	typedef unsigned int		FbxUInt32;
	typedef signed long long	FbxInt64;
	typedef unsigned long long	FbxUInt64;
#endif

#ifdef FBXSDK_SYSTEM_IS_LP64
	typedef signed int			FbxLong;
	typedef unsigned int		FbxULong;
#else
	typedef signed long			FbxLong;
	typedef unsigned long		FbxULong;
#endif
typedef FbxInt64				FbxLongLong;
typedef FbxUInt64				FbxULongLong;

typedef FbxLong*				FbxLongPtr;
typedef FbxULong*				FbxULongPtr;
typedef FbxLongLong*			FbxLongLongPtr;
typedef FbxULongLong*			FbxULongLongPtr;


#if defined(FBXSDK_ENV_EMSCRIPTEN)
	typedef FbxInt32 			__int32_t;
	typedef FbxUInt32			__uint32_t;
	typedef FbxInt64  			__int64_t;
	typedef FbxUInt64			__uint64_t;
#endif

//-------------------------------------------------------------------------------------
//Minimum and Maximum values for types
#define FBXSDK_CHAR_MIN			-128
#define FBXSDK_CHAR_MAX			127
#define FBXSDK_UCHAR_MIN		0
#define FBXSDK_UCHAR_MAX		255
#define FBXSDK_SHORT_MIN		-32768
#define FBXSDK_SHORT_MAX		32767
#define FBXSDK_USHORT_MIN		0
#define FBXSDK_USHORT_MAX		65535
#define FBXSDK_INT_MIN			0x80000000
#define FBXSDK_INT_MAX			0x7fffffff
#define FBXSDK_UINT_MIN			0
#define FBXSDK_UINT_MAX			0xffffffff
#define FBXSDK_LONG_MIN			FBXSDK_INT_MIN
#define FBXSDK_LONG_MAX			FBXSDK_INT_MAX
#define FBXSDK_ULONG_MIN		FBXSDK_UINT_MIN
#define FBXSDK_ULONG_MAX		FBXSDK_UINT_MAX
#define FBXSDK_LONGLONG_MIN		FBXSDK_LONGLONG(0x8000000000000000)
#define FBXSDK_LONGLONG_MAX		FBXSDK_LONGLONG(0x7fffffffffffffff)
#define FBXSDK_ULONGLONG_MIN	FBXSDK_ULONGLONG(0)
#define FBXSDK_ULONGLONG_MAX	FBXSDK_ULONGLONG(0xffffffffffffffff)
#define FBXSDK_FLOAT_MIN		FLT_MIN
#define FBXSDK_FLOAT_MAX		FLT_MAX
#define FBXSDK_FLOAT_EPSILON	FLT_EPSILON
#define FBXSDK_DOUBLE_MIN		DBL_MIN
#define FBXSDK_DOUBLE_MAX		DBL_MAX
#define FBXSDK_DOUBLE_EPSILON	DBL_EPSILON
#define FBXSDK_TOLERANCE		(1.0e-6)

//-------------------------------------------------------------------------------------
//Handle and atomic definition (size change depending of architecture)
#if defined(FBXSDK_CPU_32)
	typedef FbxUInt32			FbxHandle;
	#define FBXSDK_REF_MIN		FBXSDK_UINT_MIN
	#define FBXSDK_REF_MAX		FBXSDK_UINT_MAX

	typedef FbxLong				FbxAtomic;
	#define FBXSDK_ATOMIC_MIN	FBXSDK_LONG_MIN
	#define FBXSDK_ATOMIC_MAX	FBXSDK_LONG_MAX
#elif defined(FBXSDK_CPU_64)
	typedef FbxUInt64			FbxHandle;
	#define FBXSDK_REF_MIN		FBXSDK_ULONGLONG_MIN
	#define FBXSDK_REF_MAX		FBXSDK_ULONGLONG_MAX

	typedef FbxInt64			FbxAtomic;
	#define FBXSDK_ATOMIC_MIN	FBXSDK_LONGLONG_MIN
	#define FBXSDK_ATOMIC_MAX	FBXSDK_LONGLONG_MAX
#else
	#error Unsupported architecture!
#endif

//-------------------------------------------------------------------------------------
//Various utility functions for fbxsdk basic types
inline const FbxChar				FbxMin(const FbxChar){ return FBXSDK_CHAR_MIN; }
inline const FbxUChar				FbxMin(const FbxUChar){ return FBXSDK_UCHAR_MIN; }
inline const FbxShort				FbxMin(const FbxShort){ return FBXSDK_SHORT_MIN; }
inline const FbxUShort				FbxMin(const FbxUShort){ return FBXSDK_USHORT_MIN; }
inline const FbxInt					FbxMin(const FbxInt){ return FBXSDK_INT_MIN; }
inline const FbxUInt				FbxMin(const FbxUInt){ return FBXSDK_UINT_MIN; }
inline const FbxLongLong			FbxMin(const FbxLongLong){ return FBXSDK_LONGLONG_MIN; }
inline const FbxULongLong			FbxMin(const FbxULongLong){ return FBXSDK_ULONGLONG_MIN; }
inline const FbxFloat				FbxMin(const FbxFloat){ return FBXSDK_FLOAT_MIN; }
inline const FbxDouble				FbxMin(const FbxDouble){ return FBXSDK_DOUBLE_MIN; }

inline const FbxChar				FbxMax(const FbxChar){ return FBXSDK_CHAR_MAX; }
inline const FbxUChar				FbxMax(const FbxUChar){ return FBXSDK_UCHAR_MAX; }
inline const FbxShort				FbxMax(const FbxShort){ return FBXSDK_SHORT_MAX; }
inline const FbxUShort				FbxMax(const FbxUShort){ return FBXSDK_USHORT_MAX; }
inline const FbxInt					FbxMax(const FbxInt){ return FBXSDK_INT_MAX; }
inline const FbxUInt				FbxMax(const FbxUInt){ return FBXSDK_UINT_MAX; }
inline const FbxLongLong			FbxMax(const FbxLongLong){ return FBXSDK_LONGLONG_MAX; }
inline const FbxULongLong			FbxMax(const FbxULongLong){ return FBXSDK_ULONGLONG_MAX; }
inline const FbxFloat				FbxMax(const FbxFloat){ return FBXSDK_FLOAT_MAX; }
inline const FbxDouble				FbxMax(const FbxDouble){ return FBXSDK_DOUBLE_MAX; }

#ifndef FBXSDK_SYSTEM_IS_LP64
	inline const FbxLong			FbxMin(const FbxLong){ return FBXSDK_LONG_MIN; }
	inline const FbxULong			FbxMin(const FbxULong){ return FBXSDK_ULONG_MIN; }
	inline const FbxLong			FbxMax(const FbxLong){ return FBXSDK_LONG_MAX; }
	inline const FbxULong			FbxMax(const FbxULong){ return FBXSDK_ULONG_MAX; }
#endif

template<class T> inline const T	FbxMin(const T){};
template<class T> inline const T	FbxMax(const T){};

template<class T> inline T			FbxMin(const T x, const T y){ return (x < y) ? x : y; }
template<class T> inline T			FbxMax(const T x, const T y){ return (x > y) ? x : y; }

//-------------------------------------------------------------------------------------
//Vector Template Types
template<class T> class FBXSDK_DLL FbxVectorTemplate2
{
public:
	inline FbxVectorTemplate2(){ *this = T(0); }
	inline explicit FbxVectorTemplate2(T pValue){ *this = pValue; }
	inline FbxVectorTemplate2(T pData0, T pData1){ mData[0] = pData0; mData[1] = pData1; }
	inline ~FbxVectorTemplate2(){}
	inline T& operator[](int pIndex){ return mData[pIndex]; }
	inline const T& operator[](int pIndex) const { return mData[pIndex]; }
	inline FbxVectorTemplate2<T>& operator=(const T& pValue){ mData[0] = pValue; mData[1] = pValue; return *this; }
	inline FbxVectorTemplate2<T>& operator=(const FbxVectorTemplate2<T>& pVector){ mData[0] = pVector.mData[0]; mData[1] = pVector.mData[1]; return *this; }
	inline bool operator==(const FbxVectorTemplate2<T>& pVector) const { return ((mData[0] == pVector.mData[0]) && (mData[1] == pVector.mData[1])); }
	inline bool operator!=(const FbxVectorTemplate2<T>& pVector) const { return !operator==( pVector ); }
	inline T* Buffer(){ return mData; }
	inline const T* Buffer() const { return mData; }
	T mData[2];
};

template<class T> class FBXSDK_DLL FbxVectorTemplate3
{
public:
	inline FbxVectorTemplate3(){ *this = T(0); }
	inline explicit FbxVectorTemplate3(T pValue){ *this = pValue; }
	inline FbxVectorTemplate3(T pData0, T pData1, T pData2){ mData[0] = pData0; mData[1] = pData1; mData[2] = pData2; }
	inline ~FbxVectorTemplate3(){}
	inline T& operator[](int pIndex) { return mData[pIndex]; }
	inline const T& operator[](int pIndex) const { return mData[pIndex]; }
	inline operator FbxVectorTemplate2<T>& () const { return *((FbxVectorTemplate2<T>*)this); }
	inline FbxVectorTemplate3<T>& operator=(T const &pValue){ mData[0] = pValue; mData[1] = pValue; mData[2] = pValue; return *this; }
	inline FbxVectorTemplate3<T>& operator=(const FbxVectorTemplate2<T>& pVector){ mData[0] = pVector.mData[0]; mData[1] = pVector.mData[1]; return *this; }
	inline FbxVectorTemplate3<T>& operator=(const FbxVectorTemplate3<T>& pVector){ mData[0] = pVector.mData[0]; mData[1] = pVector.mData[1]; mData[2] = pVector.mData[2]; return *this; }
	inline bool operator==(const FbxVectorTemplate3<T>& pVector) const { return ((mData[0] == pVector.mData[0]) && (mData[1] == pVector.mData[1]) && (mData[2] == pVector.mData[2])); }
	inline bool operator!=(const FbxVectorTemplate3<T>& pVector) const { return !operator==(pVector); }
	inline T* Buffer(){ return mData; }
	inline const T* Buffer() const { return mData; }
	T mData[3];
};

template<class T> class FBXSDK_DLL FbxVectorTemplate4
{
public:
	inline FbxVectorTemplate4(){ *this = T(0); }
	inline explicit FbxVectorTemplate4(T pValue){ *this = pValue; }
	inline FbxVectorTemplate4(T pData0, T pData1, T pData2, T pData3){ mData[0] = pData0; mData[1] = pData1; mData[2] = pData2; mData[3] = pData3; }
	inline ~FbxVectorTemplate4(){}
	inline T& operator[](int pIndex){ return mData[pIndex]; }
	inline const T& operator[](int pIndex) const { return mData[pIndex]; }
	inline operator FbxVectorTemplate3<T>& () const { return *((FbxVectorTemplate3<T>*)this); }
	inline FbxVectorTemplate4<T>& operator=(const T& pValue){ mData[0] = pValue; mData[1] = pValue; mData[2] = pValue; mData[3] = pValue; return *this; }
	inline FbxVectorTemplate4<T>& operator=(const FbxVectorTemplate3<T>& pValue){ mData[0] = pValue[0]; mData[1] = pValue[1]; mData[2] = pValue[2]; return *this; }
	inline FbxVectorTemplate4<T>& operator=(const FbxVectorTemplate4<T>& pVector){ mData[0] = pVector.mData[0]; mData[1] = pVector.mData[1]; mData[2] = pVector.mData[2]; mData[3] = pVector.mData[3]; return *this; }
	inline bool operator==(const FbxVectorTemplate4<T>& pVector) const { return ((mData[0] == pVector.mData[0]) && (mData[1] == pVector.mData[1]) && (mData[2] == pVector.mData[2]) && (mData[3] == pVector.mData[3])); }
	inline bool operator!=(const FbxVectorTemplate4<T>& pVector) const { return !operator==( pVector ); }
	inline T* Buffer(){ return mData; }
	inline const T* Buffer() const { return mData; }
	T mData[4];
};

typedef FbxVectorTemplate2<FbxDouble> FbxDouble2;
typedef FbxVectorTemplate3<FbxDouble> FbxDouble3;
typedef FbxVectorTemplate4<FbxDouble> FbxDouble4;
typedef FbxVectorTemplate4<FbxDouble4> FbxDouble4x4;

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_ARCH_TYPES_H_ */
