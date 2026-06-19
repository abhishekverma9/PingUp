import { pool } from "./config/db.js";

async function run() {
  const [rows] = await pool.query(`
      SELECT 
        s.id AS _id, 
        JSON_OBJECT(
          '_id', u.id, 
          'name', u.name, 
          'username', u.username,
          'profile', u.profile_pic
        ) AS user
      FROM stories s
      JOIN users u ON s.user_id = u.id
      LIMIT 1
  `);

  if (rows.length > 0) {
      console.log(rows[0]);
      console.log("typeof user:", typeof rows[0].user);
  } else {
      console.log("No stories");
  }
  process.exit(0);
}
run().catch(console.error);
