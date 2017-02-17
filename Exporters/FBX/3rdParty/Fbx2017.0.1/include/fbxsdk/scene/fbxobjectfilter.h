/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxobjectfilter.h
#ifndef _FBXSDK_SCENE_OBJECT_FILTER_H_
#define _FBXSDK_SCENE_OBJECT_FILTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This object represents a filter criteria on an object.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxObjectFilter
{
public:
    //! Destructor.
    virtual ~FbxObjectFilter() {}

	/** Tells if this filter match the given object
	  * \param pObjectPtr The given object.
	  */
	virtual bool Match(const FbxObject * pObjectPtr) const = 0;

	/** Tells if this filter does NOT match the given object
	  * \param pObjectPtr The given object.
	  */
	virtual bool NotMatch(const FbxObject * pObjectPtr) const { return !Match(pObjectPtr); };
};

/**\brief This class represents a name filter on an object.
  *\nosubgrouping
  */
class FBXSDK_DLL FbxNameFilter : public FbxObjectFilter
{
public:
	/**
	  * \name Constructor and Destructor
	  */
	//@{
	/** Constructor
	  * \param pTargetName The target name.
	  */
    inline FbxNameFilter( const char* pTargetName ) : mTargetName( pTargetName ) {};

    //! Destructor.
    virtual ~FbxNameFilter() {}
	//@}

	/** Tells if this filter match the given object
	  * \param pObjectPtr The given object.
	  */
    virtual bool Match(const FbxObject * pObjectPtr) const { return pObjectPtr ? mTargetName == pObjectPtr->GetName() : false; }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    FbxString mTargetName;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_OBJECT_FILTER_H_ */
