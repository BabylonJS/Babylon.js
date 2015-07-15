/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxexternaldocreflistener.h
#ifndef _FBXSDK_FILEIO_EXTERNAL_DOCREF_LISTENER_H_
#define _FBXSDK_FILEIO_EXTERNAL_DOCREF_LISTENER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxlistener.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Contains data about an external document.
  * The document is a FbxDocument object.
  */
struct FBXSDK_DLL FbxExternalDocumentInfo
{
    FbxString mDocumentName;      //!< Bare name of external document in document hierarchy.
    FbxString mClassName;         //!< Class name of the document (FbxDocument, FbxLibrary...).
    FbxString mParentFullName;    //!< Full name of the parent document in document hierarchy.
    FbxString mFilePathUrl;       //!< File path of the external document.
};

/** Event that is emitted on loading document when a referenced document
  * is encountered while loading external references.
  */
class FBXSDK_DLL FbxEventReferencedDocument : public FbxEvent<FbxEventReferencedDocument>, public FbxExternalDocumentInfo
{
    FBXSDK_EVENT_DECLARE(FbxEventReferencedDocument);
public:
    FbxEventReferencedDocument() {}
};


class FbxExternalDocRefListenerData;

/** Typical handler for the referenced document events.
* 
* Register it like so:
* FbxExternalDocRefListener lRefDocListener( sdkManager, fileName );
* FbxEventHandler * lHandler = lRefDocListener.Bind(scene,
*                                                &FbxExternalDocRefListener::HandleEvent);  
* 
* And later unregister it like so:
*     lRefDocListener.Unbind(lHandler);
*/
class FBXSDK_DLL FbxExternalDocRefListener : public FbxListener
{
public:
    /** Constructor. 
      * \param pManager
      * \param pDocFilePath
      * \remarks Keep a reference to the SDK and the path of the document
      * to be able to resolve relative paths. 
      */
    FbxExternalDocRefListener( FbxManager & pManager, const FbxString & pDocFilePath );
    virtual ~FbxExternalDocRefListener();

    /** Set the document file path used to resolve documents. 
      * \param pDocFilePath
      * \remarks Allows re-using the same instance for multiple document loadings.
      */
    virtual void SetDocumentFilePath( const FbxString & pDocFilePath );

    /** Verify that all documents that were previously loaded in a previous
      * load session are still valid.
      * \return \c true if all documents are still valid, \c false otherwise.
      */
    virtual bool AreAllExternalDocumentsStillValid() const;

    // 
    /** Verify that all documents that were referred to didn't change. 
      * \return \c true if all documents didn't change, \c false otherwise.
      * \remarks This function should be called if at posteriori check is desired.
      */
    virtual bool WereAllExternalDocumentsValid() const;

    /** Unload all documents that were loaded through this event handler. 
      */
    virtual void UnloadExternalDocuments();

    // External document reference event handler.
    //
    // Operation: calls FindDocument() to find the specified external document
    //            and if not found calls LoadDocument() either directly,
    //            if it has not parent, or via ConnectToParentLibrary().
    //            If its parent cannot be found, it's added to the dangling
    //            document list (and it is not loaded until it's parent is found).
    //            After, it tries to resolve dangling documents by calling
    //            TryConnectingDanglingLibraries().
    /** External document reference event handler. 
      * \param pEvent
      * \remarks    Operation: calls FindDocument() to find the specified external document
      *             and if not found calls LoadDocument() either directly,
      *             if it has not parent, or via ConnectToParentLibrary().
      *             If its parent cannot be found, it's added to the dangling
      *             document list (and it is not loaded until it's parent is found).
      *             After, it tries to resolve dangling documents by calling
      *             TryConnectingDanglingLibraries().
      */
    virtual void HandleEvent(const FbxEventReferencedDocument * pEvent);

protected:
    /**
     * Turn a relative path to an absolute path using the file path of the original document being loaded.
     * If the path is already is absolute, it is returned as is.
     */
    virtual FbxString MakeFilenameAbsolute(const FbxString & pFilename) const;
    //! Locate a document by its document path.
    virtual FbxDocument * FindDocument( const FbxString & pPathToDoc );
    //! Load a library, potentially under another library.
    virtual FbxDocument * LoadDocument(FbxObject * pParent, const FbxString & pClassName, const FbxString & pFilename);
    //! Try to connect a library to its parent given its document path.
    virtual bool ConnectToParentLibrary(const FbxExternalDocumentInfo &);
    //! Try to reconnect dangling libraries that didn't find their parent.
    virtual void TryConnectingDanglingLibraries();

private:
    FbxExternalDocRefListenerData * mData;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_EXTERNAL_DOCREF_LISTENER_H_ */
