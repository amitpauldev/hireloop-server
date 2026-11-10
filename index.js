import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
	try {
		await client.connect();
		console.log("Successfully connected to MongoDB!");
		return client;
	} catch (err) {
		console.dir(err);
	}
}
const mongodbClient = await connectToMongoDB();
const db = mongodbClient.db("hireloop_db");
const users = db.collection("user");
const jobs = db.collection("all_jobs");

// read apis
app.get("/", (req, res) => {
	res.send("Hello, World!");
});
app.get("/user", async (req, res) => {
	const cursor = users.find({});
	const data = await cursor.toArray();
	res.send(data);
});

app.get("/jobs", async (req, res) => {
	const cursor = jobs.find({});
	const data = await cursor.toArray();
	res.send(data);
});

app.post("/jobs", async (req, res) => {
	const data = req.body;
	const result = jobs.insertOne(data);
	res.send(result);
});

// Listen locally only (Vercel handles this via serverless functions)
if (!process.env.VERCEL) {
	const PORT = process.env.PORT || 8000;
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
}

// Export the app for Vercel serverless deployment
export default app;
