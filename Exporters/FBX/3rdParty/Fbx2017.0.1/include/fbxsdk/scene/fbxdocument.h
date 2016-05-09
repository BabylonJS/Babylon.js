/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdocument.h
#ifndef _FBXSDK_SCENE_DOCUMENT_H_
#define _FBXSDK_SCENE_DOCUMENT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxcollection.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxTakeInfo;
class FbxPeripheral;
class FbxDocumentInfo;

/** FbxDocument is a base class for FbxScene and FbxLibrary classes.
  * A document is a collection (FbxCollection) of objects (FbxObject), called the root member objects. 
  * This is because these objects each form the root of an object graph. The manager (FbxManager) has access to all
  * documents, scenes and libraries.
  *
  * A document can be contained in another document, thus, a hierarchy of documents
  * can be built. The root of all documents is simply called the root document.
  *
  * A document manages animation stacks (FbxAnimStack). It also provides access to animation stack information (FbxTakeInfo).
  *
  * A document carries information in its FbxDocumentInfo.
  * 
  * Documents manage peripherals to load and unload objects (see class FbxPeripheral),
  * as well as references to other objects or documents.
  *
  * Error management is also available.
  * 
  * \nosubgrouping
  */
class FBXSDK_DLL FbxDocument : public FbxCollection
{
    FBXSDK_OBJECT_DECLARE(FbxDocument, FbxCollection);

public:
    /**
      * \name Properties
      */
    //@{
		FbxPropertyT<FbxReference> Roots;
    //@}

    /**
    * \name Document Member Manager
    */
    //@{
        //! Remove document members and restore default settings.
        virtual void  Clear();

        /** Add a member object and connect it to Roots.
		  * \param pMember Object to add to the document.
		  */
        inline void AddRootMember(FbxObject* pMember){ AddMember(pMember); Roots.ConnectSrcObject(pMember); }

        /** Remove a member object from the document.
		  * \param pMember Object to remove from the document.
		  */
        inline void RootRootRemoveMember(FbxObject* pMember){ RemoveMember(pMember); Roots.DisconnectSrcObject(pMember); }

		/** Find a member object in the document, that has the given type and name.
		* \param pName Member name. */
		template <class T> inline T* FindRootMember(char* pName){ return Roots.FindSrcObject<T>(pName); }

        //! Return the number of objects in the document.
        inline int GetRootMemberCount () const { return Roots.GetSrcObjectCount(); }

		/** Return the number of objects of class T in the document.
		* \return The number of objects of class T in the document. */
		template <class T> inline int GetRootMemberCount() const { return Roots.GetSrcObjectCount<T>(); }

		/** Return the number of objects of the document that satisfy the given criteria.
		  * \param pCriteria Criteria for selecting objects.
		  * \return The number of objects satisfying the given criteria.
		  */
        int GetRootMemberCount(FbxCriteria pCriteria) const;

        /** Return the member of the document at given index.
		  * \param pIndex Selection index.
		  */
        inline FbxObject* GetRootMember(int pIndex=0) const { return Roots.GetSrcObject(pIndex); }

		/** Return the member of class T of the document at given index.
		* \param pIndex Selection index. */
		template <class T> inline T* GetRootMember(int pIndex=0) const  { return Roots.GetSrcObject<T>(pIndex); }

		/** Return the document member which satisfies given criteria, for given index.
          * \param pCriteria Criteria for selecting objects.
		  * \param pIndex Selection index.
		  */
        FbxObject* GetRootMember(FbxCriteria pCriteria, int pIndex=0) const;

		/** Is an object part of the document.
		  * \param pMember Queried object.
		  * \return \c true if pMember is an object part of the document, \c false otherwise.
		  */
        virtual bool IsRootMember(FbxObject* pMember) const;
    //@}


    /**
      * \name Document information
      */
    //@{
        /** Get the document information.
          * \return Pointer to the document information object.
          */
        FbxDocumentInfo* GetDocumentInfo() const;

        /** Set the document information.
          * \param pSceneInfo Pointer to the document information object.
          */
        void SetDocumentInfo(FbxDocumentInfo* pSceneInfo);
    //@}

    /**
      * \name Offloading management
      *
	  * Documents manage peripherals to load and unload objects (see 
	  * class FbxPeripheral). A peripheral manipulates the content 
	  * of an object. For instance, a peripheral can load the connections 
	  * of an object on demand.
	  *
      * The document does not own the peripheral therefore
      * it will not attempt to delete it at destruction time. Cloning
      * the document will share the pointer to the peripheral across
      * the cloned objects. The assignment operator has a similar behavior.
      */
    //@{
        /** Set the current peripheral to be used to load or unload objects from this document.
		  * \param pPeripheral The peripheral to be set.
          */
        void SetPeripheral(FbxPeripheral* pPeripheral);

        /** Retrieve the current peripheral of the document.
        * \return Current peripheral.
        */
        virtual FbxPeripheral* GetPeripheral();

        /** Unload all the unloadable objects contained in the document using the currently set peripheral. 
          * \param pStatus The FbxStatus object to hold error codes.
          * \return The number of objects that the document has been able to unload.
          */
        int UnloadContent(FbxStatus* pStatus = NULL);

        /** Load all the objects contained in the document with the data from the currently set peripheral.
          * \param pStatus The FbxStatus object to hold error codes.
          * \return The number of loaded objects.
          */
        int LoadContent(FbxStatus* pStatus = NULL);

    //@}

    /**
      * \name Referencing management
      */
    //@{

        /**
          * Fills an array of pointers to documents that reference objects in this document.
          *
          * \param pReferencingDocuments Array of pointers to documents.
          * \returns Number of documents that reference objects in this document.
          */
        int GetReferencingDocuments(FbxArray<FbxDocument*>& pReferencingDocuments) const;

        /**
          * Fills an array of pointers to objects in a given document (pFromDoc)
          * that reference objects in this document.
          *
          * \param pFromDoc Pointer to the document containing referencing objects.
          * \param pReferencingObjects Array of pointers to referencing objects.
          * \returns Number of objects that reference objects in this document.
          */
        int GetReferencingObjects(const FbxDocument* pFromDoc, FbxArray<FbxObject*>& pReferencingObjects) const;

        /**
          * Fills an array of pointers to documents that are referenced by objects in this document.
          *
          * \param pReferencedDocuments Array of pointers to documents.
          * \returns Number of documents that are referenced by objects in this document.
          */
        int GetReferencedDocuments(FbxArray<FbxDocument*>& pReferencedDocuments) const;

        /**
          * Fills an array of pointers to objects in a given document (pToDoc)
          * that are referenced by objects in this document.
          *
          * \param pToDoc Pointer to the document containing referenced objects.
          * \param pReferencedObjects Array of pointers to referenced objects.
          * \returns Number of objects that are referenced by objects in this document.
          */
        int GetReferencedObjects(const FbxDocument* pToDoc, FbxArray<FbxObject*>& pReferencedObjects) const;

        /**
          * Gets the path string to the root document, if the current document is contained in another document.
		  \returns Path to the root document.
          */
        FbxString GetPathToRootDocument(void) const;
        /**
          * Gets the document path to the root document as an array of documents, if the current document is contained in another document.
		  * \param pDocumentPath Array of FbxDocument to store the document path.
		  * \param pFirstCall Recursive flag: always use pFirstCall = \c true.
          */
        void GetDocumentPathToRootDocument(FbxArray<FbxDocument*>& pDocumentPath, bool pFirstCall = true) const;

        /**
          * Tells if this document is a root document.
		  \return \c false if the current document is contained in another document, \c true otherwise.
          */
        bool IsARootDocument(void) { return (NULL == GetDocument()); }
    //@}

    /**
      * \name Animation Stack Management
	  * \remarks Animation stacks replaces the deprecated takes.
      */
    //@{
        /** Holds the name of the FbxAnimStack that the application uses for animation in this document.
          */
        FbxPropertyT<FbxString> ActiveAnimStackName;

        /** Adds a new animation stack object to this document.
          * In case of error, FbxDocument::GetLastErrorID() will return
          * \c eTakeError.
          * \param pName Animation stack name.
          * \param pStatus The FbxStatus object to hold error codes.
          * \return \c true if a new FbxAnimStack has been successfully created,
          * \c false if an error occurred or if the specified name defines
          * a FbxAnimStack that already exists in the document.
          */
        bool CreateAnimStack(const char* pName, FbxStatus* pStatus = NULL);

        /** Destroy the animation stack object identified by pName from this document.
          * \param pName Name of the animation stack to be deleted.
          * \return \c true if the FbxAnimStack has been destroyed and \c false otherwise.
          */
        bool RemoveAnimStack(const char* pName);

        /** Fill a string array with all existing animation stack names.
		  * The array of string is cleared before it is used
          * \param pNameArray An array of string objects.
          */
        void FillAnimStackNameArray(FbxArray<FbxString*>& pNameArray);

    //@}

    /**
      * \name Animation Stack Information Management
	  * \remark Although takes are deprecated, class FbxTakeInfo is not deprecated and
	  * now contains animation stack information.
      */
    //@{
        /** Set information about an animation stack.
          * \param pTakeInfo Animation stack information. Field FbxTakeInfo::mName specifies
          * the targeted animation stack.
          * \return \c true if animation stack is found with this name, and if information is set.
          */
        bool SetTakeInfo(const FbxTakeInfo& pTakeInfo);

        /** Get information about an animation stack.
          * \param pTakeName Name of the targeted animation stack.
          * \return Animation stack information, or \c NULL if animation stack isn't found or
          * has no information set for this document.
          */
        FbxTakeInfo* GetTakeInfo(const FbxString& pTakeName) const;

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);
	virtual void Compact();
	void ConnectVideos();

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

	virtual bool ConnectNotify(const FbxConnectEvent& pEvent);
	virtual void SetDocument(FbxDocument* pDocument);

	bool		 FindTakeName(const FbxString& pTakeName);

	FbxArray<FbxTakeInfo*>	mTakeInfoArray;

private:
	FbxPeripheral*		mPeripheral;
	FbxDocumentInfo*	mDocumentInfo;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_DOCUMENT_H_ */
