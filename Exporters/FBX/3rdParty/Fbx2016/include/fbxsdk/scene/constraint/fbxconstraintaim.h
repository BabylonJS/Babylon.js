/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraintaim.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_AIM_H_
#define _FBXSDK_SCENE_CONSTRAINT_AIM_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/constraint/fbxconstraint.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** An aim constraint governs an object's orientation so that the object points to other objects.
  * For example, you can use the aim constraint to point a light at an object or group of objects.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxConstraintAim : public FbxConstraint
{
    FBXSDK_OBJECT_DECLARE(FbxConstraintAim, FbxConstraint);

public:
    /** \enum EWorldUp Constraint world up type, which has the same meaning with Maya.
      */
    enum EWorldUp
    {
        eAimAtSceneUp,			//! Constraint scene up type.
        eAimAtObjectUp,			//! Constraint object up type.
        eAimAtObjectRotationUp,	//! Constraint object rotation up type.
        eAimAtVector,			//! Constraint vector type.
        eAimAtNone,				//! None constraint type.
        eAimAtCount				//! Constraint world up type count.
    };

	/**
      * \name Properties
      */
    //@{
        /** This property handles the rotation offset value.
          *
          * Default value is (0, 0, 0).
          */
        FbxPropertyT<FbxDouble3> RotationOffset;

        /** This property provides access to the object or objects which are the targets.
          */
        FbxPropertyT<FbxReference> AimAtObjects;

        /** This property provides access to the object being aimed.
          */
        FbxPropertyT<FbxReference> ConstrainedObject;

        /** This property handles world up type.
          */
        FbxPropertyT<FbxEnum> WorldUpType;

        /** This property handles world up object.
          */
        FbxPropertyT<FbxReference> WorldUpObject;

        /** This property handles world up vector.
          *
          * Default value is (0, 1, 0).
          */
        FbxPropertyT<FbxDouble3> WorldUpVector;

        /** This property handles up vector.
          *
          * Default value is (0, 1, 0).
          */
        FbxPropertyT<FbxDouble3> UpVector;

        /** This property enables you set a specific axis for the constrained object to orient towards.
          *
          * Default value is (1, 0, 0).
          */
        FbxPropertyT<FbxDouble3> AimVector;
        
        /** This property handles whether to affect the rotation around X axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectX;

        /** This property handles whether to affect the rotation around  Y axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectY;

        /** This property handles whether to affect the rotation around  Z axis.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> AffectZ;
    //@}
    
    /** Add a source to the constraint.
      * \param pObject New source object.
      * \param pWeight Weight of the source object.
      */
    void AddConstraintSource(FbxObject* pObject, double pWeight = 100);

    /** Retrieve the constraint source count.
      * \return Current constraint source count.
      */
    int GetConstraintSourceCount() const;

    /** Retrieve a constraint source object.
      * \param pIndex The specified index.
      * \return Current source at the specified index.
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

    /** Set the world up object.
      * \param pObject The new world up object.
      */
    void SetWorldUpObject(FbxObject* pObject);

    /** Retrieve the world up object.
      * \return The current world up object.
      */
    FbxObject* GetWorldUpObject() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);

    virtual EType GetConstraintType() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxConstraintAim::EWorldUp&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_AIM_H_ */
