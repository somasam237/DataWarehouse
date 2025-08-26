const express = require("express");
const cors = require("cors"); // for react frontend request handling
//import routes
const authRoutes = require("./routes/auth");
require("dotenv").config();

// Routes for 7-table schema (your current database structure)
const proteinInfoRoutes = require('./routes/proteinInfoRoutes');
const authorsFundingRoutes = require('./routes/authorsFundingRoutes');
const experimentalDataRoutes = require('./routes/experimentalDataRoutes');
const macromoleculeRoutes = require('./routes/macromoleculeRoutes');
const ligandsNewRoutes = require('./routes/ligandsNewRoutes');
const softwareUsedRoutes = require('./routes/softwareUsedRoutes');
const versionHistoryRoutes = require('./routes/versionHistoryRoutes');



const app = express();
//use routes and middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // Support both frontend ports
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);

// Route Handlers for 7-table schema (your current database structure)
app.use('/api/protein-info', proteinInfoRoutes);
app.use('/api/authors-funding', authorsFundingRoutes);
app.use('/api/experimental-data', experimentalDataRoutes);
app.use('/api/macromolecules', macromoleculeRoutes);
app.use('/api/ligands-new', ligandsNewRoutes);
app.use('/api/software-used', softwareUsedRoutes);
app.use('/api/version-history', versionHistoryRoutes);


// Simple root route for testing if the server is alive
app.get('/', (req, res) => {
    res.send('Youhou My Protein Data Warehouse API is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            '/api/protein-info',
            '/api/authors-funding', 
            '/api/experimental-data',
            '/api/macromolecules',
            '/api/ligands-new',
            '/api/software-used',
            '/api/version-history'
        ]
    });
});
const PORT = process.env.PORT || 5000;
//start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access API base at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Example API: http://localhost:${PORT}/api/protein-info`);
  console.log(`Available endpoints: protein-info, authors-funding, experimental-data, macromolecules, ligands-new, software-used, version-history`);
});
// This code sets up an Express server with CORS and JSON parsing middleware, and mounts authentication routes.