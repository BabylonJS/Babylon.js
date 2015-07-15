/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxprocessorxref.h
#ifndef _FBXSDK_UTILS_PROCESSOR_XREF_H_
#define _FBXSDK_UTILS_PROCESSOR_XREF_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxmap.h>
#include <fbxsdk/utils/fbxprocessor.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains objects
  * This class also provides access to global settings and take information.
  */
class FBXSDK_DLL FbxProcessorXRefCopy : public FbxProcessor
{
    FBXSDK_OBJECT_DECLARE(FbxProcessorXRefCopy, FbxProcessor);

public:
    class FBXSDK_DLL MissingUrlHandler
    {
    public:
        virtual ~MissingUrlHandler();
        virtual void MissingUrl(const FbxString& pUrl, const FbxProperty&) = 0;
    };

    /**
    * \name Properties
    */
    //@{
        FbxPropertyT<FbxString>    OutputDirectory;

        /** As we resolve xref and copy assets, do we update properties to
          * now use this relative path?  Defaults to TRUE.
          */
        FbxPropertyT<FbxBool>     UpdateProperties;

        /** Default to FALSE -- when set, this informs the processor to track
          * every properties that were modified during the scene processing.
          */
        FbxPropertyT<FbxBool>     TrackUpdatedProperties;

        /** Default to TRUE -- when not set, files are only copied if one of
          * the following conditions is met:
          * 
          * 1) Target does not exist
          * 2) Target has a different time
          * 3) Target has a different size
          */
        FbxPropertyT<FbxBool>     ForceCopy;

        /** Default to TRUE -- when copying a file, also copy its modification
          * time.  A bit of a requirement if you're not going to use ForceCopy.
          */
        FbxPropertyT<FbxBool>     CopyFileTimes;
    //@}

        /** Optional callback; when set, this will be called when an Url cannot be
          * be copied because the source is not found.
          * Memory is owned by the client code, and will not be freed by us.
          */
        MissingUrlHandler*          MissingUrlHandler;

    /** Since FbxProperty is an opaque type, we can't do an efficient operator <
      * on it, and must keep the data on the object, which can be compared through
      * pointers, and then we can further compare against the property name.
      */
    struct PropertyUpdate
    {
        FbxProperty mProperty;
        FbxString    mOriginalValue;

        inline PropertyUpdate() {}
        inline PropertyUpdate(const FbxProperty& pProp, const FbxString& pVal) :
            mProperty(pProp), mOriginalValue(pVal) {}

        inline bool operator <(const PropertyUpdate& pOther) const
        {
            return strcmp(mProperty.GetName(), pOther.mProperty.GetName()) < 0;
        }
    };
    typedef FbxSet<PropertyUpdate>           UpdateSet;
    typedef FbxMap<FbxObject*, UpdateSet>    PropertyUpdateMap;

    /** All properties that were updated, with their original value.
      * Will always be empty if TrackUpdatedProperties
      * was not set before calling ProcessCollection/ProcessObject.
      * NOT cleared before each processing run.
      */
    PropertyUpdateMap& GetUpdatedProperties();

    /** If property tracking was enabled, goes through and reverts all changes
      * to the properties.  Does not un-copy the files, naturally.
      */
    void RevertPropertyChanges();

    /** This is just a safety net to make sure RevertPropertyChanges is called when
      * this goes out of scope.
      */
    struct FBXSDK_DLL AutoRevertPropertyChanges
    {
        AutoRevertPropertyChanges(FbxProcessorXRefCopy* pCopy) : mXRefCopy(pCopy) {}
        ~AutoRevertPropertyChanges()
        {
            if( mXRefCopy )
                mXRefCopy->RevertPropertyChanges();
        }

        FbxProcessorXRefCopy* mXRefCopy;
    };

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);

	PropertyUpdateMap mUpdatedProperties;

	// Implements the rules specified for the ForceCopy property.
	// Also checks the ForceCopy property.
	bool ShouldCopyFile(const FbxString& pTarget, const FbxString& pSource) const;

	virtual bool	internal_ProcessCollectionBegin (FbxCollection*     pObject);
	virtual bool	internal_ProcessCollectionEnd   (FbxCollection*     pObject);
	virtual bool	internal_ProcessObject          (FbxObject*     pObject);
	bool			ProcessPathProperty(FbxProperty &pProperty);
	virtual bool	ValidPropertyForXRefCopy(FbxObject* pObject, FbxProperty& lProperty) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_PROCESSOR_XREF_H_ */
