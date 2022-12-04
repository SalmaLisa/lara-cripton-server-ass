const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
var jwt = require("jsonwebtoken");

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("lara cripton server is ready to use");
});

//jwt verify
function jwtVerify(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t3mwvsa.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const serviceCollection = client.db("laraCriptonDb").collection("services");
    const reviewCollection = client.db("laraCriptonDb").collection("reviews");
    const appointments = client.db("laraCriptonDb").collection("appointments");

    //JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    // services
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/limitedServices", async (req, res) => {
      const query = {};
      const options = {
        sort: { postTime: -1 },
      };
      const cursor = serviceCollection.find(query, options);
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });
    app.get("/services", async (req, res) => {
      const query = {};
      const options = {
        sort: { postTime: -1 },
      };
      const cursor = serviceCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    //reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", jwtVerify, async (req, res) => {
      const email = req.decoded?.email;
      if (email !== req.query.email) {
        res.status(403).send({ message: "forbidden access" });
      }
      const options = {
        sort: { postTime: -1 },
      };
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      const options = {
        sort: { postTime: -1 },
      };
      const cursor = reviewCollection.find(query, options);

      const reviews = await cursor.toArray();
      const filteredReviews = reviews.filter(
        (review) => review.serviceId === id
      );
      res.send(filteredReviews);
    });
    app.get("/editReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    app.patch("/editReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          message: req.body.message,
          currentDate: req.body.currentDate,
          currentTime: req.body.currentTime,
          rating: req.body.rating,
        },
      };

      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    //appointments
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointments.insertOne(appointment);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("server is running at port", port);
});
