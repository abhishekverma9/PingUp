import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let caCert = process.env.AIVEN_CA_CERT; 
if (caCert) { 
  caCert = caCert.replace(/\\n/g, '\n');
} else { 
  caCert = fs.readFileSync('./ca.pem');
}

const pool = mysql.createPool({
  host: process.env.AIVEN_DB_HOST,
  port: process.env.AIVEN_DB_PORT,
  user: process.env.AIVEN_DB_USER,
  password: process.env.AIVEN_DB_PASSWORD,
  database: process.env.AIVEN_DB_NAME,
  
  ssl: {
    ca: caCert,
    rejectUnauthorized: true,
  },
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to Aiven MySQL database!");
    connection.release(); 
  } catch (error) {
    console.error("❌ Failed to connect to Aiven MySQL:", error.message);
    process.exit(1);
  }
};

export { pool, connectDB };