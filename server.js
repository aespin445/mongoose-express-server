const express = require(express);
const mongoose = require(mongoose);
const dotenv = require(dotenv);

dotenv.config();

const app = express();
const port = 3000 || process.env.PORT;

app.use(express.json());

// import the collection models
const GroceryItem = require('./models/GroceryItem');
const Employee = require('./models/Employee');
// create a mapping object based on the models
const modelMapping = {
    GroceryInventory: GroceryItem,
    Employees: Employee
};

const connections = {};
const models = {};

const bankUserSchema = new mongoose.Schema({});

const getConnection = async (dbName) => {
    console.log("getConnection called with dbName")
    if (!connections[dbName]) {
        connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName });
        console.log(dbName);
    } else {
        console.log(`Reusing existing connection for ${dbName}`)
    }
    return connections[dbName];
}

const getModel = async (dbName, collectionName) => {
    console.log("getModel called with:", { dbName, collectionName });
    const modelKey = `${dbName}-${collectionName}`;
    if (!models[modelKey]) {
        const connection = await getConnection(dbName);
        // Create a dynamic schema that accepts any fields
        const dynamicSchema = new mongoose.Schema({}, { strict: false });
        models[modelKey] = connection.model(
            collectionName,
            dynamicSchema,
            collectionName // Use exact collection name from request
        );
        console.log("Created new model for collection:", collectionName);
    }
    return models[modelKey];
};

app.get('/find/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const model = await getModel(database, collection);
        const documents = await model.find({});
        console.log(`query executed, document count is: ${documents.length}`);
        return res.status(200).json(documents);
    } catch (error) {
        console.error("error in GET route: ", err);
        return res.status(500).json({ error: err.message });
    }
});

async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`the server is running on ${PORT}`);
        })
    } catch (err) {
        console.error('Error starting server: ', err);
        process.exit(1);
    }
}

startServer()
