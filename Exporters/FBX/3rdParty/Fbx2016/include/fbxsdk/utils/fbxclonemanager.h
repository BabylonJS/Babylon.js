/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxclonemanager.h
#ifndef _FBXSDK_UTILS_CLONE_MANAGER_H_
#define _FBXSDK_UTILS_CLONE_MANAGER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/fbxquery.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** The clone manager is a utility for cloning entire networks of FbxObject.
  * Options are available for specifying how the clones inherit the connections
  * of the original.
  *
  * Networks of FbxObject (inter-connected objects by OO, OP, PO or PP connections)
  * can be cloned. How the connections of clones are handled depends on mSrcPolicy and mExternalDstPolicy.
  *
  * To clone FbxObject instances and their dependents, put them into a CloneSet
  * and pass the CloneSet to this class:
  * \code
  * FbxCloneManager                  cloneManager;
  * FbxCloneManager::CloneSet        cloneSet;
  * FbxCloneManager::CloneSetElement defaultCloneOptions(FbxCloneManager::sConnectToClone,
  *                                                      FbxCloneManager::sConnectToOriginal, 
  *                                                      FbxObject::eDeepClone);
  * cloneSet.Insert(someObject, defaultCloneOptions);
  * cloneManager.AddDependents(cloneSet, someObject, defaultCloneOptions);
  * cloneManager.Clone(cloneSet, scene)
  * \endcode
  *
  * \remark If cloning occurs on the same scene as the original objects, the system will contain duplicated names. Although this is acceptable in FBX,
  *         some applications may not behave correctly with duplicated names. It is the responsability of the caller to resolve any conflicts.
  *
  * \see FbxCloneManager::CloneSetElement
  * \see FbxCloneManager::CloneSet
  * \nosubgrouping
  */
class FBXSDK_DLL FbxCloneManager
{
public:

    //! Maximum depth to clone dependents.
    static const int sMaximumCloneDepth;

    /** Connect to objects that are connected to original object.
      * This is a flag to mSrcPolicy or mExternalDstPolicy.
      */
    static const int sConnectToOriginal;

    /** Connect to clones of objects that are connected to original object.
      * (only if those original objects are also in the clone set)
      * This is a flag to mSrcPolicy.
      */
    static const int sConnectToClone;

    /** This represents an element in FbxCloneManager::CloneSet to be cloned.
      * This class contains the option for specifying how connections are cloned and the
      * cloned object.
      * \see FbxCloneManager
      * \see FbxCloneManager::CloneSet
      */
    struct FBXSDK_DLL CloneSetElement
    {
    public:
        /** Constructor.
          * \param pSrcPolicy Specify how to handle source connections. Valid values are 0, sConnectToOriginal,
          *                   sConnectToClone or sConnectToOriginal|sConnectToClone.
          * \param pExternalDstPolicy Specify how to handle destination connections to objects NOT in
          *                           the clone set. Valid values are 0 or sConnectToOriginal.
          * \param pCloneType Specify the type of cloning. FbxObject::Clone uses the same parameter.
          */
        CloneSetElement( int pSrcPolicy = 0,
                         int pExternalDstPolicy = 0,
                         FbxObject::ECloneType pCloneType = FbxObject::eReferenceClone );

        //! the type of cloning to perform
        FbxObject::ECloneType mType;

        /** Policy on how to handle source connections on the original object. Valid values are 0
          * or any bitwise OR'd combination of sConnectToOriginal, and sConnectToClone.
          */
        int mSrcPolicy;

        /** policy on how to handle destination connections on the original object to
          * objects NOT in the clone set. (Destination connections to objects in the set
          * are handled by that object's source policy) Valid values are 0 or sConnectToOriginal.
          */
        int mExternalDstPolicy;

        /** This is a pointer to the newly created clone.
          * It is set after the call to FbxCloneManager::Clone()
          */
        FbxObject* mObjectClone;

		/** Internal use.
		  */
		bool mLayerElementProcessed;
		bool mConnectionsProcessed;
    };

    /** The CloneSet is a collection of pointers to objects that will be cloned in Clone()
      * Attached to each object is a CloneSetElement. Its member variables dictate how
      * the corresponding object will be cloned, and how it will inherit connections
      * on the original object.
      */
    typedef FbxMap<FbxObject*,CloneSetElement> CloneSet;

    /** Constructor
      */
    FbxCloneManager();

    /** Destructor
      */
    virtual ~FbxCloneManager();

    /** This function simplifies the process of cloning one object and all its depedency graph by automatically preparing
      * the CloneSet and calling the Clone method using the code below.
      *
      * \code
      * FbxCloneManager                  cloneManager;
      * FbxCloneManager::CloneSet        cloneSet;
      * FbxCloneManager::CloneSetElement defaultCloneOptions(FbxCloneManager::sConnectToClone,
      *                                                      FbxCloneManager::sConnectToOriginal, 
      *                                                      FbxObject::eDeepClone);
      * FbxObject* lReturnObj = (FbxObject*)pObject;
      *
      * cloneManager.AddDependents(cloneSet, pObject, defaultCloneOptions, FbxCriteria::ObjectType(FbxObject::ClassId));    
      * cloneSet.Insert((FbxObject*)pObject, defaultCloneOptions); 
      *
      * // collect all the FbxCharacters, if any (these are indirect dependencies not visible by the AddDependents recursion)
      * FbxArray<FbxObject*> lExtras;
      * FbxCloneManager::CloneSet::RecordType* lIterator = cloneSet.Minimum();
      * while( lIterator )
      * {
      *     FbxObject* lObj = lIterator->GetKey();
      *     cloneManager.LookForIndirectDependent(lObj, cloneSet, lExtras);
      *     lIterator = lIterator->Successor();
      * }
      *
      * // and add them to cloneSet
      * for (int i = 0, c = lExtras.GetCount(); i < c; i++)
      * {
      *     FbxObject* lObj = lExtras[i];
      *     cloneManager.AddDependents(cloneSet, lObj, defaultCloneOptions);
      *     cloneSet.Insert(lObj, defaultCloneOptions); 
      * }
      *
      * // clone everything
      * if (cloneManager.Clone(cloneSet, pContainer))
      * {
      *     // get the clone of pObject
      *     CloneSet::RecordType* lIterator = cloneSet.Find((FbxObject* const)pObject);
      *     if( lIterator )
      *     {
      *         lReturnObj = lIterator->GetValue().mObjectClone;
      *     }    
      * }
      * return lReturnObj;
      * \endcode
      *
      * \param pObject Object to clone.
      * \param pContainer This object (typically a scene or document) will contain the new clones.
      * \return The clone of \e pObject if all its depedency graph have been cloned successfully, NULL otherwise.
      * \remark It is advised not to use an FbxNode object for \e pContainer to group the cloned dependency graph. 
      *         Some objects of the FBX SDK are not meant to be connected to FbxNode objects and if they are, the final scene 
      *         will not comply to the FBX standard and its behavior cannot be guaranteed.
      * \remark If \e pContainer is left \c NULL the cloned objects only exists in the FbxSdkManager and need to be 
      *         manually connected to the scene in order to be saved to disk.
      *
      * Example:
      * \code
      *     FbxObject* lObj2BCloned = ...
      *     FbxNode* myNewParent = FbxNode::Create(lNewScene, "Clone");
      *     lNewScene->GetRootNode()->AddChild(lN);
      *
      *     FbxCloneManager cloneManager;
      *     FbxNode *lClone = (FbxNode*)cloneManager.Clone(lObj2BCloned);
      *
      *     // make sure the cloned object is connected to the scene
      *     lClone->ConnectDstObject(lNewScene);
      * \endcode
      */
    static FbxObject* Clone(const FbxObject* pObject, FbxObject* pContainer = NULL);

    /** Clone all objects in the set using the given policies for duplication
      * of connections. Each CloneSetElement in the set will have its mObjectClone
      * pointer set to the newly created clone. The following code shows how to access the cloned objects:
      *
      * \code
      *     if (cloneManager.Clone(cloneSet, pContainer))
      *     {
      *         // access the clones
      *         FbxCloneManager::CloneSet::RecordType* lIterator = cloneSet.Minimum();
      *         while( lIterator )
      *         {
      *             FbxObject* lOriginalObject = lIterator->GetKey();
      *             FbxObject* lClonedObject   = lIterator->GetValue().mObjectClone;
      *             lIterator = lIterator->Successor();
      *         }
      *     }
      * \endcode
      *
      * \param pSet Set of objects to clone
      * \param pContainer This object (typically a scene or document) will contain the new clones
      * \return true if all objects were cloned, false otherwise.
      * \remark It is advised not to use an FbxNode object for \e pContainer to group the cloned dependency graph. 
      *         Some objects of the FBX SDK are not meant to be connected to FbxNode objects and if they are, the final scene 
      *         will not comply to the FBX standard and its behavior cannot be guaranteed.
      * \remark If \e pContainer is left \c NULL the cloned objects only exists in the FbxSdkManager and need to be 
      *         manually connected to the scene in order to be saved to disk.
      */
    virtual bool Clone( CloneSet& pSet, FbxObject* pContainer = NULL ) const;

    /** Add all dependents of the given object to the CloneSet.
      * Dependents of items already in the set are ignored to prevent
      * infinite recursion on cyclic dependencies.
      * \param pSet The set to add items.
      * \param pObject Object to add dependents to
	  * \param pCloneOptions  
      * \param pTypes Types of dependent objects to consider
      * \param pDepth Maximum recursive depth. Valid range is [0,sMaximumCloneDepth]
      *
      * The following example shows how to perform multiple calls to AddDependents() to collect several
      * subgraphs to be cloned:
      * \code
      *         FbxObject* lRoot = ...           // initialized with the root of the graph to be cloned
      *         FbxCharacter* lCharacter = ...   // points to the FbxCharacter driving the character defined by "lRoot" graph
      *
      *         FbxCloneManager                  cloneManager;
      *         FbxCloneManager::CloneSet        cloneSet;
      *
      *         cloneManager.AddDependents(cloneSet, lRoot);
      *         cloneSet.Insert(lRoot, defaultCloneOptions); 
      *
      *         cloneManager.AddDependents(cloneSet, lCharacter);
      *         cloneSet.Insert(lCharacter, defaultCloneOptions); 
      *
      * \endcode
      */
    virtual void AddDependents( CloneSet& pSet,
                        const FbxObject* pObject,
                        const CloneSetElement& pCloneOptions = CloneSetElement(),
                        FbxCriteria pTypes = FbxCriteria::ObjectType(FbxObject::ClassId),
                        int pDepth = sMaximumCloneDepth ) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    static FbxObject* Clone(const FbxObject* pObject, CloneSet* pSet, FbxObject* pContainer = NULL);

private:
    friend class FbxScene;

	bool ReAssignLayerElements( FbxCloneManager::CloneSet::RecordType* pIterator, const FbxCloneManager::CloneSet& pSet) const;
	bool CloneConnections( CloneSet::RecordType* pIterator, const CloneSet& pSet) const;
    bool CheckIfCloneOnSameScene(const FbxObject* pObject, FbxObject* pContainer) const;

    virtual void LookForIndirectDependent(const FbxObject* pObject, CloneSet& pSet, FbxArray<FbxObject*>& lIndirectDepend);
    virtual bool NeedToBeExcluded(FbxObject* lObj) const;

    bool      mCloneOnSameScene;

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#define CloneSetCast(x)         ((FbxCloneManager::CloneSet*)(x))
#define CloneSetElementCast(x)  ((FbxCloneManager::CloneSetElement*)((x!=NULL)?&(x->GetValue()):NULL))

#endif /* _FBXSDK_UTILS_CLONE_MANAGER_H_ */
