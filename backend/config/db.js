import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// 1. Create the pool
const pool = mysql.createPool({
  host: process.env.AIVEN_DB_HOST,
  port: process.env.AIVEN_DB_PORT,
  user: process.env.AIVEN_DB_USER,
  password: process.env.AIVEN_DB_PASSWORD,
  database: process.env.AIVEN_DB_NAME,
  
  ssl: {
    ca: fs.readFileSync('./ca.pem'),
    rejectUnauthorized: true,
  },
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 2. Create the connection test function
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to Aiven MySQL database!");
    connection.release(); // Always release it back to the pool
  } catch (error) {
    console.error("❌ Failed to connect to Aiven MySQL:", error.message);
    process.exit(1); // Stop the server if database connection fails
  }
};

// 3. Export both
export { pool, connectDB };