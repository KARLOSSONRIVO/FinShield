import { create } from 'ipfs-http-client';
import { IPFS_API_URL } from '../../config/env.js';
import AppError from '../../common/errors/AppErrors.js';

const ipfs = create({ url: IPFS_API_URL });

/**
 * Adds bytes to your local IPFS node and pins it.
 * - add(): stores blocks on your node and returns a CID
 * - pin:true: ensures your node keeps the data (not garbage collected)
 */


export async function addAndPinBuffer({ buffer }){
    if(!buffer?.length) throw new AppError("File buffer is empty",400, "EMPTH File")
    
    const result = await ipfs.add(
        { content: buffer },
        {
            pin: true,
            cidVersion:1,
            wrapWithDirectory:false,
        }
    )

    return{
        cid: result.cid.toString(),
        size: Number (result.size || 0)
    }
}