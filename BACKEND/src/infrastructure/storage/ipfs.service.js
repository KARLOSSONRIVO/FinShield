import { PINATA_JWT, PINATA_API_URL } from '../../config/env.js';
import AppError from '../../common/errors/AppErrors.js';
import FormData from 'form-data';

/**
 * Uploads a file buffer to Pinata IPFS and pins it.
 * Uses Pinata's pinFileToIPFS API endpoint.
 * 
 * @param {Object} params
 * @param {Buffer} params.buffer - The file buffer to upload
 * @param {string} [params.fileName] - Optional filename for the upload
 * @returns {Promise<{cid: string, size: number}>}
 */
export async function addAndPinBuffer({ buffer, fileName = 'file' }) {
    if (!buffer?.length) throw new AppError("File buffer is empty", 400, "EMPTY_FILE")

    try {
        const formData = new FormData()
        
        // Add file to form data
        formData.append('file', buffer, {
            filename: fileName,
            contentType: 'application/octet-stream',
        })

        // Optional: Add pinata metadata
        const pinataMetadata = JSON.stringify({
            name: fileName,
        })
        formData.append('pinataMetadata', pinataMetadata)

        // Optional: Add pinata options (CIDv1)
        const pinataOptions = JSON.stringify({
            cidVersion: 1,
        })
        formData.append('pinataOptions', pinataOptions)

        // Use dynamic import for node-fetch if needed, or use native fetch with proper headers
        const response = await new Promise((resolve, reject) => {
            formData.submit({
                protocol: 'https:',
                host: 'api.pinata.cloud',
                path: '/pinning/pinFileToIPFS',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                },
            }, (err, res) => {
                if (err) return reject(err)
                
                let data = ''
                res.on('data', chunk => data += chunk)
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        text: () => Promise.resolve(data),
                        json: () => Promise.resolve(JSON.parse(data)),
                    })
                })
                res.on('error', reject)
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new AppError(`Pinata upload failed: ${error}`, 500, "PINATA_UPLOAD_FAILED")
        }

        const result = await response.json()

        return {
            cid: result.IpfsHash,
            size: Number(result.PinSize || 0),
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError(`IPFS upload failed: ${error.message}`, 500, "IPFS_UPLOAD_FAILED")
    }
}

/**
 * Unpins a file from Pinata by CID.
 * 
 * @param {string} cid - The CID to unpin
 * @returns {Promise<{success: boolean}>}
 */
export async function unpinByCid(cid) {
    if (!cid) throw new AppError("CID is required", 400, "MISSING_CID")

    try {
        const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
        })

        if (!response.ok) {
            const error = await response.text()
            throw new AppError(`Pinata unpin failed: ${error}`, 500, "PINATA_UNPIN_FAILED")
        }

        return { success: true }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError(`IPFS unpin failed: ${error.message}`, 500, "IPFS_UNPIN_FAILED")
    }
}

/**
 * Get pin status/details from Pinata by CID.
 * 
 * @param {string} cid - The CID to check
 * @returns {Promise<Object>}
 */
export async function getPinStatus(cid) {
    if (!cid) throw new AppError("CID is required", 400, "MISSING_CID")

    try {
        const response = await fetch(`${PINATA_API_URL}/pinning/pinJobs?ipfs_pin_hash=${cid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
        })

        if (!response.ok) {
            const error = await response.text()
            throw new AppError(`Pinata status check failed: ${error}`, 500, "PINATA_STATUS_FAILED")
        }

        return await response.json()
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError(`IPFS status check failed: ${error.message}`, 500, "IPFS_STATUS_FAILED")
    }
}