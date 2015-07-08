/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxrenamingstrategyfbx6.h
#ifndef _FBXSDK_UTILS_RENAMINGSTRATEGY_FBX6_H_
#define _FBXSDK_UTILS_RENAMINGSTRATEGY_FBX6_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/utils/fbxrenamingstrategybase.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This class contains the description of the FBX renaming strategy for fbx file format 6.
* \nosubgrouping
*/
class FBXSDK_DLL FbxRenamingStrategyFbx6: public FbxRenamingStrategyBase
{
public:

    //! Default constructor
    FbxRenamingStrategyFbx6();

    //! Destructor
    virtual ~FbxRenamingStrategyFbx6();

    /** This method put all the names in the scene back to the original values
    * \param pScene
    * \return Returns true if some names have been modified.
    */
    virtual bool DecodeScene(FbxScene* pScene);

    /** This method renames all the names in the scene
    * \param pScene
    * \return Returns true if some names have been modified.
    */
    virtual bool EncodeScene(FbxScene* pScene);

    /** This method find the original name of a given string
    * \param pName
    * \return Returns true if the name has been modified.
    */
    virtual bool DecodeString(FbxNameHandler& pName);

    /** This method find the renaming name of a given string
    * \param pName
    * \param pIsPropertyName
    * \return Returns true if the name has been modified.
    */
    virtual bool EncodeString(FbxNameHandler& pName, bool pIsPropertyName=false);

    //! clean up the name cells.
    virtual void CleanUp();
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_RENAMINGSTRATEGY_FBX6_H_ */
