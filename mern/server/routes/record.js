// server/routes/record.js
import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";
import multer from "multer";
import xlsx from "xlsx";

const router = express.Router();
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// Get all records
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("records");
    const allRecords = await collection.find({}).toArray();
    res.status(200).send(allRecords);
  } catch (err) {
    console.error("Error retrieving records:", err);
    res.status(500).send("Error retrieving records");
  }
});

// Get a single record by ID
router.get("/:id", async (req, res) => {
  try {
    const collection = await db.collection("records");
    const singleRecord = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!singleRecord) return res.status(404).send("Record not found");
    res.status(200).send(singleRecord);
  } catch (err) {
    console.error("Error fetching record:", err);
    res.status(500).send("Error fetching record");
  }
});

// Create a new record
router.post("/", async (req, res) => {
  try {
    const newEntry = {
      name: req.body.name,
      position: req.body.position,
      level: req.body.level,
    };
    const collection = await db.collection("records");
    const insertResult = await collection.insertOne(newEntry);
    res.status(201).send(insertResult);
  } catch (err) {
    console.error("Error creating record:", err);
    res.status(500).send("Error creating record");
  }
});

// Update a record by ID
router.patch("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updateData = {
      $set: {
        name: req.body.name,
        position: req.body.position,
        level: req.body.level,
      },
    };
    const collection = await db.collection("records");
    const updateResult = await collection.updateOne(query, updateData);
    res.status(200).send(updateResult);
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).send("Error updating record");
  }
});

// Delete a record by ID
router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("records");
    const deleteResult = await collection.deleteOne(query);
    res.status(200).send(deleteResult);
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).send("Error deleting record");
  }
});

// Bulk delete records
router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    const objectIds = ids.map((id) => new ObjectId(id));
    const collection = await db.collection("records");
    const bulkDeleteResult = await collection.deleteMany({ _id: { $in: objectIds } });
    res.status(200).send({ message: "Records deleted successfully", result: bulkDeleteResult });
  } catch (err) {
    console.error("Error during bulk deletion:", err);
    res.status(500).send("Error deleting records");
  }
});

// Upload Excel and insert records
router.post("/upload-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = xlsx.utils.sheet_to_json(sheet);

    const formattedRecords = parsedData.map((record) => ({
      name: record["Name"],      // Excel column 'Name'
      position: record["Position"], // Excel column 'Position'
      level: record["Level"],       // Excel column 'Level'
    }));

    const collection = await db.collection("records");
    const bulkInsertResult = await collection.insertMany(formattedRecords);
    res.status(200).send({ message: "Records uploaded successfully", result: bulkInsertResult });
  } catch (err) {
    console.error("Error uploading records from Excel:", err);
    res.status(500).send("Error uploading records");
  }
});

export default router;
