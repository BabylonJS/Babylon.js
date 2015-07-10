//-------------------------------------------------------------------------------------
// BC.cpp
//  
// Block-compression (BC) functionality for BC1, BC2, BC3 (orginal DXTn formats)
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//  
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

// Experiemental encoding variants, not enabled by default
//#define COLOR_WEIGHTS
//#define COLOR_AVG_0WEIGHTS

#include "BC.h"

using namespace DirectX::PackedVector;

namespace DirectX
{

//-------------------------------------------------------------------------------------
// Constants
//-------------------------------------------------------------------------------------

// Perceptual weightings for the importance of each channel.
static const HDRColorA g_Luminance   (0.2125f / 0.7154f, 1.0f, 0.0721f / 0.7154f, 1.0f);
static const HDRColorA g_LuminanceInv(0.7154f / 0.2125f, 1.0f, 0.7154f / 0.0721f, 1.0f);

//-------------------------------------------------------------------------------------
// Decode/Encode RGB 5/6/5 colors
//-------------------------------------------------------------------------------------
inline static void Decode565(_Out_ HDRColorA *pColor, _In_ const uint16_t w565)
{
    pColor->r = (float) ((w565 >> 11) & 31) * (1.0f / 31.0f);
    pColor->g = (float) ((w565 >>  5) & 63) * (1.0f / 63.0f);
    pColor->b = (float) ((w565 >>  0) & 31) * (1.0f / 31.0f);
    pColor->a = 1.0f;
}

inline static uint16_t Encode565(_In_ const HDRColorA *pColor)
{
    HDRColorA Color;

    Color.r = (pColor->r < 0.0f) ? 0.0f : (pColor->r > 1.0f) ? 1.0f : pColor->r;
    Color.g = (pColor->g < 0.0f) ? 0.0f : (pColor->g > 1.0f) ? 1.0f : pColor->g;
    Color.b = (pColor->b < 0.0f) ? 0.0f : (pColor->b > 1.0f) ? 1.0f : pColor->b;

    uint16_t w;

    w = (uint16_t) ((static_cast<int32_t>(Color.r * 31.0f + 0.5f) << 11) |
                    (static_cast<int32_t>(Color.g * 63.0f + 0.5f) <<  5) |
                    (static_cast<int32_t>(Color.b * 31.0f + 0.5f) <<  0));

    return w;
}


//-------------------------------------------------------------------------------------
static void OptimizeRGB(_Out_ HDRColorA *pX, _Out_ HDRColorA *pY,
                        _In_reads_(NUM_PIXELS_PER_BLOCK) const HDRColorA *pPoints, _In_ size_t cSteps, _In_ DWORD flags)
{
    static const float fEpsilon = (0.25f / 64.0f) * (0.25f / 64.0f);
    static const float pC3[] = { 2.0f/2.0f, 1.0f/2.0f, 0.0f/2.0f };
    static const float pD3[] = { 0.0f/2.0f, 1.0f/2.0f, 2.0f/2.0f };
    static const float pC4[] = { 3.0f/3.0f, 2.0f/3.0f, 1.0f/3.0f, 0.0f/3.0f };
    static const float pD4[] = { 0.0f/3.0f, 1.0f/3.0f, 2.0f/3.0f, 3.0f/3.0f };

    const float *pC = (3 == cSteps) ? pC3 : pC4;
    const float *pD = (3 == cSteps) ? pD3 : pD4;

    // Find Min and Max points, as starting point
    HDRColorA X = (flags & BC_FLAGS_UNIFORM) ? HDRColorA(1.f, 1.f, 1.f, 1.f) : g_Luminance;
    HDRColorA Y = HDRColorA(0.0f, 0.0f, 0.0f, 1.0f);

    for(size_t iPoint = 0; iPoint < NUM_PIXELS_PER_BLOCK; iPoint++)
    {
#ifdef COLOR_WEIGHTS
        if(pPoints[iPoint].a > 0.0f)
#endif // COLOR_WEIGHTS
        {
            if(pPoints[iPoint].r < X.r)
                X.r = pPoints[iPoint].r;

            if(pPoints[iPoint].g < X.g)
                X.g = pPoints[iPoint].g;

            if(pPoints[iPoint].b < X.b)
                X.b = pPoints[iPoint].b;

            if(pPoints[iPoint].r > Y.r)
                Y.r = pPoints[iPoint].r;

            if(pPoints[iPoint].g > Y.g)
                Y.g = pPoints[iPoint].g;

            if(pPoints[iPoint].b > Y.b)
                Y.b = pPoints[iPoint].b;
        }
    }

    // Diagonal axis
    HDRColorA AB;

    AB.r = Y.r - X.r;
    AB.g = Y.g - X.g;
    AB.b = Y.b - X.b;

    float fAB = AB.r * AB.r + AB.g * AB.g + AB.b * AB.b;

    // Single color block.. no need to root-find
    if(fAB < FLT_MIN)
    {
        pX->r = X.r; pX->g = X.g; pX->b = X.b;
        pY->r = Y.r; pY->g = Y.g; pY->b = Y.b;
        return;
    }

    // Try all four axis directions, to determine which diagonal best fits data
    float fABInv = 1.0f / fAB;

    HDRColorA Dir;
    Dir.r = AB.r * fABInv;
    Dir.g = AB.g * fABInv;
    Dir.b = AB.b * fABInv;

    HDRColorA Mid;
    Mid.r = (X.r + Y.r) * 0.5f;
    Mid.g = (X.g + Y.g) * 0.5f;
    Mid.b = (X.b + Y.b) * 0.5f;

    float fDir[4];
    fDir[0] = fDir[1] = fDir[2] = fDir[3] = 0.0f;


    for(size_t iPoint = 0; iPoint < NUM_PIXELS_PER_BLOCK; iPoint++)
    {
        HDRColorA Pt;
        Pt.r = (pPoints[iPoint].r - Mid.r) * Dir.r;
        Pt.g = (pPoints[iPoint].g - Mid.g) * Dir.g;
        Pt.b = (pPoints[iPoint].b - Mid.b) * Dir.b;

        float f;

#ifdef COLOR_WEIGHTS
        f = Pt.r + Pt.g + Pt.b;
        fDir[0] += pPoints[iPoint].a * f * f;

        f = Pt.r + Pt.g - Pt.b;
        fDir[1] += pPoints[iPoint].a * f * f;

        f = Pt.r - Pt.g + Pt.b;
        fDir[2] += pPoints[iPoint].a * f * f;

        f = Pt.r - Pt.g - Pt.b;
        fDir[3] += pPoints[iPoint].a * f * f;
#else
        f = Pt.r + Pt.g + Pt.b;
        fDir[0] += f * f;

        f = Pt.r + Pt.g - Pt.b;
        fDir[1] += f * f;

        f = Pt.r - Pt.g + Pt.b;
        fDir[2] += f * f;

        f = Pt.r - Pt.g - Pt.b;
        fDir[3] += f * f;
#endif // COLOR_WEIGHTS
    }

    float fDirMax = fDir[0];
    size_t  iDirMax = 0;

    for(size_t iDir = 1; iDir < 4; iDir++)
    {
        if(fDir[iDir] > fDirMax)
        {
            fDirMax = fDir[iDir];
            iDirMax = iDir;
        }
    }

    if(iDirMax & 2)
    {
        float f = X.g; X.g = Y.g; Y.g = f;
    }

    if(iDirMax & 1)
    {
        float f = X.b; X.b = Y.b; Y.b = f;
    }


    // Two color block.. no need to root-find
    if(fAB < 1.0f / 4096.0f)
    {
        pX->r = X.r; pX->g = X.g; pX->b = X.b;
        pY->r = Y.r; pY->g = Y.g; pY->b = Y.b;
        return;
    }


    // Use Newton's Method to find local minima of sum-of-squares error.
    float fSteps = (float) (cSteps - 1);

    for(size_t iIteration = 0; iIteration < 8; iIteration++)
    {
        // Calculate new steps
        HDRColorA pSteps[4];

        for(size_t iStep = 0; iStep < cSteps; iStep++)
        {
            pSteps[iStep].r = X.r * pC[iStep] + Y.r * pD[iStep];
            pSteps[iStep].g = X.g * pC[iStep] + Y.g * pD[iStep];
            pSteps[iStep].b = X.b * pC[iStep] + Y.b * pD[iStep];
        }


        // Calculate color direction
        Dir.r = Y.r - X.r;
        Dir.g = Y.g - X.g;
        Dir.b = Y.b - X.b;

        float fLen = (Dir.r * Dir.r + Dir.g * Dir.g + Dir.b * Dir.b);

        if(fLen < (1.0f / 4096.0f))
            break;

        float fScale = fSteps / fLen;

        Dir.r *= fScale;
        Dir.g *= fScale;
        Dir.b *= fScale;


        // Evaluate function, and derivatives
        float d2X, d2Y;
        HDRColorA dX, dY;
        d2X = d2Y = dX.r = dX.g = dX.b = dY.r = dY.g = dY.b = 0.0f;

        for(size_t iPoint = 0; iPoint < NUM_PIXELS_PER_BLOCK; iPoint++)
        {
            float fDot = (pPoints[iPoint].r - X.r) * Dir.r + 
                         (pPoints[iPoint].g - X.g) * Dir.g + 
                         (pPoints[iPoint].b - X.b) * Dir.b;


            size_t iStep;
            if(fDot <= 0.0f)
                iStep = 0;
            else if(fDot >= fSteps)
                iStep = cSteps - 1;
            else
                iStep = static_cast<size_t>(fDot + 0.5f);


            HDRColorA Diff;
            Diff.r = pSteps[iStep].r - pPoints[iPoint].r;
            Diff.g = pSteps[iStep].g - pPoints[iPoint].g;
            Diff.b = pSteps[iStep].b - pPoints[iPoint].b;

#ifdef COLOR_WEIGHTS
            float fC = pC[iStep] * pPoints[iPoint].a * (1.0f / 8.0f);
            float fD = pD[iStep] * pPoints[iPoint].a * (1.0f / 8.0f);
#else
            float fC = pC[iStep] * (1.0f / 8.0f);
            float fD = pD[iStep] * (1.0f / 8.0f);
#endif // COLOR_WEIGHTS

            d2X  += fC * pC[iStep];
            dX.r += fC * Diff.r;
            dX.g += fC * Diff.g;
            dX.b += fC * Diff.b;

            d2Y  += fD * pD[iStep];
            dY.r += fD * Diff.r;
            dY.g += fD * Diff.g;
            dY.b += fD * Diff.b;
        }


        // Move endpoints
        if(d2X > 0.0f)
        {
            float f = -1.0f / d2X;

            X.r += dX.r * f;
            X.g += dX.g * f;
            X.b += dX.b * f;
        }

        if(d2Y > 0.0f)
        {
            float f = -1.0f / d2Y;

            Y.r += dY.r * f;
            Y.g += dY.g * f;
            Y.b += dY.b * f;
        }

        if((dX.r * dX.r < fEpsilon) && (dX.g * dX.g < fEpsilon) && (dX.b * dX.b < fEpsilon) &&
           (dY.r * dY.r < fEpsilon) && (dY.g * dY.g < fEpsilon) && (dY.b * dY.b < fEpsilon))
        {
            break;
        }
    }

    pX->r = X.r; pX->g = X.g; pX->b = X.b;
    pY->r = Y.r; pY->g = Y.g; pY->b = Y.b;
}


//-------------------------------------------------------------------------------------
inline static void DecodeBC1( _Out_writes_(NUM_PIXELS_PER_BLOCK) XMVECTOR *pColor, _In_ const D3DX_BC1 *pBC, _In_ bool isbc1 )
{
    assert( pColor && pBC );
    static_assert( sizeof(D3DX_BC1) == 8, "D3DX_BC1 should be 8 bytes" );

    static XMVECTORF32 s_Scale = { 1.f/31.f, 1.f/63.f, 1.f/31.f, 1.f };

    XMVECTOR clr0 = XMLoadU565( reinterpret_cast<const XMU565*>(&pBC->rgb[0]) );
    XMVECTOR clr1 = XMLoadU565( reinterpret_cast<const XMU565*>(&pBC->rgb[1]) );

    clr0 = XMVectorMultiply( clr0, s_Scale );
    clr1 = XMVectorMultiply( clr1, s_Scale );

    clr0 = XMVectorSwizzle<2, 1, 0, 3>( clr0 );
    clr1 = XMVectorSwizzle<2, 1, 0, 3>( clr1 );

    clr0 = XMVectorSelect( g_XMIdentityR3, clr0, g_XMSelect1110 );
    clr1 = XMVectorSelect( g_XMIdentityR3, clr1, g_XMSelect1110 );

    XMVECTOR clr2, clr3;
    if ( isbc1 && (pBC->rgb[0] <= pBC->rgb[1]) )
    {
        clr2 = XMVectorLerp( clr0, clr1, 0.5f );
        clr3 = XMVectorZero();  // Alpha of 0
    }
    else
    {
        clr2 = XMVectorLerp( clr0, clr1, 1.f/3.f );
        clr3 = XMVectorLerp( clr0, clr1, 2.f/3.f );
    }

    uint32_t dw = pBC->bitmap;

    for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i, dw >>= 2)
    {
        switch(dw & 3)
        {
        case 0: pColor[i] = clr0; break;
        case 1: pColor[i] = clr1; break;
        case 2: pColor[i] = clr2; break;

        case 3:
        default: pColor[i] = clr3; break;
        }
    }
}


//-------------------------------------------------------------------------------------

static void EncodeBC1(_Out_ D3DX_BC1 *pBC, _In_reads_(NUM_PIXELS_PER_BLOCK) const HDRColorA *pColor,
                      _In_ bool bColorKey, _In_ float alphaRef, _In_ DWORD flags)
{
    assert( pBC && pColor );
    static_assert( sizeof(D3DX_BC1) == 8, "D3DX_BC1 should be 8 bytes" );

    // Determine if we need to colorkey this block
    size_t uSteps;
    
    if (bColorKey)
    {
        size_t uColorKey = 0;

        for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
        {
            if(pColor[i].a < alphaRef)
                uColorKey++;
        }

        if(NUM_PIXELS_PER_BLOCK == uColorKey)
        {
            pBC->rgb[0] = 0x0000;
            pBC->rgb[1] = 0xffff;
            pBC->bitmap = 0xffffffff;
            return;
        }

        uSteps = (uColorKey > 0) ? 3 : 4;
    }
    else
    {
        uSteps = 4;
    }

    // Quantize block to R56B5, using Floyd Stienberg error diffusion.  This 
    // increases the chance that colors will map directly to the quantized 
    // axis endpoints.
    HDRColorA Color[NUM_PIXELS_PER_BLOCK];
    HDRColorA Error[NUM_PIXELS_PER_BLOCK];

    if (flags & BC_FLAGS_DITHER_RGB)
        memset(Error, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(HDRColorA));

    size_t i;
    for(i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        HDRColorA Clr;
        Clr.r = pColor[i].r;
        Clr.g = pColor[i].g;
        Clr.b = pColor[i].b;

        if (flags & BC_FLAGS_DITHER_RGB)
        {
            Clr.r += Error[i].r;
            Clr.g += Error[i].g;    
            Clr.b += Error[i].b;
        }

        Color[i].r = (float) static_cast<int32_t>(Clr.r * 31.0f + 0.5f) * (1.0f / 31.0f);
        Color[i].g = (float) static_cast<int32_t>(Clr.g * 63.0f + 0.5f) * (1.0f / 63.0f);
        Color[i].b = (float) static_cast<int32_t>(Clr.b * 31.0f + 0.5f) * (1.0f / 31.0f);

#ifdef COLOR_WEIGHTS
        Color[i].a = pColor[i].a;
#else
        Color[i].a = 1.0f;
#endif // COLOR_WEIGHTS

        if (flags & BC_FLAGS_DITHER_RGB)
        {
            HDRColorA Diff;
            Diff.r = Color[i].a * (Clr.r - Color[i].r);
            Diff.g = Color[i].a * (Clr.g - Color[i].g);
            Diff.b = Color[i].a * (Clr.b - Color[i].b);

            if(3 != (i & 3))
            {
                assert( i < 15 );
                _Analysis_assume_( i < 15 );
                Error[i + 1].r += Diff.r * (7.0f / 16.0f);
                Error[i + 1].g += Diff.g * (7.0f / 16.0f);
                Error[i + 1].b += Diff.b * (7.0f / 16.0f);
            }

            if(i < 12)
            {
                if(i & 3)
                {
                    Error[i + 3].r += Diff.r * (3.0f / 16.0f);
                    Error[i + 3].g += Diff.g * (3.0f / 16.0f);
                    Error[i + 3].b += Diff.b * (3.0f / 16.0f);
                }

                Error[i + 4].r += Diff.r * (5.0f / 16.0f);
                Error[i + 4].g += Diff.g * (5.0f / 16.0f);
                Error[i + 4].b += Diff.b * (5.0f / 16.0f);

                if(3 != (i & 3))
                {
                    assert( i < 11 );
                    _Analysis_assume_( i < 11 );
                    Error[i + 5].r += Diff.r * (1.0f / 16.0f);
                    Error[i + 5].g += Diff.g * (1.0f / 16.0f);
                    Error[i + 5].b += Diff.b * (1.0f / 16.0f);
                }
            }
        }

        if ( !( flags & BC_FLAGS_UNIFORM ) )
        {
            Color[i].r *= g_Luminance.r;
            Color[i].g *= g_Luminance.g;
            Color[i].b *= g_Luminance.b;
        }
    }

    // Perform 6D root finding function to find two endpoints of color axis.
    // Then quantize and sort the endpoints depending on mode.
    HDRColorA ColorA, ColorB, ColorC, ColorD;

    OptimizeRGB(&ColorA, &ColorB, Color, uSteps, flags);

    if ( flags & BC_FLAGS_UNIFORM )
    {
        ColorC = ColorA;
        ColorD = ColorB;
    }
    else
    {
        ColorC.r = ColorA.r * g_LuminanceInv.r;
        ColorC.g = ColorA.g * g_LuminanceInv.g;
        ColorC.b = ColorA.b * g_LuminanceInv.b;

        ColorD.r = ColorB.r * g_LuminanceInv.r;
        ColorD.g = ColorB.g * g_LuminanceInv.g;
        ColorD.b = ColorB.b * g_LuminanceInv.b;
    }

    uint16_t wColorA = Encode565(&ColorC);
    uint16_t wColorB = Encode565(&ColorD);

    if((uSteps == 4) && (wColorA == wColorB))
    {
        pBC->rgb[0] = wColorA;
        pBC->rgb[1] = wColorB;
        pBC->bitmap = 0x00000000;
        return;
    }

    Decode565(&ColorC, wColorA);
    Decode565(&ColorD, wColorB);

    if ( flags & BC_FLAGS_UNIFORM )
    {
        ColorA = ColorC;
        ColorB = ColorD;
    }
    else
    {
        ColorA.r = ColorC.r * g_Luminance.r;
        ColorA.g = ColorC.g * g_Luminance.g;
        ColorA.b = ColorC.b * g_Luminance.b;

        ColorB.r = ColorD.r * g_Luminance.r;
        ColorB.g = ColorD.g * g_Luminance.g;
        ColorB.b = ColorD.b * g_Luminance.b;
    }

    // Calculate color steps
    HDRColorA Step[4];

    if((3 == uSteps) == (wColorA <= wColorB))
    {
        pBC->rgb[0] = wColorA;
        pBC->rgb[1] = wColorB;

        Step[0] = ColorA;
        Step[1] = ColorB;
    }
    else
    {
        pBC->rgb[0] = wColorB;
        pBC->rgb[1] = wColorA;

        Step[0] = ColorB;
        Step[1] = ColorA;
    }

    static const size_t pSteps3[] = { 0, 2, 1 };
    static const size_t pSteps4[] = { 0, 2, 3, 1 };
    const size_t *pSteps;

    if(3 == uSteps)
    {
        pSteps = pSteps3;

        HDRColorALerp(&Step[2], &Step[0], &Step[1], 0.5f);
    }
    else
    {
        pSteps = pSteps4;

        HDRColorALerp(&Step[2], &Step[0], &Step[1], 1.0f / 3.0f);
        HDRColorALerp(&Step[3], &Step[0], &Step[1], 2.0f / 3.0f);
    }

    // Calculate color direction
    HDRColorA Dir;

    Dir.r = Step[1].r - Step[0].r;
    Dir.g = Step[1].g - Step[0].g;
    Dir.b = Step[1].b - Step[0].b;

    float fSteps = (float) (uSteps - 1);
    float fScale = (wColorA != wColorB) ? (fSteps / (Dir.r * Dir.r + Dir.g * Dir.g + Dir.b * Dir.b)) : 0.0f;

    Dir.r *= fScale;
    Dir.g *= fScale;
    Dir.b *= fScale;

    // Encode colors
    uint32_t dw = 0;
    if (flags & BC_FLAGS_DITHER_RGB)
        memset(Error, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(HDRColorA));

    for(i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        if((3 == uSteps) && (pColor[i].a < alphaRef))
        {
            dw = (3 << 30) | (dw >> 2);
        }
        else
        {
            HDRColorA Clr;
            if ( flags & BC_FLAGS_UNIFORM )
            {
                Clr.r = pColor[i].r;
                Clr.g = pColor[i].g;
                Clr.b = pColor[i].b;
            }
            else
            {
                Clr.r = pColor[i].r * g_Luminance.r;
                Clr.g = pColor[i].g * g_Luminance.g;
                Clr.b = pColor[i].b * g_Luminance.b;
            }

            if (flags & BC_FLAGS_DITHER_RGB)
            {
                Clr.r += Error[i].r;
                Clr.g += Error[i].g;
                Clr.b += Error[i].b;
            }

            float fDot = (Clr.r - Step[0].r) * Dir.r + (Clr.g - Step[0].g) * Dir.g + (Clr.b - Step[0].b) * Dir.b;
            uint32_t iStep;

            if(fDot <= 0.0f)
                iStep = 0;
            else if(fDot >= fSteps)
                iStep = 1;
            else
                iStep = static_cast<uint32_t>( pSteps[static_cast<size_t>(fDot + 0.5f)] );

            dw = (iStep << 30) | (dw >> 2);

            if (flags & BC_FLAGS_DITHER_RGB)
            {
                HDRColorA Diff;
                Diff.r = Color[i].a * (Clr.r - Step[iStep].r);
                Diff.g = Color[i].a * (Clr.g - Step[iStep].g);
                Diff.b = Color[i].a * (Clr.b - Step[iStep].b);

                if(3 != (i & 3))
                {
                    Error[i + 1].r += Diff.r * (7.0f / 16.0f);
                    Error[i + 1].g += Diff.g * (7.0f / 16.0f);
                    Error[i + 1].b += Diff.b * (7.0f / 16.0f);
                }

                if(i < 12)
                {
                    if(i & 3)
                    {
                        Error[i + 3].r += Diff.r * (3.0f / 16.0f);
                        Error[i + 3].g += Diff.g * (3.0f / 16.0f);
                        Error[i + 3].b += Diff.b * (3.0f / 16.0f);
                    }

                    Error[i + 4].r += Diff.r * (5.0f / 16.0f);
                    Error[i + 4].g += Diff.g * (5.0f / 16.0f);
                    Error[i + 4].b += Diff.b * (5.0f / 16.0f);

                    if(3 != (i & 3))
                    {
                        Error[i + 5].r += Diff.r * (1.0f / 16.0f);
                        Error[i + 5].g += Diff.g * (1.0f / 16.0f);
                        Error[i + 5].b += Diff.b * (1.0f / 16.0f);
                    }
                }
            }
        }
    }

    pBC->bitmap = dw;
}

//-------------------------------------------------------------------------------------
#ifdef COLOR_WEIGHTS
static void EncodeSolidBC1(_Out_ D3DX_BC1 *pBC, _In_reads_(NUM_PIXELS_PER_BLOCK) const HDRColorA *pColor)
{
#ifdef COLOR_AVG_0WEIGHTS
    // Compute avg color
    HDRColorA Color;
    Color.r = pColor[0].r;
    Color.g = pColor[0].g;
    Color.b = pColor[0].b;

    for(size_t i = 1; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        Color.r += pColor[i].r;
        Color.g += pColor[i].g;
        Color.b += pColor[i].b;
    }

    Color.r *= 1.0f / 16.0f;
    Color.g *= 1.0f / 16.0f;
    Color.b *= 1.0f / 16.0f;

    uint16_t wColor = Encode565(&Color);
#else
    uint16_t wColor = 0x0000;
#endif // COLOR_AVG_0WEIGHTS

    // Encode solid block
    pBC->rgb[0] = wColor;
    pBC->rgb[1] = wColor;
    pBC->bitmap = 0x00000000;
}
#endif // COLOR_WEIGHTS


//=====================================================================================
// Entry points
//=====================================================================================

//-------------------------------------------------------------------------------------
// BC1 Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void D3DXDecodeBC1(XMVECTOR *pColor, const uint8_t *pBC)
{
    auto pBC1 = reinterpret_cast<const D3DX_BC1 *>(pBC);
    DecodeBC1( pColor, pBC1, true );
}

_Use_decl_annotations_
void D3DXEncodeBC1(uint8_t *pBC, const XMVECTOR *pColor, float alphaRef, DWORD flags)
{
    assert( pBC && pColor );

    HDRColorA Color[NUM_PIXELS_PER_BLOCK];

    if (flags & BC_FLAGS_DITHER_A)
    {
        float fError[NUM_PIXELS_PER_BLOCK];
        memset(fError, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(float));

        for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
        {
            HDRColorA clr;
            XMStoreFloat4( reinterpret_cast<XMFLOAT4*>( &clr ), pColor[i] );

            float fAlph = clr.a + fError[i];

            Color[i].r = clr.r;
            Color[i].g = clr.g;
            Color[i].b = clr.b;
            Color[i].a = (float) static_cast<int32_t>(clr.a + fError[i] + 0.5f);

            float fDiff = fAlph - Color[i].a;

            if(3 != (i & 3))
            {
                assert( i < 15 );
                _Analysis_assume_( i < 15 );
                fError[i + 1] += fDiff * (7.0f / 16.0f);
            }

            if(i < 12)
            {
                if(i & 3)
                    fError[i + 3] += fDiff * (3.0f / 16.0f);

                fError[i + 4] += fDiff * (5.0f / 16.0f);

                if(3 != (i & 3))
                {
                    assert( i < 11 );
                    _Analysis_assume_( i < 11 );
                    fError[i + 5] += fDiff * (1.0f / 16.0f);
                }
            }
        }
    }
    else
    {
        for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
        {
            XMStoreFloat4( reinterpret_cast<XMFLOAT4*>( &Color[i] ), pColor[i] );
        }
    }

    auto pBC1 = reinterpret_cast<D3DX_BC1 *>(pBC);
    EncodeBC1(pBC1, Color, true, alphaRef, flags);
}


//-------------------------------------------------------------------------------------
// BC2 Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void D3DXDecodeBC2(XMVECTOR *pColor, const uint8_t *pBC)
{
    assert( pColor && pBC );
    static_assert( sizeof(D3DX_BC2) == 16, "D3DX_BC2 should be 16 bytes" );

    auto pBC2 = reinterpret_cast<const D3DX_BC2 *>(pBC);

    // RGB part
    DecodeBC1(pColor, &pBC2->bc1, false);

    // 4-bit alpha part
    DWORD dw = pBC2->bitmap[0];

    for(size_t i = 0; i < 8; ++i, dw >>= 4)
    {
        #pragma prefast(suppress:22103, "writing blocks in two halves confuses tool")
        pColor[i] = XMVectorSetW( pColor[i], (float) (dw & 0xf) * (1.0f / 15.0f) );
    }

    dw = pBC2->bitmap[1];

    for(size_t i = 8; i < NUM_PIXELS_PER_BLOCK; ++i, dw >>= 4)
        pColor[i] = XMVectorSetW( pColor[i], (float) (dw & 0xf) * (1.0f / 15.0f) );
}

_Use_decl_annotations_
void D3DXEncodeBC2(uint8_t *pBC, const XMVECTOR *pColor, DWORD flags)
{
    assert( pBC && pColor );
    static_assert( sizeof(D3DX_BC2) == 16, "D3DX_BC2 should be 16 bytes" );

    HDRColorA Color[NUM_PIXELS_PER_BLOCK];
    for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        XMStoreFloat4( reinterpret_cast<XMFLOAT4*>( &Color[i] ), pColor[i] );
    }

    auto pBC2 = reinterpret_cast<D3DX_BC2 *>(pBC);

    // 4-bit alpha part.  Dithered using Floyd Stienberg error diffusion.
    pBC2->bitmap[0] = 0;
    pBC2->bitmap[1] = 0;

    float fError[NUM_PIXELS_PER_BLOCK];
    if (flags & BC_FLAGS_DITHER_A)
        memset(fError, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(float));

    for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        float fAlph = Color[i].a;
        if (flags & BC_FLAGS_DITHER_A)
            fAlph += fError[i];

        uint32_t u = (uint32_t) static_cast<int32_t>(fAlph * 15.0f + 0.5f);

        pBC2->bitmap[i >> 3] >>= 4;
        pBC2->bitmap[i >> 3] |= (u << 28);

        if (flags & BC_FLAGS_DITHER_A)
        {     
            float fDiff = fAlph - (float) u * (1.0f / 15.0f);

            if(3 != (i & 3))
            {
                assert( i < 15 );
                _Analysis_assume_( i < 15 );
                fError[i + 1] += fDiff * (7.0f / 16.0f);
            }

            if(i < 12)
            {
                if(i & 3)
                    fError[i + 3] += fDiff * (3.0f / 16.0f);

                fError[i + 4] += fDiff * (5.0f / 16.0f);

                if(3 != (i & 3))
                {
                    assert( i < 11 );
                    _Analysis_assume_( i < 11 );
                    fError[i + 5] += fDiff * (1.0f / 16.0f);
                }
            }
        }
    }

    // RGB part
#ifdef COLOR_WEIGHTS
    if(!pBC2->bitmap[0] && !pBC2->bitmap[1])
    {
        EncodeSolidBC1(pBC2->dxt1, Color);
        return;
    }
#endif // COLOR_WEIGHTS

    EncodeBC1(&pBC2->bc1, Color, false, 0.f, flags);
}


//-------------------------------------------------------------------------------------
// BC3 Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void D3DXDecodeBC3(XMVECTOR *pColor, const uint8_t *pBC)
{
    assert( pColor && pBC );
    static_assert( sizeof(D3DX_BC3) == 16, "D3DX_BC3 should be 16 bytes" );

    auto pBC3 = reinterpret_cast<const D3DX_BC3 *>(pBC);

    // RGB part
    DecodeBC1(pColor, &pBC3->bc1, false);

    // Adaptive 3-bit alpha part
    float fAlpha[8];

    fAlpha[0] = ((float) pBC3->alpha[0]) * (1.0f / 255.0f);
    fAlpha[1] = ((float) pBC3->alpha[1]) * (1.0f / 255.0f);

    if(pBC3->alpha[0] > pBC3->alpha[1]) 
    {
        for(size_t i = 1; i < 7; ++i)
            fAlpha[i + 1] = (fAlpha[0] * (7 - i) + fAlpha[1] * i) * (1.0f / 7.0f);
    }
    else 
    {
        for(size_t i = 1; i < 5; ++i)
            fAlpha[i + 1] = (fAlpha[0] * (5 - i) + fAlpha[1] * i) * (1.0f / 5.0f);

        fAlpha[6] = 0.0f;
        fAlpha[7] = 1.0f;
    }

    DWORD dw = pBC3->bitmap[0] | (pBC3->bitmap[1] << 8) | (pBC3->bitmap[2] << 16);

    for(size_t i = 0; i < 8; ++i, dw >>= 3)
        pColor[i] = XMVectorSetW( pColor[i], fAlpha[dw & 0x7] );

    dw = pBC3->bitmap[3] | (pBC3->bitmap[4] << 8) | (pBC3->bitmap[5] << 16);

    for(size_t i = 8; i < NUM_PIXELS_PER_BLOCK; ++i, dw >>= 3)
        pColor[i] = XMVectorSetW( pColor[i], fAlpha[dw & 0x7] );
}

_Use_decl_annotations_
void D3DXEncodeBC3(uint8_t *pBC, const XMVECTOR *pColor, DWORD flags)
{
    assert( pBC && pColor );
    static_assert( sizeof(D3DX_BC3) == 16, "D3DX_BC3 should be 16 bytes" );

    HDRColorA Color[NUM_PIXELS_PER_BLOCK];
    for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        XMStoreFloat4( reinterpret_cast<XMFLOAT4*>( &Color[i] ), pColor[i] );
    }

    auto pBC3 = reinterpret_cast<D3DX_BC3 *>(pBC);

    // Quantize block to A8, using Floyd Stienberg error diffusion.  This 
    // increases the chance that colors will map directly to the quantized 
    // axis endpoints.
    float fAlpha[NUM_PIXELS_PER_BLOCK];
    float fError[NUM_PIXELS_PER_BLOCK];

    float fMinAlpha = Color[0].a;
    float fMaxAlpha = Color[0].a;

    if (flags & BC_FLAGS_DITHER_A)
        memset(fError, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(float));

    for(size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        float fAlph = Color[i].a;
        if (flags & BC_FLAGS_DITHER_A)
            fAlph += fError[i];

        fAlpha[i] = static_cast<int32_t>(fAlph * 255.0f + 0.5f) * (1.0f / 255.0f);

        if(fAlpha[i] < fMinAlpha)
            fMinAlpha = fAlpha[i];
        else if(fAlpha[i] > fMaxAlpha)
            fMaxAlpha = fAlpha[i];
    
        if (flags & BC_FLAGS_DITHER_A)
        {
            float fDiff = fAlph - fAlpha[i];

            if(3 != (i & 3))
            {
                assert( i < 15 );
                _Analysis_assume_( i < 15 );
                fError[i + 1] += fDiff * (7.0f / 16.0f);
            }

            if(i < 12)
            {
                if(i & 3)
                    fError[i + 3] += fDiff * (3.0f / 16.0f);

                fError[i + 4] += fDiff * (5.0f / 16.0f);

                if(3 != (i & 3))
                {
                    assert( i < 11 );
                    _Analysis_assume_( i < 11 );
                    fError[i + 5] += fDiff * (1.0f / 16.0f);
                }
            }
        }
    }

#ifdef COLOR_WEIGHTS
    if(0.0f == fMaxAlpha)
    {
        EncodeSolidBC1(&pBC3->dxt1, Color);
        pBC3->alpha[0] = 0x00;
        pBC3->alpha[1] = 0x00;
        memset(pBC3->bitmap, 0x00, 6);
    }
#endif

    // RGB part
    EncodeBC1(&pBC3->bc1, Color, false, 0.f, flags);

    // Alpha part
    if(1.0f == fMinAlpha)
    {
        pBC3->alpha[0] = 0xff;
        pBC3->alpha[1] = 0xff;
        memset(pBC3->bitmap, 0x00, 6);
        return;
    }

    // Optimize and Quantize Min and Max values
    size_t uSteps = ((0.0f == fMinAlpha) || (1.0f == fMaxAlpha)) ? 6 : 8;

    float fAlphaA, fAlphaB;
    OptimizeAlpha<false>(&fAlphaA, &fAlphaB, fAlpha, uSteps);

    uint8_t bAlphaA = (uint8_t) static_cast<int32_t>(fAlphaA * 255.0f + 0.5f);
    uint8_t bAlphaB = (uint8_t) static_cast<int32_t>(fAlphaB * 255.0f + 0.5f);

    fAlphaA = (float) bAlphaA * (1.0f / 255.0f);
    fAlphaB = (float) bAlphaB * (1.0f / 255.0f);

    // Setup block
    if((8 == uSteps) && (bAlphaA == bAlphaB))
    {
        pBC3->alpha[0] = bAlphaA;
        pBC3->alpha[1] = bAlphaB;
        memset(pBC3->bitmap, 0x00, 6);
        return;
    }

    static const size_t pSteps6[] = { 0, 2, 3, 4, 5, 1 };
    static const size_t pSteps8[] = { 0, 2, 3, 4, 5, 6, 7, 1 };

    const size_t *pSteps;
    float fStep[8];

    if(6 == uSteps)
    {
        pBC3->alpha[0] = bAlphaA;
        pBC3->alpha[1] = bAlphaB;

        fStep[0] = fAlphaA;
        fStep[1] = fAlphaB;

        for(size_t i = 1; i < 5; ++i)
            fStep[i + 1] = (fStep[0] * (5 - i) + fStep[1] * i) * (1.0f / 5.0f);

        fStep[6] = 0.0f;
        fStep[7] = 1.0f;

        pSteps = pSteps6;
    }
    else
    {
        pBC3->alpha[0] = bAlphaB;
        pBC3->alpha[1] = bAlphaA;

        fStep[0] = fAlphaB;
        fStep[1] = fAlphaA;

        for(size_t i = 1; i < 7; ++i)
            fStep[i + 1] = (fStep[0] * (7 - i) + fStep[1] * i) * (1.0f / 7.0f);

        pSteps = pSteps8;
    }

    // Encode alpha bitmap
    float fSteps = (float) (uSteps - 1);
    float fScale = (fStep[0] != fStep[1]) ? (fSteps / (fStep[1] - fStep[0])) : 0.0f;

    if (flags & BC_FLAGS_DITHER_A)
        memset(fError, 0x00, NUM_PIXELS_PER_BLOCK * sizeof(float));

    for(size_t iSet = 0; iSet < 2; iSet++)
    {
        uint32_t dw = 0;

        size_t iMin = iSet * 8;
        size_t iLim = iMin + 8;

        for(size_t i = iMin; i < iLim; ++i)
        {
            float fAlph = Color[i].a;
            if (flags & BC_FLAGS_DITHER_A)
                fAlph += fError[i];
            float fDot = (fAlph - fStep[0]) * fScale;

            uint32_t iStep;
            if(fDot <= 0.0f)
                iStep = ((6 == uSteps) && (fAlph <= fStep[0] * 0.5f)) ? 6 : 0;
            else if(fDot >= fSteps)
                iStep = ((6 == uSteps) && (fAlph >= (fStep[1] + 1.0f) * 0.5f)) ? 7 : 1;
            else
                iStep = static_cast<uint32_t>( pSteps[static_cast<size_t>(fDot + 0.5f)] );

            dw = (iStep << 21) | (dw >> 3);

            if (flags & BC_FLAGS_DITHER_A)
            {
                float fDiff = (fAlph - fStep[iStep]);

                if(3 != (i & 3))
                    fError[i + 1] += fDiff * (7.0f / 16.0f);

                if(i < 12)
                {
                    if(i & 3)
                        fError[i + 3] += fDiff * (3.0f / 16.0f);

                    fError[i + 4] += fDiff * (5.0f / 16.0f);

                    if(3 != (i & 3))
                        fError[i + 5] += fDiff * (1.0f / 16.0f);
                }
            }
        }

        pBC3->bitmap[0 + iSet * 3] = ((uint8_t *) &dw)[0];
        pBC3->bitmap[1 + iSet * 3] = ((uint8_t *) &dw)[1];
        pBC3->bitmap[2 + iSet * 3] = ((uint8_t *) &dw)[2];
    }
}

} // namespace
