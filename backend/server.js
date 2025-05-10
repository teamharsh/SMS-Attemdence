const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const methodOverride = require('method-override');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const app = express();
const crypto = require('crypto');
const fs = require('fs');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';

// Create GridFS storage engine (defining this first to ensure it's ready before routes are registered)
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                console.log(`Creating file entry in GridFS: ${filename}`);
                
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                    metadata: {
                        originalName: file.originalname,
                        contentType: file.mimetype,
                        uploadDate: new Date()
                    }
                };
                resolve(fileInfo);
            });
        });
    }
});

// Add storage event listeners
storage.on('connection', () => {
    console.log('✅ GridFS Storage connected successfully');
});

storage.on('connectionFailed', (err) => {
    console.error('❌ GridFS Storage connection failed:', err);
});

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('🎉 MongoDB Connected 🎉');
    
    // Initialize GridFS after successful MongoDB connection
    const conn = mongoose.connection;
    let gfs;
    
    conn.once('open', () => {
        console.log('Creating GridFS stream with bucket: uploads');
        
        // Initialize stream
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection('uploads'); // This is the bucket name
        
        // Make gfs accessible globally
        global.gfs = gfs;
        app.set('gridfs', gfs);
        
        // Verify GridFS is set up correctly by checking collections
        conn.db.listCollections({ name: 'uploads.files' }).toArray((err, collections) => {
            if (err) {
                console.error('Error checking GridFS collections:', err);
            } else {
                if (collections.length === 0) {
                    console.log('🔧 uploads.files collection not yet created - it will be created on first file upload');
                    
                    // Create an empty test file to ensure GridFS collections are created
                    const tempFilePath = path.join(__dirname, 'temp-test-file.txt');
                    fs.writeFileSync(tempFilePath, 'Test content for GridFS');
                    
                    // Create a simple route to verify GridFS is working
                    app.get('/api/check-gridfs', (req, res) => {
                        if (global.gfs) {
                            global.gfs.files.find().toArray((err, files) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.json({
                                    gridfsConnected: true,
                                    files: files || []
                                });
                            });
                        } else {
                            res.json({ gridfsConnected: false });
                        }
                    });
                } else {
                    console.log('✅ GridFS collections already exist:', collections.map(c => c.name).join(', '));
                }
            }
        });
    });
})
.catch(err => console.log('❌ Database connection error:', err));

// Create a multer instance with the storage engine
const upload = multer({ storage });
app.set('upload', upload);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug routes
app.get('/debug/gridfs-info', (req, res) => {
    const gfs = req.app.get('gridfs') || global.gfs;
    
    if (!gfs) {
        return res.status(500).json({ error: 'GridFS not initialized' });
    }
    
    // List all files in GridFS
    gfs.files.find().toArray((err, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            status: 'GridFS is working',
            bucketName: 'uploads',
            files: files || [],
            connectionState: mongoose.connection.readyState
        });
    });
});

// Import routes
const routes = require('./routes/route.js');
const fileRoutes = require('./routes/file-route');
const assessmentRoutes = require('./routes/assessment-route');

// Register routes
app.use('/', routes);
app.use('/files', fileRoutes);
app.use('/assessment', assessmentRoutes);

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started at port no. ${PORT} 🚀`);
});

// Error handling for the server
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        message: 'Server Error',
        error: err.message
    });
});