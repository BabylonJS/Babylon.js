/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpair.h
#ifndef _FBXSDK_CORE_BASE_PAIR_H_
#define _FBXSDK_CORE_BASE_PAIR_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class template holds a pair of objects.
* \nosubgrouping */
template <typename First, typename Second> class FbxPair
{
public:
	//! Constructor.
	inline FbxPair() : mFirst(), mSecond() {}

	/** Constructor.
	* \param pFirst The first object.
	* \param pSecond The second object. */
	inline FbxPair(const First& pFirst, const Second& pSecond) : mFirst(pFirst), mSecond(pSecond) {}

	/** Assignment operator.
	* \param pOther The pair to be copied. */
	inline FbxPair<First, Second>& operator=(const FbxPair<First, Second>& pOther)
	{
		mFirst = pOther.mFirst;
		mSecond = pOther.mSecond;
		return *this;
	}

	/** Comparison operator.
	* \param pOther The pair to be compared. */
	inline bool operator==(const FbxPair<First, Second>& pOther)
	{
		return mFirst == pOther.mFirst && mSecond == pOther.mSecond;
	}

	/** Inverse comparison operator.
	* \param pOther The pair to be compared. */
	inline bool operator!=(const FbxPair<First, Second>& pOther)
	{
		return !operator==(pOther);
	}

	First mFirst;	//!< The first object in the pair.
	Second mSecond;	//!< The second object in the pair.
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_PAIR_H_ */
