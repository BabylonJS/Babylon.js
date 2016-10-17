/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbindingtableentry.h
#ifndef _FBXSDK_SCENE_SHADING_BINDING_TABLE_ENTRY_H_
#define _FBXSDK_SCENE_SHADING_BINDING_TABLE_ENTRY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A binding table entry stores a binding between a source and a 
  * destination. Users should not instantiate this class directly,
  * but always call FbxBindingTableBase::AddNewEntry() to create 
  * a new entry in the binding table.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxBindingTableEntry 
{
public:
    /** 
      *\name Constructor and Destructor
      */
    //@{
        //!Constructor.
        FbxBindingTableEntry();

        /**Copy constructor.
          * \param pEntry FbxBindingTableEntry to be copied. 
          * \remark the UserDataPtr is a shared pointer.
          */
        FbxBindingTableEntry(const FbxBindingTableEntry& pEntry);

        //!Destructor.
        ~FbxBindingTableEntry();
    //@}

    /**
      * \name Access
      */
    //@{
        /** Set the source. 
          * \param pSource             The source to set.
          */
        void SetSource( const char* pSource );

        //!Retrieve the source.
        const char* GetSource() const;

        /** Set the destination. 
          * \param pDestination             The destination to set.
          */
        void SetDestination( const char* pDestination );

        //!Retrieve the destination.
        const char* GetDestination() const;
    
        /** Set the source type or destination type. 
          * \param pType             The source type or destination type to set.
          * \param pAsSource         Flag indicates source type or destination type to set.
          */
        void SetEntryType( const char* pType, bool pAsSource );
       
        /** Get the source type or destination type. 
          * \param pAsSource         Flag indicates source type or destination type to get.
          * \return                  Source type or destination type.
          */
        const char* GetEntryType( bool pAsSource ) const;

        /** Retrieve user data pointer.
          * \return User data pointer.
          */
        void* GetUserDataPtr();

        /** Retrieve user data pointer.
          * \return User data pointer.
          */
        const void* GetUserDataPtr() const;

        /** Set user data pointer.
          * \param pData user data pointer. 
          */
        void SetUserDataPtr(void* pData );
    //@}
   
    /** Assignment operator.
      * \param pEntry FbxBindingTableEntry assigned to this one.
      * \remark the UserDataPtr is a shared pointer.
      */
		FbxBindingTableEntry& operator=(const FbxBindingTableEntry& pEntry);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    FbxString	mSource;
    FbxString	mDestination;
    FbxString	mSourceType;
    FbxString	mDestinationType;
    void*		mData;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_BINDING_TABLE_ENTRY_H_ */
