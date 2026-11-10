import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb";

// Fail fast if the DB connection string is missing (e.g. not set on Vercel)
if (!process.env.MONGODB_URI) {
	throw new Error("MONGODB_URI environment variable is missing");
}

// Connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("hireloop_db");
const users = db.collection("user");
const jobs = db.collection("all_jobs");

const app = express();

// Middlewares
app.use(express.json());
app.use(
	cors({
		// Set CLIENT_URL in .env / Vercel dashboard to restrict access to your frontend
		origin: process.env.CLIENT_URL || true,
	}),
);

// Helper
const sendError = (res, status, message) =>
	res.status(status).json({ success: false, message });

// read apis
app.get("/", (req, res) => {
	res.json({ status: "ok" });
});

app.get("/user", async (req, res) => {
	const data = await users.find({}, { projection: { password: 0 } }).toArray();
	res.json({ success: true, data });
});

app.get("/jobs", async (req, res) => {
	const data = await jobs.find({}).toArray();
	res.json({ success: true, data });
});

app.post("/jobs", async (req, res) => {
	// Only accept the fields we need — never insert raw req.body
	// const { title, company, category, deadline, description } = req.body;
	// if (!title || !company) {
	// 	return sendError(res, 400, "title and company are required");
	// }
	const job = req.body;
	const result = await jobs.insertOne(job);
	res.status(201).json({ success: true, insertedId: result.insertedId });
});

// 404 for unknown routes (JSON instead of the default HTML page)
app.use((req, res) =>
	sendError(res, 404, `Route ${req.originalUrl} not found`),
);

// Global error handler (must come after all routes)
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, message: "Internal server error" });
});

// Listen locally only (Vercel handles this via serverless functions)
if (!process.env.VERCEL) {
	app.listen(8000, () => {
		console.log(`Server is running on port ${PORT}`);
	});
}

// Export the app for Vercel serverless deployment
export default app;
