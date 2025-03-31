const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const Routes = require("./routes/route.js");
const methodOverride = require('method-override');
const path = require('path');

// Try to import GridFS, but make it optional
let Grid;
try {
  Grid = require('gridfs-stream');
} catch (err) {
  console.warn("GridFS stream module not found. File upload/download functionality will be limited.");
  console.warn("Run 'npm install gridfs-stream multer multer-gridfs-storage method-override' to enable full functionality");
}

const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(express.json({ limit: '30mb' }));
app.use(cors());
app.use(methodOverride('_method'));

// Serve static files from uploads directory if it exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection with GridFS setup
let gfs;

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("🎉 Connected to MongoDB successfully 🎉");
        
        // Initialize GridFS stream if available
        if (Grid) {
            const conn = mongoose.connection;
            gfs = Grid(conn.db, mongoose.mongo);
            gfs.collection('uploads');
            
            // Make GridFS available to all routes
            app.set('gridfs', gfs);
            console.log("GridFS initialized successfully");
        }
    })
    .catch((error) =>
        console.log("❌ Failed to connect to MongoDB ❌", error.message)
    );

app.use('/', Routes);

app.listen(PORT, () => {
    console.log(`🚀 Server started at port no. ${PORT} 🚀`);
});