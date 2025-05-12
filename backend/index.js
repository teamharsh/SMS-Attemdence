const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const methodOverride = require('method-override');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Import Grid
const Grid = require('gridfs-stream');

// Import GridFSBucket
const { GridFSBucket } = mongoose.mongo;

const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(express.json({ limit: '30mb' }));
app.use(cors());
app.use(methodOverride('_method'));

// Serve static files from uploads directory if it exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a global GridFS instance
global.gfs = null;
global.gridFSBucket = null;

// Create a function to initialize GridFS
const initializeGridFS = async (db) => {
    console.log('Initializing GridFS...');
    
    try {
        // Check if GridFS collections exist
        const collections = await db.listCollections({ name: /uploads/ }).toArray();
        console.log('Existing GridFS collections:', collections.map(c => c.name).join(', ') || 'none');
        
        // Create Grid stream instance for metadata access
        const gfs = Grid(db, mongoose.mongo);
        gfs.collection('uploads'); // Set the collection for GridFS operations
        
        // Create GridFSBucket for file operations
        const gridFSBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        
        // Make GridFS instances available globally
        global.gfs = gfs;
        global.gridFSBucket = gridFSBucket;
        
        // Also set on app
        app.set('gridfs', gfs);
        app.set('gridFSBucket', gridFSBucket);
        
        console.log("GridFS initialized with collection: uploads");
        
        // If GridFS collections don't exist, create a test file to initialize them
        if (!collections.some(c => c.name === 'uploads.files')) {
            console.log('GridFS collections missing, creating test file to initialize...');
            
            // Create a buffer with test content
            const testBuffer = Buffer.from('This is a temporary file to initialize GridFS collections');
            
            // Upload the buffer to GridFS using GridFSBucket (more reliable)
            const uploadStream = gridFSBucket.openUploadStream('gridfs-init-file.txt', {
                metadata: { purpose: 'initialization' }
            });
            
            // Write to the stream and handle events
            uploadStream.end(testBuffer);
            
            // Wait for file to be written
            await new Promise((resolve, reject) => {
                uploadStream.on('finish', () => {
                    console.log('GridFS collections initialized successfully with test file');
                    resolve();
                });
                uploadStream.on('error', (error) => {
                    console.error('Error initializing GridFS with test file:', error);
                    reject(error);
                });
            });
        }
        
        return { gfs, gridFSBucket };
    } catch (error) {
        console.error('Error initializing GridFS:', error);
        throw error;
    }
};

// MongoDB Connection with GridFS setup
mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(async () => {
        console.log("🎉 Connected to MongoDB successfully 🎉");
        
        const conn = mongoose.connection;
        
        // Wait for MongoDB connection to be fully open
        if (conn.readyState !== 1) {
            await new Promise(resolve => conn.once('open', resolve));
        }
        
        // Initialize GridFS after connection is open
        try {
            await initializeGridFS(conn.db);
            console.log("GridFS initialization completed successfully");
            
            // Add a debug endpoint to check MongoDB collections
            app.get('/api/debug/mongodb-collections', async (req, res) => {
                try {
                    const collections = await conn.db.listCollections().toArray();
                    res.json({ 
                        collections: collections.map(c => c.name),
                        database: conn.db.databaseName
                    });
                } catch (err) {
                    res.status(500).json({ error: err.message });
                }
            });
            
            // Debug route to check GridFS status
            app.get('/api/gridfs-status', async (req, res) => {
                try {
                    const gfs = global.gfs;
                    
                    if (!gfs) {
                        return res.status(503).json({ 
                            status: 'GridFS not initialized',
                            mongooseConnected: mongoose.connection.readyState === 1
                        });
                    }
                    
                    const files = await gfs.files.find().toArray();
                    
                    res.json({
                        status: 'GridFS operational',
                        files: (files || []).map(f => ({
                            id: f._id,
                            filename: f.filename,
                            contentType: f.contentType,
                            uploadDate: f.uploadDate
                        })),
                        collectionName: 'uploads'
                    });
                } catch (err) {
                    console.error('Error checking GridFS status:', err);
                    res.status(500).json({ error: err.message });
                }
            });
            
            // Route to force GridFS reinitialization
            app.post('/api/reinitialize-gridfs', async (req, res) => {
                try {
                    const result = await initializeGridFS(conn.db);
                    res.json({ 
                        message: 'GridFS reinitialized successfully',
                        gridfs: !!result.gfs,
                        bucket: !!result.gridFSBucket
                    });
                } catch (err) {
                    console.error('Error reinitializing GridFS:', err);
                    res.status(500).json({ error: err.message });
                }
            });
            
            // Now that GridFS is ready, register routes
            const Routes = require("./routes/route.js");
            app.use('/', Routes);
            
            // Start the server only after GridFS is initialized
            app.listen(PORT, () => {
                console.log(`🚀 Server started at port no. ${PORT} 🚀`);
            });
            
        } catch (error) {
            console.error("Failed to initialize GridFS:", error);
            // Continue without GridFS - some basic functionality might still work
            const Routes = require("./routes/route.js");
            app.use('/', Routes);
            
            app.listen(PORT, () => {
                console.log(`🚀 Server started at port no. ${PORT} (WITHOUT GridFS) 🚀`);
            });
        }
    })
    .catch((error) => {
        console.log("❌ Failed to connect to MongoDB ❌", error.message);
    });