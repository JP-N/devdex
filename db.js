const { Pool } = require('pg');

// Function to create a new database connection pool
const createPool = () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    });
    return pool;
};

module.exports = {
    createPool,
};
