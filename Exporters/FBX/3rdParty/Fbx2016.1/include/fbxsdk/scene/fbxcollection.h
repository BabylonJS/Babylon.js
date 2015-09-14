/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcollection.h
#ifndef _FBXSDK_SCENE_COLLECTION_H_
#define _FBXSDK_SCENE_COLLECTION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCriteria;

/** A FbxObject derived container for FbxObject.
  * \nosubgrouping
  *
  */
class FBXSDK_DLL FbxCollection : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxCollection, FbxObject);

public:
	/**
	  * \name Collection member management
	  */
	//@{
        //! Deletes all objects in the container.
        virtual void Clear();

        /** Adds a member.
		  * \param pMember Object to be added.
		  */
        virtual bool AddMember(FbxObject* pMember) { return ConnectSrcObject(pMember); }

        /** Removes a member.
		  * \param pMember Object to be removed.
		  */
        virtual bool RemoveMember(FbxObject* pMember) { return DisconnectSrcObject(pMember); }

        /** Returns the number of objects contained within the collection.
		  * \return The number of objects the collection contains.
		  */
        inline int GetMemberCount () const { return GetSrcObjectCount(); }

        /** Returns the member of the collection at the given index.
		  * \param pIndex The given index.
		  * \return The member of the collection at the given index.
		  */
        inline FbxObject* GetMember(int pIndex=0) const { return GetSrcObject(pIndex); }

        /** Judges whether an object is a part of the collection.
		  * \param pMember The member to be judged.
		  * \return \c True if it is a member of the collection, returns \c false if it is not a member.
          */
        virtual bool IsMember(const FbxObject* pMember) const;
	//@}

	/**
	  * \name Templated member management
	  */
	//@{
		/** Returns the number of class T objects contained within the collection.
		* \return The number of objects of class T the collection contains. */
		template <class T> inline int GetMemberCount() const { return GetSrcObjectCount<T>(); }

		/** Returns the member of class T at the given index in the collection.
		* \param pIndex The given index.
		* \return The member of class T at the given index. */
		template <class T> inline T* GetMember(int pIndex=0) const { return GetSrcObject<T>(pIndex); }

		/** Searches for a member of class T.
		* \param pName Member name. */
		template <class T> inline T* FindMember(const char* pName) const { return FindSrcObject<T>(pName); }
	//@}

	/**
	  * \name Criteria based member management
	  */
	//@{
        /** Returns the number of objects contained within the collection that meet the specified criteria.
		  * \param pCriteria Defines a set of criteria that each object must meet in order to be included in the results.
		  * \return The number of objects the collection contains that meet the specified criteria.
		  */
        inline int GetMemberCount(const FbxCriteria& pCriteria) const { return GetSrcObjectCount(pCriteria); }

        /** Returns the member at the given index in the collection if it meets the specified criteria.
		  * \param pCriteria Defines a set of criteria that the returned object must meet.
		  * \param pIndex The given index.
		  * \return The member at the given index if it meets the criteria; NULL otherwise.
		  */
        inline FbxObject* GetMember(const FbxCriteria& pCriteria, int pIndex=0) const { return GetSrcObject(pCriteria, pIndex); }

        /** Searches for a member with the given name that also meets the given criteria.
		  * \param pCriteria Defines a set of criteria that the returned object must meet.
		  * \param pName Member name.
		  * \return The member with the given name if it meets the criteria; NULL if no match could be found.
		  */
		inline FbxObject* FindMember(const FbxCriteria& pCriteria, const char* pName) const { return FindSrcObject(pCriteria, pName); }
	//@}

	/**
	  * \name Selection management
	  */
	//@{
        /** Selects/Deselects all the contained objects.
		  * \param pSelection If \c true, all objects are selected, if \c false, all objects are deselected.
		  */
        virtual void SetSelectedAll(bool pSelection);
	//@}
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_COLLECTION_H_ */
