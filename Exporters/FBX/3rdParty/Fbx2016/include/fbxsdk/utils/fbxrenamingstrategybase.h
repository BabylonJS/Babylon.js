/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxrenamingstrategybase.h
#ifndef _FBXSDK_UTILS_RENAMINGSTRATEGY_BASE_H_
#define _FBXSDK_UTILS_RENAMINGSTRATEGY_BASE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxscene.h>
#include <fbxsdk/utils/fbxnamehandler.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief Base class for renaming strategy.
* \nosubgrouping
*/
class FBXSDK_DLL FbxRenamingStrategyBase
{
public:

    //! Default constructor
    FbxRenamingStrategyBase();

    /** Constructor.
    * \param pNameSpaceSymbol
    */
    FbxRenamingStrategyBase(char pNameSpaceSymbol);

    //! Destructor.
    virtual ~FbxRenamingStrategyBase();

    /** This method put all the names in the scene back to the original values
    * \param pScene
    * \return Returns true if some names have been modified.
    */
    virtual bool DecodeScene(FbxScene* pScene)=0;

    /** This method renames all the names in the scene
    * \param pScene
    * \return Returns true if some names have been modified.
    */
    virtual bool EncodeScene(FbxScene* pScene)=0;

    /** This method find the original name of a given string
    * \param pString
    * \return Returns true if the name has been modified.
    */
    virtual bool DecodeString(FbxNameHandler& pString)=0;

    /** This method find the renaming name of a given string
    * \param pString
    * \param pIsPropertyName
    * \return Returns true if the name has been modified.
    */
    virtual bool EncodeString(FbxNameHandler& pString, bool pIsPropertyName=false)=0;

    //! clean up the name cells.
    virtual void CleanUp();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
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

    char                     mNamespaceSymbol;
    FbxCharPtrSet					mStringNameArray;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_RENAMINGSTRATEGY_BASE_H_ */
