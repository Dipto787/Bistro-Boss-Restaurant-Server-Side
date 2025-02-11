let express = require('express');
let cors = require('cors');
let app = express();
let jwt = require('jsonwebtoken');
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
        let verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'forbidden access' })
            }
            let token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        let verifyAdmin = async (req, res, next) => {
            let email = req.decoded.email;
            let query = { email: email };
            let user = await userDb.findOne(query);
            let isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        let menuItemsDB = client.db('Bistro-Boss-DB').collection('menu');
        let cartItemsDB = client.db('Bistro-Boss-DB').collection('carts');
        let userDb = client.db('Bistro-Boss-DB').collection('users');
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        app.post('/jwt', async (req, res) => {
            let user = req.body;
            let token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })
        app.get('/user/admin/:email', verifyToken, async (req, res) => {
            let email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }

            let query = { email: email };
            let user = await userDb.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })
        app.get('/user', verifyToken, async (req, res) => {
            console.log(req.headers)
            let result = await userDb.find().toArray();
            res.send(result);
        })
        app.delete('/user/:id', verifyToken, verifyAdmin, async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result = await userDb.deleteOne(query);
            res.send(result);

        })

        app.patch('/user/admin/:id', verifyAdmin, verifyToken, async (req, res) => {
            let id = req.params.id;
            let filter = { _id: new ObjectId(id) };
            let updateDoc = {
                $set: {
                    role: 'admin'
                }
            }

            let result = await userDb.updateOne(filter, updateDoc);
            res.send(result);

        })


        app.post('/cart', async (req, res) => {
            let data = req.body;
            let result = await cartItemsDB.insertOne(data);
            res.send(result);
        })
        app.post('/user', async (req, res) => {
            let users = req.body;
            let query = { email: users.email };
            let existingUser = await userDb.findOne(query);
            if (existingUser) {
                return res.send({ message: 'existing user' });
            }
            let result = await userDb.insertOne(users);
            res.send(result);
        })
        app.delete('/cart/:id', async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result = await cartItemsDB.deleteOne(query);
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