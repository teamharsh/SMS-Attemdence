const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const methodOverride = require('method-override');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected');
    
    // Initialize GridFS
    const conn = mongoose.connection;
    let gfs;
    
    conn.once('open', () => {
        // Initialize stream
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection('uploads');
        
        // Make gfs accessible to route handlers
        app.set('gridfs', gfs);
    });
})
.catch(err => console.log('Database connection error: ' + err));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const routes = require('./routes/route.js');
const fileRoutes = require('./routes/file-route');
const assessmentRoutes = require('./routes/assessment-route');

// Register routes
app.use('/', routes);
app.use('/files', fileRoutes);
app.use('/assessment', assessmentRoutes);