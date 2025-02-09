let express = require('express');
let cors = require('cors');
let app = express();
app.use(cors());
app.use(express.json());
let port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jt86e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        let menuItemsDB = client.db('Bistro-Boss-DB').collection('menu');
        let cartItemsDB = client.db('Bistro-Boss-DB').collection('carts');
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        app.post('/cart', async (req, res) => {
            let data = req.body;
            let result = await cartItemsDB.insertOne(data);
            res.send(result);
        })
        app.delete('/cart/:id', async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result=await cartItemsDB.deleteOne(query);
            res.send(result);
        })
        app.get('/cart', async (req, res) => {
            let email = req.query.email;
            let query = { email: email };
            let result = await cartItemsDB.find(query).toArray();
            res.send(result);
        })
        app.get('/menu', async (req, res) => {
            let page = parseFloat(req.query.page);
            let size = parseFloat(req.query.size);
            let filter = req.query.filter;
            let query = {};
            if (filter) query.category = filter
            let body = req.body;
            let findData = await menuItemsDB.find(query).skip(page * size).limit(size).toArray();
            res.send(findData);
        })

        app.get('/countFood', async (req, res) => {
            let filter = req.query.filter || 'salad';
            let query = {};
            query = { category: filter };
            let count = await menuItemsDB.countDocuments(query);
            res.send({ count });
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('ok ok cool')
})

app.listen(port, () => {
    console.log(`boss is run run running`)
})