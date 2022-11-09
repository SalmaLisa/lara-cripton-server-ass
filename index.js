const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

//middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('lara cripton server is ready to use')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t3mwvsa.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    const serviceCollection = client.db('laraCriptonDb').collection('services')
    const reviewCollection = client.db('laraCriptonDb').collection('reviews')
    app.get('/limitedServices', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query)
      const result = await cursor.limit(3).toArray()
      res.send(result)
    })
    app.get('/services', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await serviceCollection.findOne(query)
      res.send(result)
    })

    //reviews
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })

    app.get('/reviews', async (req, res) => {
      let query = {};
      console.log(req.query.email)
      if (req.query.email) {
        query = {
          email:req.query.email
        }
      }
      const cursor = reviewCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = {};
      const cursor = reviewCollection.find(query)
      const reviews = await cursor.toArray()
      const filteredReviews = reviews.filter(review=>review.serviceId===id)
      res.send(filteredReviews)
    })
    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await reviewCollection.deleteOne(query)
      res.send(result)
    })
    
  }
  finally {
    
  }
}
run().catch(error =>console.log(error))

app.listen(port, () => {
  console.log('server is running at port',port)
})