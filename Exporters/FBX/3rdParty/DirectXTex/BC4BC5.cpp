//-------------------------------------------------------------------------------------
// BC4BC5.cpp
//  
// Block-compression (BC) functionality for BC4 and BC5 (DirectX 10 texture compression)
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

#include "BC.h"

namespace DirectX
{

//------------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------------

// Because these are used in SAL annotations, they need to remain macros rather than const values
#define BLOCK_LEN 4
    // length of each block in texel

#define BLOCK_SIZE (BLOCK_LEN * BLOCK_LEN)
    // total texels in a 4x4 block.

//------------------------------------------------------------------------------------
// Structures
//-------------------------------------------------------------------------------------

#pragma warning(push)
#pragma warning(disable : 4201)

// BC4U/BC5U
struct BC4_UNORM
{
    float R(size_t uOffset) const
    {
        size_t uIndex = GetIndex(uOffset);
        return DecodeFromIndex(uIndex);
    }

    float DecodeFromIndex(size_t uIndex) const
    {
        if (uIndex == 0)
            return red_0 / 255.0f;
        if (uIndex == 1)
            return red_1 / 255.0f;
        float fred_0 = red_0 / 255.0f;
        float fred_1 = red_1 / 255.0f;
        if (red_0 > red_1)
        {
            uIndex -= 1;
            return (fred_0 * (7-uIndex) + fred_1 * uIndex) / 7.0f;
        }
        else
        {
            if (uIndex == 6)
                return 0.0f;
            if (uIndex == 7)
                return 1.0f;
            uIndex -= 1;
            return (fred_0 * (5-uIndex) + fred_1 * uIndex) / 5.0f;
        }
    }

    size_t GetIndex(size_t uOffset) const
    {
        return (size_t) ((data >> (3*uOffset + 16)) & 0x07);
    }    

    void SetIndex(size_t uOffset, size_t uIndex)
    {
        data &= ~((uint64_t) 0x07 << (3*uOffset + 16));
        data |= ((uint64_t) uIndex << (3*uOffset + 16));
    }

    union
    {
        struct 
        {
            uint8_t red_0;
            uint8_t red_1;
            uint8_t indices[6]; 
        };
        uint64_t data;
    };
};

// BC4S/BC5S
struct BC4_SNORM
{
    float R(size_t uOffset) const
    {
        size_t uIndex = GetIndex(uOffset);
        return DecodeFromIndex(uIndex);
    }

    float DecodeFromIndex(size_t uIndex) const
    {
        int8_t sred_0 = (red_0 == -128)? -127 : red_0;
        int8_t sred_1 = (red_1 == -128)? -127 : red_1;

        if (uIndex == 0)
            return sred_0 / 127.0f;
        if (uIndex == 1)
            return sred_1 / 127.0f;
        float fred_0 = sred_0 / 127.0f;
        float fred_1 = sred_1 / 127.0f;
        if (red_0 > red_1)
        {
            uIndex -= 1;
            return (fred_0 * (7-uIndex) + fred_1 * uIndex) / 7.0f;
        }
        else
        {
            if (uIndex == 6)
                return -1.0f;
            if (uIndex == 7)
                return 1.0f;  
            uIndex -= 1;
            return (fred_0 * (5-uIndex) + fred_1 * uIndex) / 5.0f;
        }
    }

    size_t GetIndex(size_t uOffset) const
    {
        return (size_t) ((data >> (3*uOffset + 16)) & 0x07);
    }    

    void SetIndex(size_t uOffset, size_t uIndex)
    {
        data &= ~((uint64_t) 0x07 << (3*uOffset + 16));
        data |= ((uint64_t) uIndex << (3*uOffset + 16));
    }

    union
    {
        struct 
        {
            int8_t red_0;
            int8_t red_1;
            uint8_t indices[6]; 
        };
        uint64_t data;
    };
};

#pragma warning(pop)

//-------------------------------------------------------------------------------------
// Convert a floating point value to an 8-bit SNORM
//-------------------------------------------------------------------------------------
static void inline FloatToSNorm( _In_ float fVal, _Out_ int8_t *piSNorm )
{
    const uint32_t dwMostNeg = ( 1 << ( 8 * sizeof( int8_t ) - 1 ) );

    if( _isnan( fVal ) )
        fVal = 0;
    else
        if( fVal > 1 )
            fVal = 1;    // Clamp to 1
        else
            if( fVal < -1 )
                fVal = -1;    // Clamp to -1

    fVal = fVal * (int8_t) ( dwMostNeg - 1 );

    if( fVal >= 0 )
        fVal += .5f;
    else
        fVal -= .5f;

    *piSNorm = (int8_t) (fVal);
}


//------------------------------------------------------------------------------
static void FindEndPointsBC4U( _In_reads_(BLOCK_SIZE) const float theTexelsU[], _Out_ uint8_t &endpointU_0, _Out_ uint8_t &endpointU_1)
{
    // The boundary of codec for signed/unsigned format
    float MIN_NORM;
    float MAX_NORM = 1.0f;
    int8_t iStart, iEnd;
    size_t i;

    MIN_NORM = 0.0f;

    // Find max/min of input texels
    float fBlockMax = theTexelsU[0];
    float fBlockMin = theTexelsU[0];
    for (i = 0; i < BLOCK_SIZE; ++i)
    {    
        if (theTexelsU[i]<fBlockMin)
        {
            fBlockMin = theTexelsU[i];
        }
        else if (theTexelsU[i]>fBlockMax)
        {
            fBlockMax = theTexelsU[i];
        }
    }

    //  If there are boundary values in input texels, Should use 4 block-codec to guarantee
    //  the exact code of the boundary values.
    bool bUsing4BlockCodec = ( MIN_NORM == fBlockMin || MAX_NORM == fBlockMax );

    // Using Optimize
    float fStart, fEnd;

    if (!bUsing4BlockCodec)
    {   
        OptimizeAlpha<false>(&fStart, &fEnd, theTexelsU, 8);

        iStart = (uint8_t) (fStart * 255.0f);
        iEnd   = (uint8_t) (fEnd   * 255.0f);

        endpointU_0 = iEnd;
        endpointU_1 = iStart;
    }
    else
    {
        OptimizeAlpha<false>(&fStart, &fEnd, theTexelsU, 6);

        iStart = (uint8_t) (fStart * 255.0f);
        iEnd   = (uint8_t) (fEnd   * 255.0f);

        endpointU_1 = iEnd;
        endpointU_0 = iStart;
    }
}

static void FindEndPointsBC4S(_In_reads_(BLOCK_SIZE) const float theTexelsU[], _Out_ int8_t &endpointU_0, _Out_ int8_t &endpointU_1)
{
    //  The boundary of codec for signed/unsigned format
    float MIN_NORM;
    float MAX_NORM = 1.0f;
    int8_t iStart, iEnd;
    size_t i;

    MIN_NORM = -1.0f;

    // Find max/min of input texels
    float fBlockMax = theTexelsU[0];
    float fBlockMin = theTexelsU[0];
    for (i = 0; i < BLOCK_SIZE; ++i)
    {    
        if (theTexelsU[i]<fBlockMin)
        {
            fBlockMin = theTexelsU[i];
        }
        else if (theTexelsU[i]>fBlockMax)
        {
            fBlockMax = theTexelsU[i];
        }
    }

    //  If there are boundary values in input texels, Should use 4 block-codec to guarantee
    //  the exact code of the boundary values.
    bool bUsing4BlockCodec = ( MIN_NORM == fBlockMin || MAX_NORM == fBlockMax );

    // Using Optimize
    float fStart, fEnd;

    if (!bUsing4BlockCodec)
    {   
        OptimizeAlpha<true>(&fStart, &fEnd, theTexelsU, 8);

        FloatToSNorm(fStart, &iStart);
        FloatToSNorm(fEnd, &iEnd);

        endpointU_0 = iEnd;
        endpointU_1 = iStart;
    }
    else
    {
        OptimizeAlpha<true>(&fStart, &fEnd, theTexelsU, 6);

        FloatToSNorm(fStart, &iStart);
        FloatToSNorm(fEnd, &iEnd);

        endpointU_1 = iEnd;
        endpointU_0 = iStart;
    }
}


//------------------------------------------------------------------------------
static inline void FindEndPointsBC5U( _In_reads_(BLOCK_SIZE) const float theTexelsU[], _In_reads_(BLOCK_SIZE) const float theTexelsV[],
                                      _Out_ uint8_t &endpointU_0, _Out_ uint8_t &endpointU_1, _Out_ uint8_t &endpointV_0, _Out_ uint8_t &endpointV_1)
{
    //Encoding the U and V channel by BC4 codec separately.
    FindEndPointsBC4U( theTexelsU, endpointU_0, endpointU_1);
    FindEndPointsBC4U( theTexelsV, endpointV_0, endpointV_1);
}

static inline void FindEndPointsBC5S( _In_reads_(BLOCK_SIZE) const float theTexelsU[], _In_reads_(BLOCK_SIZE) const float theTexelsV[],
                                      _Out_ int8_t &endpointU_0, _Out_ int8_t &endpointU_1, _Out_ int8_t &endpointV_0, _Out_ int8_t &endpointV_1)
{
    //Encoding the U and V channel by BC4 codec separately.
    FindEndPointsBC4S( theTexelsU, endpointU_0, endpointU_1);
    FindEndPointsBC4S( theTexelsV, endpointV_0, endpointV_1);
}


//------------------------------------------------------------------------------
static void FindClosestUNORM(_Inout_ BC4_UNORM* pBC, _In_reads_(NUM_PIXELS_PER_BLOCK) const float theTexelsU[])
{
    float rGradient[8];
    int i;
    for (i = 0; i < 8; ++i)
    {
        rGradient[i] = pBC->DecodeFromIndex(i);
    }
    for (i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        size_t uBestIndex = 0;
        float fBestDelta = 100000;
        for (size_t uIndex = 0; uIndex < 8; uIndex++)
        {
            float fCurrentDelta = fabsf(rGradient[uIndex]-theTexelsU[i]);
            if (fCurrentDelta < fBestDelta)
            {
                uBestIndex = uIndex;
                fBestDelta = fCurrentDelta;
            }
        }
        pBC->SetIndex(i, uBestIndex);
    }
}

static void FindClosestSNORM(_Inout_ BC4_SNORM* pBC, _In_reads_(NUM_PIXELS_PER_BLOCK) const float theTexelsU[])
{    
    float rGradient[8];
    int i;
    for (i = 0; i < 8; ++i)
    {
        rGradient[i] = pBC->DecodeFromIndex(i);
    }
    for (i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        size_t uBestIndex = 0;
        float fBestDelta = 100000;
        for (size_t uIndex = 0; uIndex < 8; uIndex++)
        {
            float fCurrentDelta = fabsf(rGradient[uIndex]-theTexelsU[i]);
            if (fCurrentDelta < fBestDelta)
            {
                uBestIndex = uIndex;
                fBestDelta = fCurrentDelta;
            }
        }
        pBC->SetIndex(i, uBestIndex);
    }
}


//=====================================================================================
// Entry points
//=====================================================================================

//-------------------------------------------------------------------------------------
// BC4 Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void D3DXDecodeBC4U( XMVECTOR *pColor, const uint8_t *pBC )
{
    assert( pColor && pBC );
    static_assert( sizeof(BC4_UNORM) == 8, "BC4_UNORM should be 8 bytes" );

    auto pBC4 = reinterpret_cast<const BC4_UNORM*>(pBC);

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        #pragma prefast(suppress:22103, "writing blocks in two halves confuses tool")
        pColor[i] = XMVectorSet( pBC4->R(i), 0, 0, 1.0f);
    }       
}

_Use_decl_annotations_
void D3DXDecodeBC4S(XMVECTOR *pColor, const uint8_t *pBC)
{
    assert( pColor && pBC );
    static_assert( sizeof(BC4_SNORM) == 8, "BC4_SNORM should be 8 bytes" );

    auto pBC4 = reinterpret_cast<const BC4_SNORM*>(pBC);

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        #pragma prefast(suppress:22103, "writing blocks in two halves confuses tool")
        pColor[i] = XMVectorSet( pBC4->R(i), 0, 0, 1.0f);
    }       
}

_Use_decl_annotations_
void D3DXEncodeBC4U( uint8_t *pBC, const XMVECTOR *pColor, DWORD flags )
{
    UNREFERENCED_PARAMETER( flags );

    assert( pBC && pColor );
    static_assert( sizeof(BC4_UNORM) == 8, "BC4_UNORM should be 8 bytes" );

    memset(pBC, 0, sizeof(BC4_UNORM));
    auto pBC4 = reinterpret_cast<BC4_UNORM*>(pBC);
    float theTexelsU[NUM_PIXELS_PER_BLOCK];

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        theTexelsU[i] = XMVectorGetX( pColor[i] );
    }

    FindEndPointsBC4U(theTexelsU, pBC4->red_0, pBC4->red_1);
    FindClosestUNORM(pBC4, theTexelsU);
}

_Use_decl_annotations_
void D3DXEncodeBC4S( uint8_t *pBC, const XMVECTOR *pColor, DWORD flags )
{
    UNREFERENCED_PARAMETER( flags );

    assert( pBC && pColor );
    static_assert( sizeof(BC4_SNORM) == 8, "BC4_SNORM should be 8 bytes" );

    memset(pBC, 0, sizeof(BC4_UNORM));
    auto pBC4 = reinterpret_cast<BC4_SNORM*>(pBC);
    float theTexelsU[NUM_PIXELS_PER_BLOCK];

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        theTexelsU[i] = XMVectorGetX( pColor[i] );
    }

    FindEndPointsBC4S(theTexelsU, pBC4->red_0, pBC4->red_1);
    FindClosestSNORM(pBC4, theTexelsU);
}


//-------------------------------------------------------------------------------------
// BC5 Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void D3DXDecodeBC5U(XMVECTOR *pColor, const uint8_t *pBC)
{
    assert( pColor && pBC );
    static_assert( sizeof(BC4_UNORM) == 8, "BC4_UNORM should be 8 bytes" );

    auto pBCR = reinterpret_cast<const BC4_UNORM*>(pBC);
    auto pBCG = reinterpret_cast<const BC4_UNORM*>(pBC+sizeof(BC4_UNORM));

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        #pragma prefast(suppress:22103, "writing blocks in two halves confuses tool")
        pColor[i] = XMVectorSet(pBCR->R(i), pBCG->R(i), 0, 1.0f);
    }       
}

_Use_decl_annotations_
void D3DXDecodeBC5S(XMVECTOR *pColor, const uint8_t *pBC)
{
    assert( pColor && pBC );
    static_assert( sizeof(BC4_SNORM) == 8, "BC4_SNORM should be 8 bytes" );

    auto pBCR = reinterpret_cast<const BC4_SNORM*>(pBC);
    auto pBCG = reinterpret_cast<const BC4_SNORM*>(pBC+sizeof(BC4_SNORM));

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        #pragma prefast(suppress:22103, "writing blocks in two halves confuses tool")
        pColor[i] = XMVectorSet(pBCR->R(i), pBCG->R(i), 0, 1.0f);
    }       
}

_Use_decl_annotations_
void D3DXEncodeBC5U( uint8_t *pBC, const XMVECTOR *pColor, DWORD flags )
{
    UNREFERENCED_PARAMETER( flags );

    assert( pBC && pColor );
    static_assert( sizeof(BC4_UNORM) == 8, "BC4_UNORM should be 8 bytes" );

    memset(pBC, 0, sizeof(BC4_UNORM)*2);
    auto pBCR = reinterpret_cast<BC4_UNORM*>(pBC);
    auto pBCG = reinterpret_cast<BC4_UNORM*>(pBC+sizeof(BC4_UNORM));
    float theTexelsU[NUM_PIXELS_PER_BLOCK];
    float theTexelsV[NUM_PIXELS_PER_BLOCK];

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {   
        XMFLOAT4A clr;
        XMStoreFloat4A( &clr, pColor[i] );
        theTexelsU[i] = clr.x;
        theTexelsV[i] = clr.y;
    }

    FindEndPointsBC5U(
        theTexelsU,
        theTexelsV,
        pBCR->red_0,
        pBCR->red_1,
        pBCG->red_0,
        pBCG->red_1);

    FindClosestUNORM(pBCR, theTexelsU);
    FindClosestUNORM(pBCG, theTexelsV);
}

_Use_decl_annotations_
void D3DXEncodeBC5S( uint8_t *pBC, const XMVECTOR *pColor, DWORD flags )
{
    UNREFERENCED_PARAMETER( flags );

    assert( pBC && pColor );
    static_assert( sizeof(BC4_SNORM) == 8, "BC4_SNORM should be 8 bytes" );

    memset(pBC, 0, sizeof(BC4_UNORM)*2);
    auto pBCR = reinterpret_cast<BC4_SNORM*>(pBC);
    auto pBCG = reinterpret_cast<BC4_SNORM*>(pBC+sizeof(BC4_SNORM));
    float theTexelsU[NUM_PIXELS_PER_BLOCK];
    float theTexelsV[NUM_PIXELS_PER_BLOCK];

    for (size_t i = 0; i < NUM_PIXELS_PER_BLOCK; ++i)
    {
        XMFLOAT4A clr;
        XMStoreFloat4A( &clr, pColor[i] );
        theTexelsU[i] = clr.x;
        theTexelsV[i] = clr.y;
    }

    FindEndPointsBC5S(
        theTexelsU,
        theTexelsV,
        pBCR->red_0,
        pBCR->red_1,
        pBCG->red_0,
        pBCG->red_1);

    FindClosestSNORM(pBCR, theTexelsU);
    FindClosestSNORM(pBCG, theTexelsV);
}

} // namespace
