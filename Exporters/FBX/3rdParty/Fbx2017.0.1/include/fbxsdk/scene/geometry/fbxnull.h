/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnull.h
#ifndef _FBXSDK_SCENE_GEOMETRY_NULL_H_
#define _FBXSDK_SCENE_GEOMETRY_NULL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This node attribute contains the properties of a null node.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxNull : public FbxNodeAttribute
{
    FBXSDK_OBJECT_DECLARE(FbxNull, FbxNodeAttribute);

public:
    //! Returns the EType::eNull node attribute type.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Resets the default values.
    void Reset();

    /**
      * \name Null Node Properties
      */
    //@{

    /** \enum ELook         Null node look types.
      * - \e eNone
      * - \e eCross
      */
    enum ELook
	{
        eNone,
        eCross,
    };

    /** Returns the default size value.
      * \return             The default size of this object (100).
      */
    double GetSizeDefaultValue() const;

    //@}

    /**
      * \name Property Names
      */
    //@{
    static const char*          sSize;
    static const char*          sLook;
    //@}

    /**
      * \name Property Default Values
      */
    //@{
    static const FbxDouble     sDefaultSize;
    static const ELook      sDefaultLook;
    //@}


    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////

    /** This property handles the null node size.
      *
      * To access this property do: Size.Get().
      * To set this property do: Size.Set(FbxDouble).
      *
      * The default value is 100.
      */
    FbxPropertyT<FbxDouble>       Size;

    /** This property handles the look of the null node.
      *
      * To access this property do: Look.Get().
      * To set this property do: Look.Set(ELook).
      *
      * The default value is true
      */
    FbxPropertyT<ELook>            Look;


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
    virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);

public:
    virtual FbxStringList GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxNull::ELook&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_NULL_H_ */
