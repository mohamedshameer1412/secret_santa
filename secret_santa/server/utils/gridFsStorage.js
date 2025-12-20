const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

let bucket;

const initGridFS = () => {
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, {
        bucketName: 'chatFiles'
    });
    console.log('GridFS initialized for file storage...');
    return bucket;
};

const uploadToGridFS = (fileBuffer, filename, metadata = {}) => {
    return new Promise((resolve, reject) => {
        if (!bucket) {
            bucket = initGridFS();
        }

        const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
                ...metadata,
                uploadDate: new Date()
            }
        });

        uploadStream.on('error', (error) => {
            console.error('GridFS Upload Error:', error);
            reject(error);
        });
        
        uploadStream.on('finish', (file) => {
            console.log('GridFS Upload Finished:', {
                streamId: uploadStream.id,
                filename: uploadStream.filename,
                file: file
            });
            
            // uploadStream.id contains the GridFS file _id
            resolve({
                fileId: uploadStream.id,
                filename: uploadStream.filename || filename,
                uploadDate: new Date()
            });
        });

        uploadStream.end(fileBuffer);
    });
};

const downloadFromGridFS = (fileId) => {
    return new Promise((resolve, reject) => {
        if (!bucket) {
            bucket = initGridFS();
        }

        const chunks = [];
        const downloadStream = bucket.openDownloadStream(mongoose.Types.ObjectId(fileId));

        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
    });
};

const deleteFromGridFS = (fileId) => {
    return new Promise((resolve, reject) => {
        if (!bucket) {
            bucket = initGridFS();
        }

        bucket.delete(new mongoose.Types.ObjectId(String(fileId)), (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

const getFileStream = (fileId) => {
    if (!bucket) {
        bucket = initGridFS();
    }
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(String(fileId)));
};

module.exports = {
    initGridFS,
    uploadToGridFS,
    downloadFromGridFS,
    deleteFromGridFS,
    getFileStream
};