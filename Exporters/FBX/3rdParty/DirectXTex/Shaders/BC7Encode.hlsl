//--------------------------------------------------------------------------------------
// File: BC7Encode.hlsl
//
// The Compute Shader for BC7 Encoder
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//--------------------------------------------------------------------------------------

//#define REF_DEVICE

#define CHAR_LENGTH			8
#define NCHANNELS			4
#define	BC7_UNORM			98
#define MAX_UINT			0xFFFFFFFF
#define MIN_UINT			0

static const uint candidateSectionBit[64] = //Associated to partition 0-63
{
    0xCCCC, 0x8888, 0xEEEE, 0xECC8,
    0xC880, 0xFEEC, 0xFEC8, 0xEC80,
    0xC800, 0xFFEC, 0xFE80, 0xE800,
    0xFFE8, 0xFF00, 0xFFF0, 0xF000,
    0xF710, 0x008E, 0x7100, 0x08CE,
    0x008C, 0x7310, 0x3100, 0x8CCE,
    0x088C, 0x3110, 0x6666, 0x366C,
    0x17E8, 0x0FF0, 0x718E, 0x399C,
    0xaaaa, 0xf0f0, 0x5a5a, 0x33cc, 
    0x3c3c, 0x55aa, 0x9696, 0xa55a, 
    0x73ce, 0x13c8, 0x324c, 0x3bdc, 
    0x6996, 0xc33c, 0x9966, 0x660, 
    0x272, 0x4e4, 0x4e40, 0x2720, 
    0xc936, 0x936c, 0x39c6, 0x639c, 
    0x9336, 0x9cc6, 0x817e, 0xe718, 
    0xccf0, 0xfcc, 0x7744, 0xee22, 
};
static const uint candidateSectionBit2[64] = //Associated to partition 64-127
{
    0xaa685050, 0x6a5a5040, 0x5a5a4200, 0x5450a0a8,
    0xa5a50000, 0xa0a05050, 0x5555a0a0, 0x5a5a5050,
    0xaa550000, 0xaa555500, 0xaaaa5500, 0x90909090,
    0x94949494, 0xa4a4a4a4, 0xa9a59450, 0x2a0a4250,
    0xa5945040, 0x0a425054, 0xa5a5a500, 0x55a0a0a0,
    0xa8a85454, 0x6a6a4040, 0xa4a45000, 0x1a1a0500,
    0x0050a4a4, 0xaaa59090, 0x14696914, 0x69691400,
    0xa08585a0, 0xaa821414, 0x50a4a450, 0x6a5a0200,
    0xa9a58000, 0x5090a0a8, 0xa8a09050, 0x24242424,
    0x00aa5500, 0x24924924, 0x24499224, 0x50a50a50,
    0x500aa550, 0xaaaa4444, 0x66660000, 0xa5a0a5a0,
    0x50a050a0, 0x69286928, 0x44aaaa44, 0x66666600,
    0xaa444444, 0x54a854a8, 0x95809580, 0x96969600,
    0xa85454a8, 0x80959580, 0xaa141414, 0x96960000,
    0xaaaa1414, 0xa05050a0, 0xa0a5a5a0, 0x96000000,
    0x40804080, 0xa9a8a9a8, 0xaaaaaa44, 0x2a4a5254,
};
static const uint2 candidateFixUpIndex1D[128] = 
{
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{ 2, 0},{ 8, 0},{ 2, 0},
    { 2, 0},{ 8, 0},{ 8, 0},{15, 0},
    { 2, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    { 8, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    
    {15, 0},{15, 0},{ 6, 0},{ 8, 0},
    { 2, 0},{ 8, 0},{15, 0},{15, 0},
    { 2, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    { 2, 0},{15, 0},{15, 0},{ 6, 0},
    { 6, 0},{ 2, 0},{ 6, 0},{ 8, 0},
    {15, 0},{15, 0},{ 2, 0},{ 2, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{ 2, 0},{ 2, 0},{15, 0},
    //candidateFixUpIndex1D[i][1], i < 64 should not be used
    
    { 3,15},{ 3, 8},{15, 8},{15, 3},
    { 8,15},{ 3,15},{15, 3},{15, 8},
    { 8,15},{ 8,15},{ 6,15},{ 6,15},
    { 6,15},{ 5,15},{ 3,15},{ 3, 8},
    { 3,15},{ 3, 8},{ 8,15},{15, 3},
    { 3,15},{ 3, 8},{ 6,15},{10, 8},
    { 5, 3},{ 8,15},{ 8, 6},{ 6,10},
    { 8,15},{ 5,15},{15,10},{15, 8},
    
    { 8,15},{15, 3},{ 3,15},{ 5,10},
    { 6,10},{10, 8},{ 8, 9},{15,10},
    {15, 6},{ 3,15},{15, 8},{ 5,15},
    {15, 3},{15, 6},{15, 6},{15, 8}, //The Spec doesn't mark the first fixed up index in this row, so I apply 15 for them, and seems correct
    { 3,15},{15, 3},{ 5,15},{ 5,15},
    { 5,15},{ 8,15},{ 5,15},{10,15},
    { 5,15},{10,15},{ 8,15},{13,15},
    {15, 3},{12,15},{ 3,15},{ 3, 8},
};
static const uint2 candidateFixUpIndex1DOrdered[128] = //Same with candidateFixUpIndex1D but order the result when i >= 64
{
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{ 2, 0},{ 8, 0},{ 2, 0},
    { 2, 0},{ 8, 0},{ 8, 0},{15, 0},
    { 2, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    { 8, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    
    {15, 0},{15, 0},{ 6, 0},{ 8, 0},
    { 2, 0},{ 8, 0},{15, 0},{15, 0},
    { 2, 0},{ 8, 0},{ 2, 0},{ 2, 0},
    { 2, 0},{15, 0},{15, 0},{ 6, 0},
    { 6, 0},{ 2, 0},{ 6, 0},{ 8, 0},
    {15, 0},{15, 0},{ 2, 0},{ 2, 0},
    {15, 0},{15, 0},{15, 0},{15, 0},
    {15, 0},{ 2, 0},{ 2, 0},{15, 0},
    //candidateFixUpIndex1DOrdered[i][1], i < 64 should not be used
    
    { 3,15},{ 3, 8},{ 8,15},{ 3,15},
    { 8,15},{ 3,15},{ 3,15},{ 8,15},
    { 8,15},{ 8,15},{ 6,15},{ 6,15},
    { 6,15},{ 5,15},{ 3,15},{ 3, 8},
    { 3,15},{ 3, 8},{ 8,15},{ 3,15},
    { 3,15},{ 3, 8},{ 6,15},{ 8,10},
    { 3, 5},{ 8,15},{ 6, 8},{ 6,10},
    { 8,15},{ 5,15},{10,15},{ 8,15},
    
    { 8,15},{ 3,15},{ 3,15},{ 5,10},
    { 6,10},{ 8,10},{ 8, 9},{10,15},
    { 6,15},{ 3,15},{ 8,15},{ 5,15},
    { 3,15},{ 6,15},{ 6,15},{ 8,15}, //The Spec doesn't mark the first fixed up index in this row, so I apply 15 for them, and seems correct
    { 3,15},{ 3,15},{ 5,15},{ 5,15},
    { 5,15},{ 8,15},{ 5,15},{10,15},
    { 5,15},{10,15},{ 8,15},{13,15},
    { 3,15},{12,15},{ 3,15},{ 3, 8},
};
//static const uint4x4 candidateRotation[4] = 
//{
//    {1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1},
//    {0,0,0,1},{0,1,0,0},{0,0,1,0},{1,0,0,0},
//    {1,0,0,0},{0,0,0,1},{0,0,1,0},{0,1,0,0},
//    {1,0,0,0},{0,1,0,0},{0,0,0,1},{0,0,1,0}
//};
//static const uint2 candidateIndexPrec[8] = {{3,0},{3,0},{2,0},{2,0},
//                                            {2,3}, //color index and alpha index can exchange
//                                            {2,2},{4,4},{2,2}};

static const uint aWeight[3][16] = { {0,  4,  9, 13, 17, 21, 26, 30, 34, 38, 43, 47, 51, 55, 60, 64},
                                    {0,  9, 18, 27, 37, 46, 55, 64,  0,  0,  0,  0,  0,  0,  0,  0},
                                    {0, 21, 43, 64,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0} };

                                //4 bit index: 0, 4, 9, 13, 17, 21, 26, 30, 34, 38, 43, 47, 51, 55, 60, 64
static const uint aStep[3][64] = {  { 0, 0, 0, 1, 1, 1, 1, 2,
                                    2, 2, 2, 2, 3, 3, 3, 3,
                                    4, 4, 4, 4, 5, 5, 5, 5,
                                    6, 6, 6, 6, 6, 7, 7, 7,
                                    7, 8, 8, 8, 8, 9, 9, 9,
                                    9,10,10,10,10,10,11,11,
                                   11,11,12,12,12,12,13,13,
                                   13,13,14,14,14,14,15,15 },
                                //3 bit index: 0, 9, 18, 27, 37, 46, 55, 64
                                    { 0,0,0,0,0,1,1,1,
                                    1,1,1,1,1,1,2,2,
                                    2,2,2,2,2,2,2,3,
                                    3,3,3,3,3,3,3,3,
                                    3,4,4,4,4,4,4,4,
                                    4,4,5,5,5,5,5,5,
                                    5,5,5,6,6,6,6,6,
                                    6,6,6,6,7,7,7,7 },
                                //2 bit index: 0, 21, 43, 64
                                    { 0,0,0,0,0,0,0,0,
                                    0,0,0,1,1,1,1,1,
                                    1,1,1,1,1,1,1,1,
                                    1,1,1,1,1,1,1,1,
                                    1,2,2,2,2,2,2,2,
                                    2,2,2,2,2,2,2,2,
                                    2,2,2,2,2,2,3,3,
                                    3,3,3,3,3,3,3,3 } };

cbuffer cbCS : register( b0 )
{
    uint g_tex_width;
    uint g_num_block_x;
    uint g_format;
    uint g_mode_id;
    uint g_start_block_id;
    uint g_num_total_blocks;
    float g_alpha_weight;
};

//Forward declaration
uint2x4 compress_endpoints0( inout uint2x4 endPoint, uint2 P ); //Mode = 0
uint2x4 compress_endpoints1( inout uint2x4 endPoint, uint2 P ); //Mode = 1
uint2x4 compress_endpoints2( inout uint2x4 endPoint ); //Mode = 2
uint2x4 compress_endpoints3( inout uint2x4 endPoint, uint2 P ); //Mode = 3
uint2x4 compress_endpoints7( inout uint2x4 endPoint, uint2 P ); //Mode = 7
uint2x4 compress_endpoints6( inout uint2x4 endPoint, uint2 P ); //Mode = 6
uint2x4 compress_endpoints4( inout uint2x4 endPoint ); //Mode = 4
uint2x4 compress_endpoints5( inout uint2x4 endPoint ); //Mode = 5

void block_package0( out uint4 block, uint partition, uint threadBase ); //Mode0
void block_package1( out uint4 block, uint partition, uint threadBase ); //Mode1
void block_package2( out uint4 block, uint partition, uint threadBase ); //Mode2
void block_package3( out uint4 block, uint partition, uint threadBase ); //Mode3
void block_package4( out uint4 block, uint rotation, uint index_selector, uint threadBase ); //Mode4
void block_package5( out uint4 block, uint rotation, uint threadBase ); //Mode5
void block_package6( out uint4 block, uint threadBase ); //Mode6
void block_package7( out uint4 block, uint partition, uint threadBase ); //Mode7


void swap(inout uint4 lhs, inout uint4 rhs)
{
    uint4 tmp = lhs;
    lhs = rhs;
    rhs = tmp;
}
void swap(inout uint3 lhs, inout uint3 rhs)
{
    uint3 tmp = lhs;
    lhs = rhs;
    rhs = tmp;
}
void swap(inout uint lhs, inout uint rhs)
{
    uint tmp = lhs;
    lhs = rhs;
    rhs = tmp;
}

uint ComputeError(in uint4 a, in uint4 b)
{		
	return dot(a.rgb, b.rgb) + g_alpha_weight * a.a*b.a;
}

void Ensure_A_Is_Larger( inout uint4 a, inout uint4 b )
{
    if ( a.x < b.x )
        swap( a.x, b.x );
    if ( a.y < b.y )
        swap( a.y, b.y );
    if ( a.z < b.z )
        swap( a.z, b.z );
    if ( a.w < b.w )
        swap( a.w, b.w );
}


Texture2D g_Input : register( t0 ); 
StructuredBuffer<uint4> g_InBuff : register( t1 );

RWStructuredBuffer<uint4> g_OutBuff : register( u0 );

#define THREAD_GROUP_SIZE	64
#define BLOCK_SIZE_Y		4
#define BLOCK_SIZE_X		4
#define BLOCK_SIZE			(BLOCK_SIZE_Y * BLOCK_SIZE_X)

struct BufferShared
{
    uint4 pixel;
    uint error;
    uint mode;
    uint partition;
    uint index_selector;
    uint rotation;
    uint4 endPoint_low;
    uint4 endPoint_high;
    uint4 endPoint_low_quantized;
    uint4 endPoint_high_quantized;
};
groupshared BufferShared shared_temp[THREAD_GROUP_SIZE];

[numthreads( THREAD_GROUP_SIZE, 1, 1 )]
void TryMode456CS( uint GI : SV_GroupIndex, uint3 groupID : SV_GroupID ) // mode 4 5 6 all have 1 subset per block, and fix-up index is always index 0
{
    // we process 4 BC blocks per thread group
    const uint MAX_USED_THREAD = 16;                                                // pixels in a BC (block compressed) block
    uint BLOCK_IN_GROUP = THREAD_GROUP_SIZE / MAX_USED_THREAD;                      // the number of BC blocks a thread group processes = 64 / 16 = 4
    uint blockInGroup = GI / MAX_USED_THREAD;                                       // what BC block this thread is on within this thread group
    uint blockID = g_start_block_id + groupID.x * BLOCK_IN_GROUP + blockInGroup;    // what global BC block this thread is on
    uint threadBase = blockInGroup * MAX_USED_THREAD;                               // the first id of the pixel in this BC block in this thread group
    uint threadInBlock = GI - threadBase;                                           // id of the pixel in this BC block

#ifndef REF_DEVICE
    if (blockID >= g_num_total_blocks)
    {
        return;
    }
#endif

    uint block_y = blockID / g_num_block_x;
    uint block_x = blockID - block_y * g_num_block_x;
    uint base_x = block_x * BLOCK_SIZE_X;
    uint base_y = block_y * BLOCK_SIZE_Y;
    
    if (threadInBlock < 16)
    {
        shared_temp[GI].pixel = clamp(uint4(g_Input.Load( uint3( base_x + threadInBlock % 4, base_y + threadInBlock / 4, 0 ) ) * 255), 0, 255);

        shared_temp[GI].endPoint_low = shared_temp[GI].pixel;
        shared_temp[GI].endPoint_high = shared_temp[GI].pixel;
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    if (threadInBlock < 8)
    {
        shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 8].endPoint_low);
        shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 8].endPoint_high);
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 4)
    {
        shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 4].endPoint_low);
        shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 4].endPoint_high);
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 2)
    {
        shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 2].endPoint_low);
        shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 2].endPoint_high);
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 1)
    {
        shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 1].endPoint_low);
        shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 1].endPoint_high);
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    uint2x4 endPoint;
    endPoint[0] = shared_temp[threadBase].endPoint_low;
    endPoint[1] = shared_temp[threadBase].endPoint_high;

    uint error = 0xFFFFFFFF;
    uint mode = 0;
    uint index_selector = 0;
    uint rotation = 0;

    uint2 indexPrec;
    if (threadInBlock < 8) // all threads of threadInBlock < 8 will be working on trying out mode 4, since only mode 4 has index selector bit
    {
        if (0 == (threadInBlock & 1)) // thread 0, 2, 4, 6
        {
            //2 represents 2bit index precision; 1 represents 3bit index precision
            index_selector = 0;
            indexPrec = uint2( 2, 1 );
        }
        else                          // thread 1, 3, 5, 7
        {
            //2 represents 2bit index precision; 1 represents 3bit index precision
            index_selector = 1;
            indexPrec = uint2( 1, 2 );
        }
    }
    else
    {
         //2 represents 2bit index precision
        indexPrec = uint2( 2, 2 );
    }

    uint4 pixel_r;
    uint color_index;
    uint alpha_index;
    int4 span;
    int2 span_norm_sqr;
    int2 dotProduct;
    if (threadInBlock < 12) // Try mode 4 5 in threads 0..11
    {
        // mode 4 5 have component rotation
        if ((threadInBlock < 2) || (8 == threadInBlock))       // rotation = 0 in thread 0, 1
        {
            rotation = 0;
        }
        else if ((threadInBlock < 4) || (9 == threadInBlock))  // rotation = 1 in thread 2, 3
        {
            endPoint[0].ra = endPoint[0].ar;
            endPoint[1].ra = endPoint[1].ar;

            rotation = 1;
        }
        else if ((threadInBlock < 6) || (10 == threadInBlock)) // rotation = 2 in thread 4, 5
        {
            endPoint[0].ga = endPoint[0].ag;
            endPoint[1].ga = endPoint[1].ag;

            rotation = 2;
        }
        else if ((threadInBlock < 8) || (11 == threadInBlock)) // rotation = 3 in thread 6, 7
        {
            endPoint[0].ba = endPoint[0].ab;
            endPoint[1].ba = endPoint[1].ab;

            rotation = 3;
        }

        if (threadInBlock < 8)  // try mode 4 in threads 0..7
        {
            // mode 4 thread distribution
            // Thread           0	1	2	3	4	5	6	7
            // Rotation	        0	0	1	1	2	2	3	3
            // Index selector   0	1	0	1	0	1	0	1

            mode = 4;
            compress_endpoints4( endPoint );
        }
        else                    // try mode 5 in threads 8..11
        {
            // mode 5 thread distribution
            // Thread	 8	9  10  11
            // Rotation	 0	1   2   3

            mode = 5;
            compress_endpoints5( endPoint );
        }

        uint4 pixel = shared_temp[threadBase + 0].pixel;
        if (1 == rotation)
        {
            pixel.ra = pixel.ar;
        }
        else if (2 == rotation)
        {
            pixel.ga = pixel.ag;
        }
        else if (3 == rotation)
        {
            pixel.ba = pixel.ab;
        }

        span = endPoint[1] - endPoint[0];
        span_norm_sqr = uint2( dot( span.rgb, span.rgb ), span.a * span.a );
        
        // in mode 4 5 6, end point 0 must be closer to pixel 0 than end point 1, because of the fix-up index is always index 0
        // TODO: this shouldn't be necessary here in error calculation
        /*
        dotProduct = int2( dot( span.rgb, pixel.rgb - endPoint[0].rgb ), span.a * ( pixel.a - endPoint[0].a ) );
        if ( span_norm_sqr.x > 0 && dotProduct.x > 0 && uint( dotProduct.x * 63.49999 ) > uint( 32 * span_norm_sqr.x ) )
        {
            span.rgb = -span.rgb;
            swap(endPoint[0].rgb, endPoint[1].rgb);
        }
        if ( span_norm_sqr.y > 0 && dotProduct.y > 0 && uint( dotProduct.y * 63.49999 ) > uint( 32 * span_norm_sqr.y ) )
        {
            span.a = -span.a;
            swap(endPoint[0].a, endPoint[1].a);
        }
        */
	
        // should be the same as above
        dotProduct = int2( dot( pixel.rgb - endPoint[0].rgb, pixel.rgb - endPoint[0].rgb ), dot( pixel.rgb - endPoint[1].rgb, pixel.rgb - endPoint[1].rgb ) );
        if ( dotProduct.x > dotProduct.y )
        {
            span.rgb = -span.rgb;
            swap(endPoint[0].rgb, endPoint[1].rgb);
        }
        dotProduct = int2( dot( pixel.a - endPoint[0].a, pixel.a - endPoint[0].a ), dot( pixel.a - endPoint[1].a, pixel.a - endPoint[1].a ) );
        if ( dotProduct.x > dotProduct.y )
        {
            span.a = -span.a;
            swap(endPoint[0].a, endPoint[1].a);
        }

        error = 0;
        for ( uint i = 0; i < 16; i ++ )
        {
            pixel = shared_temp[threadBase + i].pixel;
            if (1 == rotation)
            {
                pixel.ra = pixel.ar;
            }
            else if (2 == rotation)
            {
                pixel.ga = pixel.ag;
            }
            else if (3 == rotation)
            {
                pixel.ba = pixel.ab;
            }

            dotProduct.x = dot( span.rgb, pixel.rgb - endPoint[0].rgb );
            color_index = ( span_norm_sqr.x <= 0 /*endPoint[0] == endPoint[1]*/ || dotProduct.x <= 0 /*pixel == endPoint[0]*/ ) ? 0
                : ( ( dotProduct.x < span_norm_sqr.x ) ? aStep[indexPrec.x][ uint( dotProduct.x * 63.49999 / span_norm_sqr.x ) ] : aStep[indexPrec.x][63] );
            dotProduct.y = dot( span.a, pixel.a - endPoint[0].a );
            alpha_index = ( span_norm_sqr.y <= 0 || dotProduct.y <= 0 ) ? 0
                : ( ( dotProduct.y < span_norm_sqr.y ) ? aStep[indexPrec.y][ uint( dotProduct.y * 63.49999 / span_norm_sqr.y ) ] : aStep[indexPrec.y][63] );

            // the same color_index and alpha_index should be used for reconstruction, so this should be left commented out
            /*if (index_selector)
            {
                swap(color_index, alpha_index);
            }*/

            pixel_r.rgb = ( ( 64 - aWeight[indexPrec.x][color_index] ) * endPoint[0].rgb +
                            aWeight[indexPrec.x][color_index] * endPoint[1].rgb + 
                            32 ) >> 6;
            pixel_r.a = ( ( 64 - aWeight[indexPrec.y][alpha_index] ) * endPoint[0].a + 
                          aWeight[indexPrec.y][alpha_index] * endPoint[1].a + 
                          32 ) >> 6;

            Ensure_A_Is_Larger( pixel_r, pixel );
            pixel_r -= pixel;
            if (1 == rotation)
            {
                pixel_r.ra = pixel_r.ar;
            }
            else if (2 == rotation)
            {
                pixel_r.ga = pixel_r.ag;
            }
            else if (3 == rotation)
            {
                pixel_r.ba = pixel_r.ab;
            }
            error += ComputeError(pixel_r, pixel_r);
        }
    }
    else if (threadInBlock < 16) // Try mode 6 in threads 12..15, since in mode 4 5 6, only mode 6 has p bit
    {
        uint p = threadInBlock - 12;

        compress_endpoints6( endPoint, uint2(p >> 0, p >> 1) & 1 );

        uint4 pixel = shared_temp[threadBase + 0].pixel;

        span = endPoint[1] - endPoint[0];
        span_norm_sqr = dot( span, span );
        dotProduct = dot( span, pixel - endPoint[0] );
        if ( span_norm_sqr.x > 0 && dotProduct.x >= 0 && uint( dotProduct.x * 63.49999 ) > uint( 32 * span_norm_sqr.x ) )
        {
            span = -span;
            swap(endPoint[0], endPoint[1]);
        }
            
        error = 0;
        for ( uint i = 0; i < 16; i ++ )
        {
            pixel = shared_temp[threadBase + i].pixel;
            
            dotProduct.x = dot( span, pixel - endPoint[0] );
            color_index = ( span_norm_sqr.x <= 0 || dotProduct.x <= 0 ) ? 0
                : ( ( dotProduct.x < span_norm_sqr.x ) ? aStep[0][ uint( dotProduct.x * 63.49999 / span_norm_sqr.x ) ] : aStep[0][63] );
            
            pixel_r = ( ( 64 - aWeight[0][color_index] ) * endPoint[0]
                + aWeight[0][color_index] * endPoint[1] + 32 ) >> 6;
        
            Ensure_A_Is_Larger( pixel_r, pixel );
            pixel_r -= pixel;
            error += ComputeError(pixel_r, pixel_r);
        }

        mode = 6;
        rotation = p;    // Borrow rotation for p
    }

    shared_temp[GI].error = error;
    shared_temp[GI].mode = mode;
    shared_temp[GI].index_selector = index_selector;
    shared_temp[GI].rotation = rotation;

#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    if (threadInBlock < 8)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 8].error )
        {
            shared_temp[GI].error = shared_temp[GI + 8].error;
            shared_temp[GI].mode = shared_temp[GI + 8].mode;
            shared_temp[GI].index_selector = shared_temp[GI + 8].index_selector;
            shared_temp[GI].rotation = shared_temp[GI + 8].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 4)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 4].error )
        {
            shared_temp[GI].error = shared_temp[GI + 4].error;
            shared_temp[GI].mode = shared_temp[GI + 4].mode;
            shared_temp[GI].index_selector = shared_temp[GI + 4].index_selector;
            shared_temp[GI].rotation = shared_temp[GI + 4].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 2)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 2].error )
        {
            shared_temp[GI].error = shared_temp[GI + 2].error;
            shared_temp[GI].mode = shared_temp[GI + 2].mode;
            shared_temp[GI].index_selector = shared_temp[GI + 2].index_selector;
            shared_temp[GI].rotation = shared_temp[GI + 2].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 1)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 1].error )
        {
            shared_temp[GI].error = shared_temp[GI + 1].error;
            shared_temp[GI].mode = shared_temp[GI + 1].mode;
            shared_temp[GI].index_selector = shared_temp[GI + 1].index_selector;
            shared_temp[GI].rotation = shared_temp[GI + 1].rotation;
        }

        g_OutBuff[blockID] = uint4(shared_temp[GI].error, (shared_temp[GI].index_selector << 31) | shared_temp[GI].mode,
            0, shared_temp[GI].rotation); // rotation is indeed rotation for mode 4 5. for mode 6, rotation is p bit
    }
}

[numthreads( THREAD_GROUP_SIZE, 1, 1 )]
void TryMode137CS( uint GI : SV_GroupIndex, uint3 groupID : SV_GroupID ) // mode 1 3 7 all have 2 subsets per block
{
    const uint MAX_USED_THREAD = 64;
    uint BLOCK_IN_GROUP = THREAD_GROUP_SIZE / MAX_USED_THREAD;
    uint blockInGroup = GI / MAX_USED_THREAD;
    uint blockID = g_start_block_id + groupID.x * BLOCK_IN_GROUP + blockInGroup;
    uint threadBase = blockInGroup * MAX_USED_THREAD;
    uint threadInBlock = GI - threadBase;

    uint block_y = blockID / g_num_block_x;
    uint block_x = blockID - block_y * g_num_block_x;
    uint base_x = block_x * BLOCK_SIZE_X;
    uint base_y = block_y * BLOCK_SIZE_Y;
    
    if (threadInBlock < 16)
    {
        shared_temp[GI].pixel = clamp(uint4(g_Input.Load( uint3( base_x + threadInBlock % 4, base_y + threadInBlock / 4, 0 ) ) * 255), 0, 255);
    }
    GroupMemoryBarrierWithGroupSync();

    shared_temp[GI].error = 0xFFFFFFFF;

    uint4 pixel_r;
    uint2x4 endPoint[2];        // endPoint[0..1 for subset id][0..1 for low and high in the subset]
    uint2x4 endPointBackup[2];
    uint color_index;
    if (threadInBlock < 64)
    {
        uint partition = threadInBlock;

        endPoint[0][0] = MAX_UINT;
        endPoint[0][1] = MIN_UINT;
        endPoint[1][0] = MAX_UINT;
        endPoint[1][1] = MIN_UINT;
        uint bits = candidateSectionBit[partition];
        for ( uint i = 0; i < 16; i ++ )
        {
            uint4 pixel = shared_temp[threadBase + i].pixel;
            if ( (( bits >> i ) & 0x01) == 1 )
            {
                endPoint[1][0] = min( endPoint[1][0], pixel );
                endPoint[1][1] = max( endPoint[1][1], pixel );
            }
            else
            {
                endPoint[0][0] = min( endPoint[0][0], pixel );
                endPoint[0][1] = max( endPoint[0][1], pixel );
            }
        }

        endPointBackup[0] = endPoint[0];
        endPointBackup[1] = endPoint[1];

        uint max_p;
        if (1 == g_mode_id)
        {
            // in mode 1, there is only one p bit per subset
            max_p = 4;
        }
        else
        {
            // in mode 3 7, there are two p bits per subset, one for each end point
            max_p = 16;
        }

        uint rotation = 0;
        uint error = MAX_UINT;
        for ( uint p = 0; p < max_p; p ++ )
        {
            endPoint[0] = endPointBackup[0];
            endPoint[1] = endPointBackup[1];

            for ( i = 0; i < 2; i ++ ) // loop through 2 subsets
            {
                if (g_mode_id == 1)
                {
                    compress_endpoints1( endPoint[i], (p >> i) & 1 );
                }
                else if (g_mode_id == 3)
                {
                    compress_endpoints3( endPoint[i], uint2(p >> (i * 2 + 0), p >> (i * 2 + 1)) & 1 );
                }
                else if (g_mode_id == 7)
                {
                    compress_endpoints7( endPoint[i], uint2(p >> (i * 2 + 0), p >> (i * 2 + 1)) & 1 );
                }
            }

            int4 span[2];
            span[0] = endPoint[0][1] - endPoint[0][0];
            span[1] = endPoint[1][1] - endPoint[1][0];

            if (g_mode_id != 7)
            {
                span[0].w = span[1].w = 0;
            }

            int span_norm_sqr[2];
            span_norm_sqr[0] = dot( span[0], span[0] );
            span_norm_sqr[1] = dot( span[1], span[1] );

            // TODO: again, this shouldn't be necessary here in error calculation
            int dotProduct = dot( span[0], shared_temp[threadBase + 0].pixel - endPoint[0][0] );
            if ( span_norm_sqr[0] > 0 && dotProduct > 0 && uint( dotProduct * 63.49999 ) > uint( 32 * span_norm_sqr[0] ) )
            {
                span[0] = -span[0];
                swap(endPoint[0][0], endPoint[0][1]);
            }
            dotProduct = dot( span[1], shared_temp[threadBase + candidateFixUpIndex1D[partition].x].pixel - endPoint[1][0] );
            if ( span_norm_sqr[1] > 0 && dotProduct > 0 && uint( dotProduct * 63.49999 ) > uint( 32 * span_norm_sqr[1] ) )
            {
                span[1] = -span[1];
                swap(endPoint[1][0], endPoint[1][1]);
            }

            uint step_selector;
            if (g_mode_id != 1)
            {
                step_selector = 2;  // mode 3 7 have 2 bit index
            }
            else
            {
                step_selector = 1;  // mode 1 has 3 bit index
            }

            uint p_error = 0;            
            for ( i = 0; i < 16; i ++ )
            {
                if (((bits >> i) & 0x01) == 1)
                {
                    dotProduct = dot( span[1], shared_temp[threadBase + i].pixel - endPoint[1][0] );
                    color_index = (span_norm_sqr[1] <= 0 || dotProduct <= 0) ? 0
                        : ((dotProduct < span_norm_sqr[1]) ? aStep[step_selector][uint(dotProduct * 63.49999 / span_norm_sqr[1])] : aStep[step_selector][63]);
                }
                else
                {
                    dotProduct = dot( span[0], shared_temp[threadBase + i].pixel - endPoint[0][0] );
                    color_index = (span_norm_sqr[0] <= 0 || dotProduct <= 0) ? 0
                        : ((dotProduct < span_norm_sqr[0]) ? aStep[step_selector][uint(dotProduct * 63.49999 / span_norm_sqr[0])] : aStep[step_selector][63]);
                }

                uint subset_index = (bits >> i) & 0x01;

                pixel_r = ((64 - aWeight[step_selector][color_index]) * endPoint[subset_index][0]
                    + aWeight[step_selector][color_index] * endPoint[subset_index][1] + 32) >> 6;
                if (g_mode_id != 7)
                {
                    pixel_r.a = 255;
                }

                uint4 pixel = shared_temp[threadBase + i].pixel;
                Ensure_A_Is_Larger( pixel_r, pixel );
                pixel_r -= pixel;
                p_error += ComputeError(pixel_r, pixel_r);
            }

            if (p_error < error)
            {
                error = p_error;
                rotation = p;
            }
        }

        shared_temp[GI].error = error;
        shared_temp[GI].mode = g_mode_id;
        shared_temp[GI].partition = partition;
        shared_temp[GI].rotation = rotation; // mode 1 3 7 don't have rotation, we use rotation for p bits
    }
    GroupMemoryBarrierWithGroupSync();

    if (threadInBlock < 32)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 32].error )
        {
            shared_temp[GI].error = shared_temp[GI + 32].error;
            shared_temp[GI].mode = shared_temp[GI + 32].mode;
            shared_temp[GI].partition = shared_temp[GI + 32].partition;
            shared_temp[GI].rotation = shared_temp[GI + 32].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
if (threadInBlock < 16)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 16].error )
        {
            shared_temp[GI].error = shared_temp[GI + 16].error;
            shared_temp[GI].mode = shared_temp[GI + 16].mode;
            shared_temp[GI].partition = shared_temp[GI + 16].partition;
            shared_temp[GI].rotation = shared_temp[GI + 16].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 8)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 8].error )
        {
            shared_temp[GI].error = shared_temp[GI + 8].error;
            shared_temp[GI].mode = shared_temp[GI + 8].mode;
            shared_temp[GI].partition = shared_temp[GI + 8].partition;
            shared_temp[GI].rotation = shared_temp[GI + 8].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 4)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 4].error )
        {
            shared_temp[GI].error = shared_temp[GI + 4].error;
            shared_temp[GI].mode = shared_temp[GI + 4].mode;
            shared_temp[GI].partition = shared_temp[GI + 4].partition;
            shared_temp[GI].rotation = shared_temp[GI + 4].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 2)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 2].error )
        {
            shared_temp[GI].error = shared_temp[GI + 2].error;
            shared_temp[GI].mode = shared_temp[GI + 2].mode;
            shared_temp[GI].partition = shared_temp[GI + 2].partition;
            shared_temp[GI].rotation = shared_temp[GI + 2].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 1)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 1].error )
        {
            shared_temp[GI].error = shared_temp[GI + 1].error;
            shared_temp[GI].mode = shared_temp[GI + 1].mode;
            shared_temp[GI].partition = shared_temp[GI + 1].partition;
            shared_temp[GI].rotation = shared_temp[GI + 1].rotation;
        }

        if (g_InBuff[blockID].x > shared_temp[GI].error)
        {
            g_OutBuff[blockID] = uint4(shared_temp[GI].error, shared_temp[GI].mode, shared_temp[GI].partition, shared_temp[GI].rotation); // mode 1 3 7 don't have rotation, we use rotation for p bits
        }
        else
        {
            g_OutBuff[blockID] = g_InBuff[blockID];
        }
    }
}

[numthreads( THREAD_GROUP_SIZE, 1, 1 )]
void TryMode02CS( uint GI : SV_GroupIndex, uint3 groupID : SV_GroupID ) // mode 0 2 have 3 subsets per block
{
    const uint MAX_USED_THREAD = 64;
    uint BLOCK_IN_GROUP = THREAD_GROUP_SIZE / MAX_USED_THREAD;
    uint blockInGroup = GI / MAX_USED_THREAD;
    uint blockID = g_start_block_id + groupID.x * BLOCK_IN_GROUP + blockInGroup;
    uint threadBase = blockInGroup * MAX_USED_THREAD;
    uint threadInBlock = GI - threadBase;

    uint block_y = blockID / g_num_block_x;
    uint block_x = blockID - block_y * g_num_block_x;
    uint base_x = block_x * BLOCK_SIZE_X;
    uint base_y = block_y * BLOCK_SIZE_Y;
    
    if (threadInBlock < 16)
    {
        shared_temp[GI].pixel = clamp(uint4(g_Input.Load( uint3( base_x + threadInBlock % 4, base_y + threadInBlock / 4, 0 ) ) * 255), 0, 255);
    }
    GroupMemoryBarrierWithGroupSync();

    shared_temp[GI].error = 0xFFFFFFFF;

    uint num_partitions;
    if (0 == g_mode_id)
    {
        num_partitions = 16;
    }
    else
    {
        num_partitions = 64;
    }

    uint4 pixel_r;
    uint2x4 endPoint[3];        // endPoint[0..1 for subset id][0..1 for low and high in the subset]
    uint2x4 endPointBackup[3];
    uint color_index[16];
    if (threadInBlock < num_partitions)
    {
        uint partition = threadInBlock + 64;

        endPoint[0][0] = MAX_UINT;
        endPoint[0][1] = MIN_UINT;
        endPoint[1][0] = MAX_UINT;
        endPoint[1][1] = MIN_UINT;
        endPoint[2][0] = MAX_UINT;
        endPoint[2][1] = MIN_UINT;
        uint bits2 = candidateSectionBit2[partition - 64];
        for ( uint i = 0; i < 16; i ++ )
        {
            uint4 pixel = shared_temp[threadBase + i].pixel;
            uint subset_index = ( bits2 >> ( i * 2 ) ) & 0x03;
            if ( subset_index == 2 )
            {
                endPoint[2][0] = min( endPoint[2][0], pixel );
                endPoint[2][1] = max( endPoint[2][1], pixel );
            }
            else if ( subset_index == 1 )
            {
                endPoint[1][0] = min( endPoint[1][0], pixel );
                endPoint[1][1] = max( endPoint[1][1], pixel );
            }
            else
            {
                endPoint[0][0] = min( endPoint[0][0], pixel );
                endPoint[0][1] = max( endPoint[0][1], pixel );
            }
        }

        endPointBackup[0] = endPoint[0];
        endPointBackup[1] = endPoint[1];
        endPointBackup[2] = endPoint[2];

        uint max_p;
        if (0 == g_mode_id)
        {
            max_p = 64; // changed from 32 to 64
        }
        else
        {
            max_p = 1;
        }

        uint rotation = 0;
        uint error = MAX_UINT;
        for ( uint p = 0; p < max_p; p ++ )
        {
            endPoint[0] = endPointBackup[0];
            endPoint[1] = endPointBackup[1];
            endPoint[2] = endPointBackup[2];

            for ( i = 0; i < 3; i ++ )
            {
                if (0 == g_mode_id)
                {
                    compress_endpoints0( endPoint[i], uint2(p >> (i * 2 + 0), p >> (i * 2 + 1)) & 1 );
                }
                else
                {
                    compress_endpoints2( endPoint[i] );
                }
            }

            uint step_selector = 1 + (2 == g_mode_id);

            int4 span[3];
            span[0] = endPoint[0][1] - endPoint[0][0];
            span[1] = endPoint[1][1] - endPoint[1][0];
            span[2] = endPoint[2][1] - endPoint[2][0];
            span[0].w = span[1].w = span[2].w = 0;
            int span_norm_sqr[3];
            span_norm_sqr[0] = dot( span[0], span[0] );
            span_norm_sqr[1] = dot( span[1], span[1] );
            span_norm_sqr[2] = dot( span[2], span[2] );

            // TODO: again, this shouldn't be necessary here in error calculation
            uint ci[3] = { 0, candidateFixUpIndex1D[partition].x, candidateFixUpIndex1D[partition].y };
            for (i = 0; i < 3; i ++)
            {
                int dotProduct = dot( span[i], shared_temp[threadBase + ci[i]].pixel - endPoint[i][0] );
                if ( span_norm_sqr[i] > 0 && dotProduct > 0 && uint( dotProduct * 63.49999 ) > uint( 32 * span_norm_sqr[i] ) )
                {
                    span[i] = -span[i];
                    swap(endPoint[i][0], endPoint[i][1]);
                }
            }

            uint p_error = 0;
            for ( i = 0; i < 16; i ++ )
            {
                uint subset_index = ( bits2 >> ( i * 2 ) ) & 0x03;
                if ( subset_index == 2 )
                {
                    int dotProduct = dot( span[2], shared_temp[threadBase + i].pixel - endPoint[2][0] );
                    color_index[i] = ( span_norm_sqr[2] <= 0 || dotProduct <= 0 ) ? 0
                        : ( ( dotProduct < span_norm_sqr[2] ) ? aStep[step_selector][ uint( dotProduct * 63.49999 / span_norm_sqr[2] ) ] : aStep[step_selector][63] );
                }
                else if ( subset_index == 1 )
                {
                    int dotProduct = dot( span[1], shared_temp[threadBase + i].pixel - endPoint[1][0] );
                    color_index[i] = ( span_norm_sqr[1] <= 0 || dotProduct <= 0 ) ? 0
                        : ( ( dotProduct < span_norm_sqr[1] ) ? aStep[step_selector][ uint( dotProduct * 63.49999 / span_norm_sqr[1] ) ] : aStep[step_selector][63] );
                }
                else
                {
                    int dotProduct = dot( span[0], shared_temp[threadBase + i].pixel - endPoint[0][0] );
                    color_index[i] = ( span_norm_sqr[0] <= 0 || dotProduct <= 0 ) ? 0
                        : ( ( dotProduct < span_norm_sqr[0] ) ? aStep[step_selector][ uint( dotProduct * 63.49999 / span_norm_sqr[0] ) ] : aStep[step_selector][63] );
                }

                pixel_r = ( ( 64 - aWeight[step_selector][color_index[i]] ) * endPoint[subset_index][0]
                    + aWeight[step_selector][color_index[i]] * endPoint[subset_index][1] + 32 ) >> 6;
                pixel_r.a = 255;

                uint4 pixel = shared_temp[threadBase + i].pixel;                
                Ensure_A_Is_Larger( pixel_r, pixel );
                pixel_r -= pixel;
                p_error += ComputeError(pixel_r, pixel_r);
            }

            if (p_error < error)
            {
                error = p_error;
                rotation = p;    // Borrow rotation for p
            }
        }

        shared_temp[GI].error = error;
        shared_temp[GI].partition = partition;
        shared_temp[GI].rotation = rotation;
    }
    GroupMemoryBarrierWithGroupSync();

    if (threadInBlock < 32)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 32].error )
        {
            shared_temp[GI].error = shared_temp[GI + 32].error;
            shared_temp[GI].partition = shared_temp[GI + 32].partition;
            shared_temp[GI].rotation = shared_temp[GI + 32].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 16)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 16].error )
        {
            shared_temp[GI].error = shared_temp[GI + 16].error;
            shared_temp[GI].partition = shared_temp[GI + 16].partition;
            shared_temp[GI].rotation = shared_temp[GI + 16].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 8)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 8].error )
        {
            shared_temp[GI].error = shared_temp[GI + 8].error;
            shared_temp[GI].partition = shared_temp[GI + 8].partition;
            shared_temp[GI].rotation = shared_temp[GI + 8].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 4)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 4].error )
        {
            shared_temp[GI].error = shared_temp[GI + 4].error;
            shared_temp[GI].partition = shared_temp[GI + 4].partition;
            shared_temp[GI].rotation = shared_temp[GI + 4].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 2)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 2].error )
        {
            shared_temp[GI].error = shared_temp[GI + 2].error;
            shared_temp[GI].partition = shared_temp[GI + 2].partition;
            shared_temp[GI].rotation = shared_temp[GI + 2].rotation;
        }
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif
    if (threadInBlock < 1)
    {
        if ( shared_temp[GI].error > shared_temp[GI + 1].error )
        {
            shared_temp[GI].error = shared_temp[GI + 1].error;
            shared_temp[GI].partition = shared_temp[GI + 1].partition;
            shared_temp[GI].rotation = shared_temp[GI + 1].rotation;
        }

        if (g_InBuff[blockID].x > shared_temp[GI].error)
        {
            g_OutBuff[blockID] = uint4(shared_temp[GI].error, g_mode_id, shared_temp[GI].partition, shared_temp[GI].rotation); // rotation is actually p bit for mode 0. for mode 2, rotation is always 0
        }
        else
        {
            g_OutBuff[blockID] = g_InBuff[blockID];
        }
    }
}

[numthreads( THREAD_GROUP_SIZE, 1, 1 )]
void EncodeBlockCS(uint GI : SV_GroupIndex, uint3 groupID : SV_GroupID)
{
    const uint MAX_USED_THREAD = 16;
    uint BLOCK_IN_GROUP = THREAD_GROUP_SIZE / MAX_USED_THREAD;
    uint blockInGroup = GI / MAX_USED_THREAD;
    uint blockID = g_start_block_id + groupID.x * BLOCK_IN_GROUP + blockInGroup;
    uint threadBase = blockInGroup * MAX_USED_THREAD;
    uint threadInBlock = GI - threadBase;

#ifndef REF_DEVICE
    if (blockID >= g_num_total_blocks)
    {
        return;
    }
#endif

    uint block_y = blockID / g_num_block_x;
    uint block_x = blockID - block_y * g_num_block_x;
    uint base_x = block_x * BLOCK_SIZE_X;
    uint base_y = block_y * BLOCK_SIZE_Y;

    uint mode = g_InBuff[blockID].y & 0x7FFFFFFF;
    uint partition = g_InBuff[blockID].z;
    uint index_selector = (g_InBuff[blockID].y >> 31) & 1;
    uint rotation = g_InBuff[blockID].w;

    if (threadInBlock < 16)
    {
        uint4 pixel = clamp(uint4(g_Input.Load( uint3( base_x + threadInBlock % 4, base_y + threadInBlock / 4, 0 ) ) * 255), 0, 255);

        if ((4 == mode) || (5 == mode))
        {
            if (1 == rotation)
            {
                pixel.ra = pixel.ar;
            }
            else if (2 == rotation)
            {
                pixel.ga = pixel.ag;
            }
            else if (3 == rotation)
            {
                pixel.ba = pixel.ab;
            }
        }

        shared_temp[GI].pixel = pixel;
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    uint bits = candidateSectionBit[partition];
    uint bits2 = candidateSectionBit2[partition - 64];

    uint2x4 ep;
    uint2x4 ep_quantized;
    [unroll]
    for (int ii = 2; ii >= 0; -- ii)
    {
        if (threadInBlock < 16)
        {
            uint2x4 ep;
            ep[0] = MAX_UINT;
            ep[1] = MIN_UINT;

            uint4 pixel = shared_temp[GI].pixel;

            uint subset_index = ( bits >> threadInBlock ) & 0x01;
            uint subset_index2 = ( bits2 >> ( threadInBlock * 2 ) ) & 0x03;
            if (0 == ii)
            {
                if ((0 == mode) || (2 == mode))
                {
                    if (0 == subset_index2)
                    {
                        ep[0] = ep[1] = pixel;
                    }
                }
                else if ((1 == mode) || (3 == mode) || (7 == mode))
                {
                    if (0 == subset_index)
                    {
                        ep[0] = ep[1] = pixel;
                    }
                }
                else if ((4 == mode) || (5 == mode) || (6 == mode))
                {
                    ep[0] = ep[1] = pixel;
                }
            }
            else if (1 == ii)
            {
                if ((0 == mode) || (2 == mode))
                {
                    if (1 == subset_index2)
                    {
                        ep[0] = ep[1] = pixel;
                    }
                }
                else if ((1 == mode) || (3 == mode) || (7 == mode))
                {
                    if (1 == subset_index)
                    {
                        ep[0] = ep[1] = pixel;
                    }
                }
            }
            else
            {
                if ((0 == mode) || (2 == mode))
                {
                    if (2 == subset_index2)
                    {
                        ep[0] = ep[1] = pixel;
                    }
                }
            }

            shared_temp[GI].endPoint_low = ep[0];
            shared_temp[GI].endPoint_high = ep[1];
        }
#ifdef REF_DEVICE
        GroupMemoryBarrierWithGroupSync();
#endif

        if (threadInBlock < 8)
        {
            shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 8].endPoint_low);
            shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 8].endPoint_high);
        }
#ifdef REF_DEVICE
        GroupMemoryBarrierWithGroupSync();
#endif
        if (threadInBlock < 4)
        {
            shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 4].endPoint_low);
            shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 4].endPoint_high);
        }
#ifdef REF_DEVICE
        GroupMemoryBarrierWithGroupSync();
#endif
        if (threadInBlock < 2)
        {
            shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 2].endPoint_low);
            shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 2].endPoint_high);
        }
#ifdef REF_DEVICE
        GroupMemoryBarrierWithGroupSync();
#endif
        if (threadInBlock < 1)
        {
            shared_temp[GI].endPoint_low = min(shared_temp[GI].endPoint_low, shared_temp[GI + 1].endPoint_low);
            shared_temp[GI].endPoint_high = max(shared_temp[GI].endPoint_high, shared_temp[GI + 1].endPoint_high);
        }
#ifdef REF_DEVICE
        GroupMemoryBarrierWithGroupSync();
#endif

        if (ii == (int)threadInBlock)
        {
            ep[0] = shared_temp[threadBase].endPoint_low;
            ep[1] = shared_temp[threadBase].endPoint_high;
        }
    }

    if (threadInBlock < 3)
    {
        uint2 P;
        if (1 == mode)
        {
            P = (rotation >> threadInBlock) & 1;
        }
        else
        {
            P = uint2(rotation >> (threadInBlock * 2 + 0), rotation >> (threadInBlock * 2 + 1)) & 1;
        }

        if (0 == mode)
        {
            ep_quantized = compress_endpoints0( ep, P );
        }
        else if (1 == mode)
        {
            ep_quantized = compress_endpoints1( ep, P );
        }
        else if (2 == mode)
        {
            ep_quantized = compress_endpoints2( ep );
        }
        else if (3 == mode)
        {
            ep_quantized = compress_endpoints3( ep, P );
        }
        else if (4 == mode)
        {
            ep_quantized = compress_endpoints4( ep );
        }
        else if (5 == mode)
        {
            ep_quantized = compress_endpoints5( ep );
        }
        else if (6 == mode)
        {
            ep_quantized = compress_endpoints6( ep, P );
        }
        else //if (7 == mode)
        {
            ep_quantized = compress_endpoints7( ep, P );
        }

        int4 span = ep[1] - ep[0];
        if (mode < 4)
        {
            span.w = 0;
        }

        if ((4 == mode) || (5 == mode))
        {
            if (0 == threadInBlock)
            {
                int2 span_norm_sqr = uint2( dot( span.rgb, span.rgb ), span.a * span.a );
                int2 dotProduct = int2( dot( span.rgb, shared_temp[threadBase + 0].pixel.rgb - ep[0].rgb ), span.a * ( shared_temp[threadBase + 0].pixel.a - ep[0].a ) );
                if ( span_norm_sqr.x > 0 && dotProduct.x > 0 && uint( dotProduct.x * 63.49999 ) > uint( 32 * span_norm_sqr.x ) )
                {
                    swap(ep[0].rgb, ep[1].rgb);
                    swap(ep_quantized[0].rgb, ep_quantized[1].rgb);
                }
                if ( span_norm_sqr.y > 0 && dotProduct.y > 0 && uint( dotProduct.y * 63.49999 ) > uint( 32 * span_norm_sqr.y ) )
                {
                    swap(ep[0].a, ep[1].a);
                    swap(ep_quantized[0].a, ep_quantized[1].a);		    
                }
            }
        }
        else //if ((0 == mode) || (2 == mode) || (1 == mode) || (3 == mode) || (7 == mode) || (6 == mode))
        {
            int p;
            if (0 == threadInBlock)
            {
                p = 0;
            }
            else if (1 == threadInBlock)
            {
                p = candidateFixUpIndex1D[partition].x;
            }
            else //if (2 == threadInBlock)
            {
                p = candidateFixUpIndex1D[partition].y;
            }

            int span_norm_sqr = dot( span, span );
            int dotProduct = dot( span, shared_temp[threadBase + p].pixel - ep[0] );
            if ( span_norm_sqr > 0 && dotProduct > 0 && uint( dotProduct * 63.49999 ) > uint( 32 * span_norm_sqr ) )
            {
                swap(ep[0], ep[1]);
                swap(ep_quantized[0], ep_quantized[1]);		
            }
        }

        shared_temp[GI].endPoint_low = ep[0];
        shared_temp[GI].endPoint_high = ep[1];
        shared_temp[GI].endPoint_low_quantized = ep_quantized[0];
        shared_temp[GI].endPoint_high_quantized = ep_quantized[1];
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    if (threadInBlock < 16)
    {
        uint color_index = 0;
        uint alpha_index = 0;

        uint2x4 ep;

        uint2 indexPrec;
        if ((0 == mode) || (1 == mode))
        {
            indexPrec = 1;
        }
        else if (6 == mode)
        {
            indexPrec = 0;
        }
        else if (4 == mode)
        {
            if (0 == index_selector)
            {
                indexPrec = uint2(2, 1);
            }
            else
            {
                indexPrec = uint2(1, 2);
            }
        }
        else
        {
            indexPrec = 2;
        }

        int subset_index;
        if ((0 == mode) || (2 == mode))
        {
            subset_index = (bits2 >> (threadInBlock * 2)) & 0x03;
        }
        else if ((1 == mode) || (3 == mode) || (7 == mode))
        {
            subset_index = (bits >> threadInBlock) & 0x01;
        }
        else
        {
            subset_index = 0;
        }

        ep[0] = shared_temp[threadBase + subset_index].endPoint_low;
        ep[1] = shared_temp[threadBase + subset_index].endPoint_high;

        int4 span = ep[1] - ep[0];
        if (mode < 4)
        {
            span.w = 0;
        }

        if ((4 == mode) || (5 == mode))
        {
            int2 span_norm_sqr;
            span_norm_sqr.x = dot( span.rgb, span.rgb );
            span_norm_sqr.y = span.a * span.a;
            
            int dotProduct = dot( span.rgb, shared_temp[threadBase + threadInBlock].pixel.rgb - ep[0].rgb );
            color_index = ( span_norm_sqr.x <= 0 || dotProduct <= 0 ) ? 0
                    : ( ( dotProduct < span_norm_sqr.x ) ? aStep[indexPrec.x][ uint( dotProduct * 63.49999 / span_norm_sqr.x ) ] : aStep[indexPrec.x][63] );
            dotProduct = dot( span.a, shared_temp[threadBase + threadInBlock].pixel.a - ep[0].a );
            alpha_index = ( span_norm_sqr.y <= 0 || dotProduct <= 0 ) ? 0
                    : ( ( dotProduct < span_norm_sqr.y ) ? aStep[indexPrec.y][ uint( dotProduct * 63.49999 / span_norm_sqr.y ) ] : aStep[indexPrec.y][63] );

            if (index_selector)
            {
                swap(color_index, alpha_index);
            }
        }
        else
        {
            int span_norm_sqr = dot( span, span );

            int dotProduct = dot( span, shared_temp[threadBase + threadInBlock].pixel - ep[0] );
            color_index = ( span_norm_sqr <= 0 || dotProduct <= 0 ) ? 0
                    : ( ( dotProduct < span_norm_sqr ) ? aStep[indexPrec.x][ uint( dotProduct * 63.49999 / span_norm_sqr ) ] : aStep[indexPrec.x][63] );
        }

        shared_temp[GI].error = color_index;
        shared_temp[GI].mode = alpha_index;
    }
#ifdef REF_DEVICE
    GroupMemoryBarrierWithGroupSync();
#endif

    if (0 == threadInBlock)
    {
        uint4 block;
        if (0 == mode)
        {
            block_package0( block, partition, threadBase );
        }
        else if (1 == mode)
        {
            block_package1( block, partition, threadBase );
        }
        else if (2 == mode)
        {
            block_package2( block, partition, threadBase );
        }
        else if (3 == mode)
        {
            block_package3( block, partition, threadBase );
        }
        else if (4 == mode)
        {
            block_package4( block, rotation, index_selector, threadBase );
        }
        else if (5 == mode)
        {
            block_package5( block, rotation, threadBase );
        }
        else if (6 == mode)
        {
            block_package6( block, threadBase );
        }
        else //if (7 == mode)
        {
            block_package7( block, partition, threadBase );
        }

        g_OutBuff[blockID] = block;
    }
}

//uint4 truncate_and_round( uint4 color, uint bits)
//{
//    uint precisionMask = ((1 << bits) - 1) << (8 - bits);
//    uint precisionHalf = (1 << (7-bits));
//
//    uint4 truncated = color & precisionMask; 
//    uint4 rounded = min(255, color + precisionHalf) & precisionMask;
//    
//    uint4 truncated_bak = truncated = truncated | (truncated >> bits);
//    uint4 rounded_bak = rounded = rounded | (rounded >> bits);
//
//    uint4 color_bak = color;
//    
//    Ensure_A_Is_Larger( rounded, color );
//    Ensure_A_Is_Larger( truncated, color_bak );
//
//    if (dot(rounded - color, rounded - color) < 
//        dot(truncated - color_bak, truncated - color_bak))
//    {
//        return rounded_bak;
//    }
//    else
//    {
//        return truncated_bak;
//    }
//}

uint4 quantize( uint4 color, uint uPrec )
{
    uint4 rnd = min(255, color + (1 << (7 - uPrec)));
    return rnd >> (8 - uPrec);
}

uint4 unquantize( uint4 color, uint uPrec )
{
    color = color << (8 - uPrec);
    return color | (color >> uPrec);
}

uint2x4 compress_endpoints0( inout uint2x4 endPoint, uint2 P )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = quantize(endPoint[j].rgbb, 5).rgb & 0xFFFFFFFE;
	    quantized[j].rgb |= P[j];
        quantized[j].a = 0xFF;

        endPoint[j].rgb = unquantize(quantized[j].rgbb, 5).rgb;
        endPoint[j].a = 0xFF;

        quantized[j] <<= 3;
    }
    return quantized;
}
uint2x4 compress_endpoints1( inout uint2x4 endPoint, uint2 P )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = quantize(endPoint[j].rgbb, 7).rgb & 0xFFFFFFFE;
	    quantized[j].rgb |= P[j];
        quantized[j].a = 0xFF;

        endPoint[j].rgb = unquantize(quantized[j].rgbb, 7).rgb;
	    endPoint[j].a = 0xFF;

        quantized[j] <<= 1;
    }
    return quantized;
}
uint2x4 compress_endpoints2( inout uint2x4 endPoint )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = quantize(endPoint[j].rgbb, 5).rgb;
        quantized[j].a = 0xFF;

        endPoint[j].rgb = unquantize(quantized[j].rgbb, 5).rgb;
	    endPoint[j].a = 0xFF;    

        quantized[j] <<= 3;
    }
    return quantized;
}
uint2x4 compress_endpoints3( inout uint2x4 endPoint, uint2 P )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = endPoint[j].rgb & 0xFFFFFFFE;
	    quantized[j].rgb |= P[j];
        quantized[j].a = 0xFF;
        
        endPoint[j].rgb = quantized[j].rgb;
        endPoint[j].a = 0xFF;
    }
    return quantized;
}
uint2x4 compress_endpoints4( inout uint2x4 endPoint )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = quantize(endPoint[j].rgbb, 5).rgb;
        quantized[j].a = quantize(endPoint[j].a, 6).r;
        
        endPoint[j].rgb = unquantize(quantized[j].rgbb, 5).rgb;        
        endPoint[j].a = unquantize(quantized[j].a, 6).r;

        quantized[j].rgb <<= 3;
        quantized[j].a <<= 2;
    }    
    return quantized;
}
uint2x4 compress_endpoints5( inout uint2x4 endPoint )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j].rgb = quantize(endPoint[j].rgbb, 7).rgb;
        quantized[j].a = endPoint[j].a;

        endPoint[j].rgb = unquantize(quantized[j].rgbb, 7).rgb;
        // endPoint[j].a   Alpha is full precision

        quantized[j].rgb <<= 1;
    }    
    return quantized;
}
uint2x4 compress_endpoints6( inout uint2x4 endPoint, uint2 P )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j] = endPoint[j] & 0xFFFFFFFE;
	    quantized[j] |= P[j];
	        
        endPoint[j] = quantized[j];
    }
    return quantized;
}
uint2x4 compress_endpoints7( inout uint2x4 endPoint, uint2 P )
{
    uint2x4 quantized;
    for ( uint j = 0; j < 2; j ++ )
    {
        quantized[j] = quantize(endPoint[j], 6) & 0xFFFFFFFE;
	    quantized[j] |= P[j];

        endPoint[j] = unquantize(quantized[j], 6);
    }
    return quantized << 2;
}

#define get_end_point_l(subset) shared_temp[threadBase + subset].endPoint_low_quantized
#define get_end_point_h(subset) shared_temp[threadBase + subset].endPoint_high_quantized
#define get_color_index(index) shared_temp[threadBase + index].error
#define get_alpha_index(index) shared_temp[threadBase + index].mode

void block_package0( out uint4 block, uint partition, uint threadBase )
{
    block.x = 0x01 | ( (partition - 64) << 1 ) 
            | ( ( get_end_point_l(0).r & 0xF0 ) <<  1 ) | ( ( get_end_point_h(0).r & 0xF0 ) <<  5 ) 
            | ( ( get_end_point_l(1).r & 0xF0 ) <<  9 ) | ( ( get_end_point_h(1).r & 0xF0 ) << 13 ) 
            | ( ( get_end_point_l(2).r & 0xF0 ) << 17 ) | ( ( get_end_point_h(2).r & 0xF0 ) << 21 ) 
            | ( ( get_end_point_l(0).g & 0xF0 ) << 25 );
    block.y = ( ( get_end_point_l(0).g & 0xF0 ) >>  7 ) | ( ( get_end_point_h(0).g & 0xF0 ) >>  3 ) 
            | ( ( get_end_point_l(1).g & 0xF0 ) <<  1 ) | ( ( get_end_point_h(1).g & 0xF0 ) <<  5 ) 
            | ( ( get_end_point_l(2).g & 0xF0 ) <<  9 ) | ( ( get_end_point_h(2).g & 0xF0 ) << 13 ) 
            | ( ( get_end_point_l(0).b & 0xF0 ) << 17 ) | ( ( get_end_point_h(0).b & 0xF0 ) << 21 )
            | ( ( get_end_point_l(1).b & 0xF0 ) << 25 );
    block.z = ( ( get_end_point_l(1).b & 0xF0 ) >>  7 ) | ( ( get_end_point_h(1).b & 0xF0 ) >>  3 ) 
            | ( ( get_end_point_l(2).b & 0xF0 ) <<  1 ) | ( ( get_end_point_h(2).b & 0xF0 ) <<  5 ) 
            | ( ( get_end_point_l(0).r & 0x08 ) << 10 ) | ( ( get_end_point_h(0).r & 0x08 ) << 11 ) 
            | ( ( get_end_point_l(1).r & 0x08 ) << 12 ) | ( ( get_end_point_h(1).r & 0x08 ) << 13 ) 
            | ( ( get_end_point_l(2).r & 0x08 ) << 14 ) | ( ( get_end_point_h(2).r & 0x08 ) << 15 )
            | ( get_color_index(0) << 19 );
    block.w = 0;
    uint i = 1;
    for ( ; i <= min( candidateFixUpIndex1DOrdered[partition][0], 4 ); i ++ )
    {
        block.z |= get_color_index(i) << ( i * 3 + 18 );
    }
    if ( candidateFixUpIndex1DOrdered[partition][0] < 4 ) //i = 4
    {
        block.z |= get_color_index(4) << 29;
        i += 1;
    }
    else //i = 5
    {
        block.w |= ( get_color_index(4) & 0x04 ) >> 2;
        for ( ; i <= candidateFixUpIndex1DOrdered[partition][0]; i ++ )
            block.w |= get_color_index(i) << ( i * 3 - 14 );
    }
    for ( ; i <= candidateFixUpIndex1DOrdered[partition][1]; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 3 - 15 );
    }
    for ( ; i < 16; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 3 - 16 );
    }
}
void block_package1( out uint4 block, uint partition, uint threadBase )
{
    block.x = 0x02 | ( partition << 2 ) 
            | ( ( get_end_point_l(0).r & 0xFC ) <<  6 ) | ( ( get_end_point_h(0).r & 0xFC ) << 12 ) 
            | ( ( get_end_point_l(1).r & 0xFC ) << 18 ) | ( ( get_end_point_h(1).r & 0xFC ) << 24 );
    block.y = ( ( get_end_point_l(0).g & 0xFC ) >>  2 ) | ( ( get_end_point_h(0).g & 0xFC ) <<  4 ) 
            | ( ( get_end_point_l(1).g & 0xFC ) << 10 ) | ( ( get_end_point_h(1).g & 0xFC ) << 16 )
            | ( ( get_end_point_l(0).b & 0xFC ) << 22 ) | ( ( get_end_point_h(0).b & 0xFC ) << 28 );
    block.z = ( ( get_end_point_h(0).b & 0xFC ) >>  4 ) | ( ( get_end_point_l(1).b & 0xFC ) <<  2 )
            | ( ( get_end_point_h(1).b & 0xFC ) <<  8 ) 
            | ( ( get_end_point_l(0).r & 0x02 ) << 15 ) | ( ( get_end_point_l(1).r & 0x02 ) << 16 )
            | ( get_color_index(0) << 18 );
    if ( candidateFixUpIndex1DOrdered[partition][0] == 15 )
    {
        block.w = (get_color_index(15) << 30) | (get_color_index(14) << 27) | (get_color_index(13) << 24) | (get_color_index(12) << 21) | (get_color_index(11) << 18) | (get_color_index(10) << 15)
            | (get_color_index(9) << 12) | (get_color_index(8) << 9) | (get_color_index(7) << 6) | (get_color_index(6) << 3) | get_color_index(5);
        block.z |= (get_color_index(4) << 29) | (get_color_index(3) << 26) | (get_color_index(2) << 23) | (get_color_index(1) << 20) | (get_color_index(0) << 18);
    }
    else if ( candidateFixUpIndex1DOrdered[partition][0] == 2 )
    {
        block.w = (get_color_index(15) << 29) | (get_color_index(14) << 26) | (get_color_index(13) << 23) | (get_color_index(12) << 20) | (get_color_index(11) << 17) | (get_color_index(10) << 14)
            | (get_color_index(9) << 11) | (get_color_index(8) << 8) | (get_color_index(7) << 5) | (get_color_index(6) << 2) | (get_color_index(5) >> 1);
        block.z |= (get_color_index(5) << 31) | (get_color_index(4) << 28) | (get_color_index(3) << 25) | (get_color_index(2) << 23) | (get_color_index(1) << 20) | (get_color_index(0) << 18);
    }
    else if ( candidateFixUpIndex1DOrdered[partition][0] == 8 )
    {
        block.w = (get_color_index(15) << 29) | (get_color_index(14) << 26) | (get_color_index(13) << 23) | (get_color_index(12) << 20) | (get_color_index(11) << 17) | (get_color_index(10) << 14)
            | (get_color_index(9) << 11) | (get_color_index(8) << 9) | (get_color_index(7) << 6) | (get_color_index(6) << 3) | get_color_index(5);
        block.z |= (get_color_index(4) << 29) | (get_color_index(3) << 26) | (get_color_index(2) << 23) | (get_color_index(1) << 20) | (get_color_index(0) << 18);
    }
    else //candidateFixUpIndex1DOrdered[partition] == 6
    {
        block.w = (get_color_index(15) << 29) | (get_color_index(14) << 26) | (get_color_index(13) << 23) | (get_color_index(12) << 20) | (get_color_index(11) << 17) | (get_color_index(10) << 14)
            | (get_color_index(9) << 11) | (get_color_index(8) << 8) | (get_color_index(7) << 6) | (get_color_index(6) << 4) | get_color_index(5);
        block.z |= (get_color_index(4) << 29) | (get_color_index(3) << 26) | (get_color_index(2) << 23) | (get_color_index(1) << 20) | (get_color_index(0) << 18);
    }
}
void block_package2( out uint4 block, uint partition, uint threadBase )
{
    block.x = 0x04 | ( (partition - 64) << 3 ) 
            | ( ( get_end_point_l(0).r & 0xF8 ) <<  6 ) | ( ( get_end_point_h(0).r & 0xF8 ) << 11 ) 
            | ( ( get_end_point_l(1).r & 0xF8 ) << 16 ) | ( ( get_end_point_h(1).r & 0xF8 ) << 21 ) 
            | ( ( get_end_point_l(2).r & 0xF8 ) << 26 );
    block.y = ( ( get_end_point_l(2).r & 0xF8 ) >>  6 ) | ( ( get_end_point_h(2).r & 0xF8 ) >>  1 )
            | ( ( get_end_point_l(0).g & 0xF8 ) <<  4 ) | ( ( get_end_point_h(0).g & 0xF8 ) <<  9 ) 
            | ( ( get_end_point_l(1).g & 0xF8 ) << 14 ) | ( ( get_end_point_h(1).g & 0xF8 ) << 19 ) 
            | ( ( get_end_point_l(2).g & 0xF8 ) << 24 );
    block.z = ( ( get_end_point_h(2).g & 0xF8 ) >>  3 ) | ( ( get_end_point_l(0).b & 0xF8 ) <<  2 )
            | ( ( get_end_point_h(0).b & 0xF8 ) <<  7 )	| ( ( get_end_point_l(1).b & 0xF8 ) << 12 )
            | ( ( get_end_point_h(1).b & 0xF8 ) << 17 ) | ( ( get_end_point_l(2).b & 0xF8 ) << 22 ) 
            | ( ( get_end_point_h(2).b & 0xF8 ) << 27 );
    block.w = ( ( get_end_point_h(2).b & 0xF8 ) >>  5 ) 
            | ( get_color_index(0) << 3 );
    uint i = 1;
    for ( ; i <= candidateFixUpIndex1DOrdered[partition][0]; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 + 2 );
    }
    for ( ; i <= candidateFixUpIndex1DOrdered[partition][1]; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 + 1 );
    }
    for ( ; i < 16; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 );
    }
}
void block_package3( out uint4 block, uint partition, uint threadBase )
{
    block.x = 0x08 | ( partition << 4 ) 
            | ( ( get_end_point_l(0).r & 0xFE ) <<  9 ) | ( ( get_end_point_h(0).r & 0xFE ) << 16 ) 
            | ( ( get_end_point_l(1).r & 0xFE ) << 23 ) | ( ( get_end_point_h(1).r & 0xFE ) << 30 );
    block.y = ( ( get_end_point_h(1).r & 0xFE ) >>  2 ) | ( ( get_end_point_l(0).g & 0xFE ) <<  5 )
            | ( ( get_end_point_h(0).g & 0xFE ) << 12 ) | ( ( get_end_point_l(1).g & 0xFE ) << 19 )
            | ( ( get_end_point_h(1).g & 0xFE ) << 26 );
    block.z = ( ( get_end_point_h(1).g & 0xFE ) >>  6 ) | ( ( get_end_point_l(0).b & 0xFE ) <<  1 )
            | ( ( get_end_point_h(0).b & 0xFE ) <<  8 ) | ( ( get_end_point_l(1).b & 0xFE ) << 15 )
            | ( ( get_end_point_h(1).b & 0xFE ) << 22 )
            | ( ( get_end_point_l(0).r & 0x01 ) << 30 ) | ( ( get_end_point_h(0).r & 0x01 ) << 31 );
    block.w = ( ( get_end_point_l(1).r & 0x01 ) <<  0 ) | ( ( get_end_point_h(1).r & 0x01 ) <<  1 )
            | ( get_color_index(0) << 2 );
    uint i = 1;
    for ( ; i <= candidateFixUpIndex1DOrdered[partition][0]; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 + 1 );
    }
    for ( ; i < 16; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 );
    }
}
void block_package4( out uint4 block, uint rotation, uint index_selector, uint threadBase )
{
    block.x = 0x10 | ( (rotation & 3) << 5 ) | ( (index_selector & 1) << 7 )
            | ( ( get_end_point_l(0).r & 0xF8 ) <<  5 ) | ( ( get_end_point_h(0).r & 0xF8 ) << 10 )
            | ( ( get_end_point_l(0).g & 0xF8 ) << 15 ) | ( ( get_end_point_h(0).g & 0xF8 ) << 20 )
            | ( ( get_end_point_l(0).b & 0xF8 ) << 25 );

    block.y = ( ( get_end_point_l(0).b & 0xF8 ) >>  7 ) | ( ( get_end_point_h(0).b & 0xF8 ) >>  2 )
            | ( ( get_end_point_l(0).a & 0xFC ) <<  4 ) | ( ( get_end_point_h(0).a & 0xFC ) << 10 )
            | ( (get_color_index(0) & 1) << 18 ) | ( get_color_index(1) << 19 ) | ( get_color_index(2) << 21 ) | ( get_color_index(3) << 23 ) 
            | ( get_color_index(4) << 25 ) | ( get_color_index(5) << 27 ) | ( get_color_index(6) << 29 ) | ( get_color_index(7) << 31 );

    block.z = ( get_color_index(7) >>  1 ) | ( get_color_index(8) <<  1 ) | ( get_color_index(9) <<  3 ) | ( get_color_index(10)<<  5 )
            | ( get_color_index(11)<<  7 ) | ( get_color_index(12)<<  9 ) | ( get_color_index(13)<< 11 ) | ( get_color_index(14)<< 13 )
            | ( get_color_index(15)<< 15 ) | ( (get_alpha_index(0) & 3) << 17 ) | ( get_alpha_index(1) << 19 ) | ( get_alpha_index(2) << 22 )
            | ( get_alpha_index(3) << 25 ) | ( get_alpha_index(4) << 28 ) | ( get_alpha_index(5) << 31 );

    block.w = ( get_alpha_index(5) >>  1 ) | ( get_alpha_index(6) <<  2 ) | ( get_alpha_index(7) <<  5 ) | ( get_alpha_index(8) <<  8 ) 
            | ( get_alpha_index(9) << 11 ) | ( get_alpha_index(10)<< 14 ) | ( get_alpha_index(11)<< 17 ) | ( get_alpha_index(12)<< 20 ) 
            | ( get_alpha_index(13)<< 23 ) | ( get_alpha_index(14)<< 26 ) | ( get_alpha_index(15)<< 29 );
}
void block_package5( out uint4 block, uint rotation, uint threadBase )
{
    block.x = 0x20 | ( rotation << 6 )
            | ( ( get_end_point_l(0).r & 0xFE ) <<  7 ) | ( ( get_end_point_h(0).r & 0xFE ) << 14 )
            | ( ( get_end_point_l(0).g & 0xFE ) << 21 ) | ( ( get_end_point_h(0).g & 0xFE ) << 28 );
    block.y = ( ( get_end_point_h(0).g & 0xFE ) >>  4 ) | ( ( get_end_point_l(0).b & 0xFE ) <<  3 )
            | ( ( get_end_point_h(0).b & 0xFE ) << 10 )	| ( get_end_point_l(0).a << 18 ) | ( get_end_point_h(0).a << 26 );
    block.z = ( get_end_point_h(0).a >>  6 )
            | ( get_color_index(0) <<  2 ) | ( get_color_index(1) <<  3 ) | ( get_color_index(2) <<  5 ) | ( get_color_index(3) <<  7 ) 
            | ( get_color_index(4) <<  9 ) | ( get_color_index(5) << 11 ) | ( get_color_index(6) << 13 ) | ( get_color_index(7) << 15 )
            | ( get_color_index(8) << 17 ) | ( get_color_index(9) << 19 ) | ( get_color_index(10)<< 21 ) | ( get_color_index(11)<< 23 ) 
            | ( get_color_index(12)<< 25 ) | ( get_color_index(13)<< 27 ) | ( get_color_index(14)<< 29 ) | ( get_color_index(15)<< 31 );
    block.w =  ( get_color_index(15)>> 1 ) | ( get_alpha_index(0) <<  1 ) | ( get_alpha_index(1) <<  2 ) | ( get_alpha_index(2) <<  4 )
            | ( get_alpha_index(3) <<  6 ) | ( get_alpha_index(4) <<  8 ) | ( get_alpha_index(5) << 10 ) | ( get_alpha_index(6) << 12 )
            | ( get_alpha_index(7) << 14 ) | ( get_alpha_index(8) << 16 ) | ( get_alpha_index(9) << 18 ) | ( get_alpha_index(10)<< 20 ) 
            | ( get_alpha_index(11)<< 22 ) | ( get_alpha_index(12)<< 24 ) | ( get_alpha_index(13)<< 26 ) | ( get_alpha_index(14)<< 28 )
            | ( get_alpha_index(15)<< 30 );
}
void block_package6( out uint4 block, uint threadBase )
{
    block.x = 0x40
            | ( ( get_end_point_l(0).r & 0xFE ) <<  6 ) | ( ( get_end_point_h(0).r & 0xFE ) << 13 )
            | ( ( get_end_point_l(0).g & 0xFE ) << 20 ) | ( ( get_end_point_h(0).g & 0xFE ) << 27 );
    block.y = ( ( get_end_point_h(0).g & 0xFE ) >>  5 ) | ( ( get_end_point_l(0).b & 0xFE ) <<  2 )
            | ( ( get_end_point_h(0).b & 0xFE ) <<  9 )	| ( ( get_end_point_l(0).a & 0xFE ) << 16 )
            | ( ( get_end_point_h(0).a & 0xFE ) << 23 )
            | ( get_end_point_l(0).r & 0x01 ) << 31;
    block.z = ( get_end_point_h(0).r & 0x01 )
            | ( get_color_index(0) <<  1 ) | ( get_color_index(1) <<  4 ) | ( get_color_index(2) <<  8 ) | ( get_color_index(3) << 12 ) 
            | ( get_color_index(4) << 16 ) | ( get_color_index(5) << 20 ) | ( get_color_index(6) << 24 ) | ( get_color_index(7) << 28 );
    block.w = ( get_color_index(8) <<  0 ) | ( get_color_index(9) <<  4 ) | ( get_color_index(10)<<  8 ) | ( get_color_index(11)<< 12 ) 
            | ( get_color_index(12)<< 16 ) | ( get_color_index(13)<< 20 ) | ( get_color_index(14)<< 24 ) | ( get_color_index(15)<< 28 );
}
void block_package7( out uint4 block, uint partition, uint threadBase )
{
    block.x = 0x80 | ( partition << 8 ) 
            | ( ( get_end_point_l(0).r & 0xF8 ) << 11 ) | ( ( get_end_point_h(0).r & 0xF8 ) << 16 ) 
            | ( ( get_end_point_l(1).r & 0xF8 ) << 21 ) | ( ( get_end_point_h(1).r & 0xF8 ) << 26 );
    block.y = ( ( get_end_point_h(1).r & 0xF8 ) >>  6 ) | ( ( get_end_point_l(0).g & 0xF8 ) >>  1 )
            | ( ( get_end_point_h(0).g & 0xF8 ) <<  4 ) | ( ( get_end_point_l(1).g & 0xF8 ) <<  9 ) 
            | ( ( get_end_point_h(1).g & 0xF8 ) << 14 )	| ( ( get_end_point_l(0).b & 0xF8 ) << 19 ) 
            | ( ( get_end_point_h(0).b & 0xF8 ) << 24 );
    block.z = ( ( get_end_point_l(1).b & 0xF8 ) >>  3 )	| ( ( get_end_point_h(1).b & 0xF8 ) <<  2 ) 
            | ( ( get_end_point_l(0).a & 0xF8 ) <<  7 ) | ( ( get_end_point_h(0).a & 0xF8 ) << 12 ) 
            | ( ( get_end_point_l(1).a & 0xF8 ) << 17 ) | ( ( get_end_point_h(1).a & 0xF8 ) << 22 ) 
            | ( ( get_end_point_l(0).r & 0x04 ) << 28 ) | ( ( get_end_point_h(0).r & 0x04 ) << 29 );
    block.w = ( ( get_end_point_l(1).r & 0x04 ) >>  2 ) | ( ( get_end_point_h(1).r & 0x04 ) >>  1 )
            | ( get_color_index(0) <<  2 );
    uint i = 1;
    for ( ; i <= candidateFixUpIndex1DOrdered[partition][0]; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 + 1 );
    }
    for ( ; i < 16; i ++ )
    {
        block.w |= get_color_index(i) << ( i * 2 );
    }
}