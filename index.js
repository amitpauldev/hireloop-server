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
const jobs = db.collection("all_jobs");

// Define a route for the root URL
app.get("/", (req, res) => {
	res.send("Hello, World!");
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// export default app;
