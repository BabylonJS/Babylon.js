/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxrenamingstrategy.h
#ifndef _FBXSDK_UTILS_RENAMINGSTRATEGY_H_
#define _FBXSDK_UTILS_RENAMINGSTRATEGY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxcharptrset.h>
#include <fbxsdk/utils/fbxnamehandler.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxScene;
class FbxNode;

/** This base class is an abstract implementation of a renaming strategy for avoiding name clashes.
  * An implementation of a reader (FbxReader) or writer (FbxWriter) class must call a concrete implementation
  * of "FbxRenamingStrategyInterface::Rename()" every time a name is imported or exported to avoid name clashes.
  * Any class deriving from FbxRenamingStrategyBase must implement FbxRenamingStrategyInterface::Clear(),
  * FbxRenamingStrategyInterface::Rename(), and FbxRenamingStrategyInterface::Clone().
  * \nosubgrouping
  * \see FbxNameHandler FbxRenamingStrategyNumber
  */
class FBXSDK_DLL FbxRenamingStrategyInterface
{
public:
    //! Constructor.
    FbxRenamingStrategyInterface();

    //! Destructor.
    virtual ~FbxRenamingStrategyInterface ();

    //! Resets internal state regarding assigned names.
    virtual void Clear() = 0;

    /** Rename a name if necessary to avoid name-clash issues.
      * \param pName The name to be renamed.
      * \return Return \c true on success, \c false otherwise.
      */
    virtual bool Rename(FbxNameHandler& pName) = 0;

    /** Create a dynamic renaming strategy instance of the same type as the child class.
      * \return New instance.
      */
    virtual FbxRenamingStrategyInterface* Clone() = 0;
};

/** Implements a renaming strategy that resolves name clashes by adding number postfixes.
  * For example, when there are three objects with the same names "MyObject",
  * and they will be renamed to "MyObject", "MyObject1" and "MyObject2".
  * \nosubgrouping
  * \see FbxNameHandler FbxRenamingStrategyBase
  */
class FBXSDK_DLL FbxRenamingStrategyNumber : public FbxRenamingStrategyInterface
{
public:
    //! Constructor.
    FbxRenamingStrategyNumber();

    //! Destructor.
    virtual ~FbxRenamingStrategyNumber ();

    //! Resets internal state regarding assigned names.
    virtual void Clear();

    /** Rename a name if necessary to avoid name-clash issues.
      * \param pName The name to be renamed.
      * \return Return \c true on success, \c false otherwise.
      */
    virtual bool Rename(FbxNameHandler& pName);

    /** Create a dynamic renaming strategy instance of the same type as the child class.
      * \return New instance.
      */
    virtual FbxRenamingStrategyInterface* Clone();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    struct NameCell
    {
        NameCell(const char* pName) :
            mName(pName),
            mInstanceCount(0)
        {
        }
            
        FbxString mName;
        int mInstanceCount;
    };

    FbxArray<NameCell*> mNameArray;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** The FbxRenamingStrategy object can be set to rename all the objects in a scene.
  * It can remove name clashing, remove illegal characters, manage namespaces and manage backward compatibility.
  * It is better to choose FbxSceneRenamer instead of this class to simplify the usage.
  * \nosubgrouping
  * \see FbxSceneRenamer
  */
class FBXSDK_DLL FbxRenamingStrategy : public FbxRenamingStrategyInterface
{
public:
    /** \enum EDirection The mode describing the convention direction, from FBX format or to FBX format.
      * - \e eToFBX        Convert to FBX format from another format.
      * - \e eFromFBX      Convert from FBX format to another format.
      */
    enum EDirection
    {
        eToFBX,
        eFromFBX
    };

    /** Constructor.
      * \param pMod The mode describing the convention direction, from FBX format or to FBX format.
      * \param pOnCreationRun
      */
    FbxRenamingStrategy(EDirection pMod, bool pOnCreationRun = false);

    //! Destructor.
    virtual ~FbxRenamingStrategy();
    
    /** Rename a name if necessary.
      * \param pName The name to be renamed.
      * \return Return \c true on success, \c false otherwise.
      */
    virtual bool Rename(FbxNameHandler& pName);

    //! Resets internal state regarding assigned names.
    virtual void Clear();
    
    /** Create a dynamic renaming strategy instance of the same type as the child class.
      * \return New instance.
      */
    virtual FbxRenamingStrategyInterface* Clone();

	/** \enum EClashType
      * - \e eNameClashAuto
      * - \e eNameClashType1
      * - \e eNameClashType2
      */
    enum EClashType
    {
        eNameClashAuto,
        eNameClashType1,
        eNameClashType2
    };

    /** Setup the strategy to perform this algorithm
      * \param pType 
      */
    void SetClashSoverType(EClashType pType);

    /** Returns a name with its prefix removed.
     * \param pName    A name containing a prefix.
     * \return         The part of pName following the "::"
     */
    static char* NoPrefixName (const char* pName);

    /** Returns a name with its prefix removed.
    * \param pName    A name containing a prefix.
    * \return         The part of pName following the "::"
    */
    static char* NoPrefixName (FbxString& pName);

    /** Get the namespace of the last renamed object.
     * \return     Char pointer to the namespace.
     */
    virtual char* GetNameSpace() { return mNameSpace.Buffer(); } 

    /** Sets the current scene namespace symbol.
     * \param pNameSpaceSymbol     namespace symbol.
     */
    virtual void SetInNameSpaceSymbol(FbxString pNameSpaceSymbol){mInNameSpaceSymbol = pNameSpaceSymbol;}
    
    /** Sets the wanted scene namespace symbol.
     * \param pNameSpaceSymbol     namespace symbol.
     */
    virtual void SetOutNameSpaceSymbol(FbxString pNameSpaceSymbol){mOutNameSpaceSymbol = pNameSpaceSymbol;}    

    /** Sets case sensitivity for name clashing.
     * \param pIsCaseSensitive     Set to \c true to make the name clashing case sensitive.
     */
    virtual void SetCaseSensibility(bool pIsCaseSensitive){mCaseSensitive = pIsCaseSensitive ;}

    /** Sets the flag for character acceptance during renaming.
     * \param pReplaceNonAlphaNum     Set to \c true to replace illegal characters with an underscore ("_").  
     */
    virtual void SetReplaceNonAlphaNum(bool pReplaceNonAlphaNum){mReplaceNonAlphaNum = pReplaceNonAlphaNum;}

    /** Sets the flag for first character acceptance during renaming.
     * \param pFirstNotNum     Set to \c true to add an underscore to the name if the first character is a number.
     */
    virtual void SetFirstNotNum(bool pFirstNotNum){mFirstNotNum = pFirstNotNum;}

    /** Recursively renames all the unparented namespaced objects (Prefix mode) starting from this node.
     * \param pNode       Parent node.
     * \param pIsRoot     The root node.
     * \remarks           This function adds "_NSclash" when it encounters an unparented namespaced object.
     */
    virtual bool RenameUnparentNameSpace(FbxNode* pNode, bool pIsRoot = false);

    /** Recursively removes all the unparented namespaced "key" starting from this node.
     * \param pNode     Parent node.
     * \remarks         This function removes "_NSclash" when encountered. This is the opposite from RenameUnparentNameSpace.
     */
    virtual bool RemoveImportNameSpaceClash(FbxNode* pNode);

     /** Recursively get all the namespace starting from this node's parent.
     * \param pNode                 Parent node.
     * \param pNameSpaceList        output the namespace list from pNode's parent to the root node.
     */
    virtual void GetParentsNameSpaceList(FbxNode* pNode, FbxArray<FbxString*> &pNameSpaceList);

     /** Recursively replace the namespace starting from this node to its children.
     * \param pNode        Current node.
     * \param OldNS        The old namespace to be replaced with the NewNs.
     * \param NewNS        The new namespace to replace OldNs.
     */
    virtual bool PropagateNameSpaceChange(FbxNode* pNode, FbxString OldNS, FbxString NewNS);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual bool RenameToFBX(FbxNameHandler& pName);
    virtual bool RenameFromFBX(FbxNameHandler& pName);
    virtual FbxString& ReplaceNonAlphaNum(FbxString& pName,  const char* pReplace, bool pIgnoreNameSpace);

    EDirection mMode;
    EClashType mType;

    struct NameCell
    {
        NameCell(const char* pName) :
            mName(pName),
            mInstanceCount(0)
        {
        }
            
        FbxString mName;
        int mInstanceCount;        
    };

    FbxCharPtrSet		mStringNameArray;
    FbxArray<NameCell*>	mExistingNsList;
    bool				mOnCreationRun;
    bool				mCaseSensitive;
    bool				mReplaceNonAlphaNum;
    bool				mFirstNotNum;
    FbxString			mNameSpace;
    FbxString			mInNameSpaceSymbol; //symbol identifying a name space
    FbxString			mOutNameSpaceSymbol; 
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** The FbxSceneRenamer provides a way to easily rename objects in a scene without using the FbxRenamingStrategy class.
  * FbxSceneRenamer can remove name clashing and illegal characters. It also manages namespaces.
  *
  * Example:
  * Maya only accepts names with letters, digits, or underscores, and we want to convert
  * all the names of a scene from FBX format to Maya format.
  * \code
  * FbxSceneRenamer lSceneRenamer(pScene);
  * lSceneRenamer.RenameFor(FbxSceneRenamer::eFBX_TO_MAYA);
  * \endcode
  * \nosubgrouping
  * \see FbxRenamingStrategy
  */
class FBXSDK_DLL FbxSceneRenamer
{
public:
    /** Constructor
      * \param pScene A scene which contains objects to be renamed.
      */
    FbxSceneRenamer(FbxScene* pScene) {mScene = pScene;};

    //! Destructor.
    virtual ~FbxSceneRenamer(){};

     /** \enum ERenamingMode The Mode describing from which format to which format.
       * - \e eNone
       * - \e eMAYA_TO_FBX5
       * - \e eMAYA_TO_FBX_MB75
       * - \e eMAYA_TO_FBX_MB70
       * - \e eFBXMB75_TO_FBXMB70
       * - \e eFBX_TO_FBX
       * - \e eMAYA_TO_FBX
       * - \e eFBX_TO_MAYA
       * - \e eLW_TO_FBX
       * - \e eFBX_TO_LW
       * - \e eXSI_TO_FBX
       * - \e eFBX_TO_XSI
       * - \e eMAX_TO_FBX
       * - \e eFBX_TO_MAX
       * - \e eMB_TO_FBX
       * - \e eFBX_TO_MB
       * - \e eDAE_TO_FBX
       * - \e eFBX_TO_DAE
       */
    enum ERenamingMode
    { 
        eNone,
        eMAYA_TO_FBX5,
        eMAYA_TO_FBX_MB75,
        eMAYA_TO_FBX_MB70,
        eFBXMB75_TO_FBXMB70,
        eFBX_TO_FBX,
        eMAYA_TO_FBX,
        eFBX_TO_MAYA,
        eLW_TO_FBX,
        eFBX_TO_LW,
        eXSI_TO_FBX,
        eFBX_TO_XSI,
        eMAX_TO_FBX,
        eFBX_TO_MAX,
        eMB_TO_FBX,
        eFBX_TO_MB,
        eDAE_TO_FBX,
        eFBX_TO_DAE
    };

    /** Rename the objects of the scene according the specific mode.
      * \param pMode A mode describing from which format to which format.
      */
    void RenameFor(ERenamingMode pMode);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    void ResolveNameClashing(    bool pFromFbx, bool pIgnoreNS, bool pIsCaseSensitive,
                                bool pReplaceNonAlphaNum, bool pFirstNotNum,
                                FbxString pInNameSpaceSymbol, FbxString pOutNameSpaceSymbol,
                                bool pNoUnparentNS/*for MB < 7.5*/, bool pRemoveNameSpaceClash);

    FbxRenamingStrategyInterface* mNodeRenamingStrategy;
    FbxScene* mScene;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_RENAMINGSTRATEGY_H_ */

