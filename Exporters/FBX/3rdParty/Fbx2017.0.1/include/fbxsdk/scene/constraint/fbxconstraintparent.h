/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraintparent.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_PARENT_H_
#define _FBXSDK_SCENE_CONSTRAINT_PARENT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/constraint/fbxconstraint.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** The parent constraint creates a parent-to-child relationship between any two objects, from any two hierarchies.
  * It creates the same relationship as the parent-to-child relationships found in hierarchies.
  * You can use this constraint to connect objects without changing hierarchies.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxConstraintParent : public FbxConstraint
{
    FBXSDK_OBJECT_DECLARE(FbxConstraintParent, FbxConstraint);

public:
    /**
      * \name Properties
      */
    //@{
        /** This property handles whether to affect the translation of the constrained object along X axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectTranslationX;

        /** This property handles whether to affect the translation of the constrained object along Y axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectTranslationY;

        /** This property handles whether to affect the translation of the constrained object along Z axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectTranslationZ;

        /** This property handles whether to affect the rotation of the constrained object around X axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectRotationX;

        /** This property handles whether to affect the rotation of the constrained object around Y axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectRotationY;

        /** This property handles whether to affect the rotation of the constrained object around Z axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectRotationZ;

        /** This property handles whether to affect the scaling of the constrained object along X axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectScalingX;

        /** This property handles whether to affect the scaling of the constrained object along Y axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectScalingY;

        /** This property handles whether to affect the scaling of the constrained object along Z axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectScalingZ;

        /** This property used to access constraint sources.
          * A constrained object is an object whose position, orientation, and so on is driven by one or more constraint sources.
          */
        FbxPropertyT<FbxReference> ConstraintSources;

        /** This property used to access constrained object.
          * A constrained object is an object whose position, orientation, and so on is driven by one or more constraint sources.
          */
        FbxPropertyT<FbxReference> ConstrainedObject;
    //@}

    /** Set the translation offset of the specified constraint source.
      * \param pObject The specified constraint source.
      * \param pTranslation The new offset vector.
      */
    void SetTranslationOffset(FbxObject* pObject, FbxVector4 pTranslation);

    /** Retrieve the translation offset of the specified constraint source.
      * \param pObject The specified constraint source.
      * \return The current translation offset.
      */
    FbxVector4 GetTranslationOffset(const FbxObject* pObject) const;

    /** Set the rotation offset of the specified constraint source.
      * \param pObject The specified constraint source.
      * \param pRotation The new offset vector.
      */
    virtual void SetRotationOffset(const FbxObject* pObject, FbxVector4 pRotation);

    /** Retrieve the rotation offset of the specified constraint source.
      * \param pObject The specified constraint source.
      * \return The current translation offset.
      */
    FbxVector4 GetRotationOffset(const FbxObject* pObject) const;

    /** Add a constraint source to the constraint.
      * \param pObject New constraint source.
      * \param pWeight Weight of the constraint source.
      */
    void AddConstraintSource(FbxObject* pObject, double pWeight = 100);

    /** Retrieve the constraint source count.
      * \return Current constraint source count.
      */
    int GetConstraintSourceCount() const;

    /** Retrieve a constraint source object.
      * \param pIndex Index of the constraint source.
      * \return The constraint source at the specified index.
      */
    FbxObject* GetConstraintSource(int pIndex) const;

    /** Set the constrained object.
      * \param pObject The constrained object.
      */
    void SetConstrainedObject(FbxObject* pObject);

    /** Retrieve the constrained object.
      * \return Current constrained object.
      */
    FbxObject* GetConstrainedObject() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
    virtual EType GetConstraintType() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_PARENT_H_ */
