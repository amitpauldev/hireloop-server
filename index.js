import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

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
const applications = db.collection("all_applications");

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
	const data = await users.find({}).toArray();
	res.json({ success: true, data });
});

// Helper function to escape special characters in regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
app.get("/jobs", async (req, res) => {
	const query = {};

	const { search, category, jobType, remote } = req.query;

	if (search) {
		const searchRegex = {
			$regex: escapeRegex(search),
			$options: "i",
		};

		query.$or = [
			{ title: searchRegex },
			{ companyName: searchRegex },
			{ location: searchRegex },
			{ responsibilities: searchRegex },
			{ requirements: searchRegex },
		];
	}

	if (category) {
		query.category = {
			$regex: escapeRegex(category),
			$options: "i",
		};
	}
	// if (jobType)
	// 	query.jobType = {
	// 		$regex: jobType,
	// 		$options: "i",
	// 	};

	if (jobType) {
		query.jobType = {
			$in: Array.isArray(jobType) ? jobType : [jobType],
		};
	}

	if (remote !== undefined) {
		query.remote = remote === "true";
	}

	const data = await jobs.find(query).toArray();

	res.json({ success: true, data });
});

app.get("/jobs/:id", async (req, res) => {
	const id = req.params.id;
	const data = await jobs.findOne({
		_id: new ObjectId(id),
	});
	res.json({ success: true, data });
});

app.post("/jobs", async (req, res) => {
	const job = req.body;
	const result = await jobs.insertOne(job);
	res.status(201).json({ success: true, insertedId: result.insertedId });
});

app.delete("/jobs/:id", async (req, res) => {
	const id = req.params.id;
	const result = await jobs.deleteOne({
		_id: new ObjectId(id),
	});
	res.json({ success: true, deletedCount: result.deletedCount });
});

app.put("/jobs/:id", async (req, res) => {
	const id = req.params.id;
	const job = req.body;
	const result = await jobs.updateOne({ _id: new ObjectId(id) }, { $set: job });
	res.json({ success: true, modifiedCount: result.modifiedCount });
});

// applications
app.post("/applications", async (req, res) => {
	const application = req.body;
	const result = await applications.insertOne(application);
	res.status(201).json({ success: true, insertedId: result.insertedId });
});

app.get("/applications", async (req, res) => {
	const query = {};
	if (req.query.applicantId) {
		query.userId = req.query.applicantId;
	}
	const cursor = applications.find(query);

	const data = await cursor.toArray();

	res.json({ success: true, count: data.length, data });
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
		console.log(`Server is running on port ${8000}`);
	});
}

// Export the app for Vercel serverless deployment
export default app;
