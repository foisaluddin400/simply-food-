const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
//jwt er 4th step
var cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000 ;

//jwt er 3rd-step
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

//jwt er 3rd-step end

const uri = "mongodb://localhost:27017/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middlware 
const logger = (req, res, next)=>{
  console.log('log info' , req.method, req.url);
  next();
}
const verifiToken = (req,res,next)=>{
  const token = req.cookies?.token;
  console.log('token in the middle ware ', token);
  if(!token){
    return res.status(401).send({message : 'unauthorized accesss'})
  }
  jwt.verify(token, '17485e68d4179605b5cddc9bc633864c28bdaee2c58d4658d40048dc98a31662c0ae7d5eb88229d1c42732db80f1366ac9d4f94bfd5fa15c965bce692d5026f3',(err, decoded)=>{
    if(err){
      return res.status(401).send({message : 'unauthorized accessss'})
    }
    req.user = decoded;
    next()
  })
 
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("insertDB");
    const userLogin = database.collection("userLogin");

    const databasee = client.db("carData");
    const userJson = databasee.collection("carjson");

    const checkLogin = databasee.collection("checkLogin");

    app.get('/services', async(req, res) => {
      const cursor = userJson.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userJson.findOne(query)
      res.send(result)
    });

    

    //Step-1 auth related api er jonno jwt auth provider e jete hobe
    // instoll npm jwt 
    //install npm axios
    //npm express cookie- step 2nd

    app.post('/jwt', logger, async(req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, '17485e68d4179605b5cddc9bc633864c28bdaee2c58d4658d40048dc98a31662c0ae7d5eb88229d1c42732db80f1366ac9d4f94bfd5fa15c965bce692d5026f3', {expiresIn:'1h'})
      //2nd step 
      res.cookie('token', token,{
        httpOnly:true,
        secure:true,
        sameSite:'none'
      })
      .send({success:true})
      console.log(token);
    });

// logout korle token cookie theke chole jabe
    app.post('/logout', logger, (req, res) => {
      const user = req.body
      console.log('logout',user);
      res.clearCookie('token', {maxAge:0}).send({success:true})
      
    });
    



    // chekout

    app.post('/checked', async(req, res) => {
      const user = req.body;
      console.log(user)
      const result = await checkLogin.insertOne(user)
      res.send(result)
    });

    app.get('/checked', logger, verifiToken, async(req, res) => {
      console.log(req.queryy.email);
      console.log('tok tok token', req.user);
      if(req.user.email !== req.queryy.email){
        return res.status(403).send({message : 'forbidden access'})
      }
      let queryy = {};
      if(req.queryy?.email){
        queryy={email : req.queryy.email}
      }
      const cursor = checkLogin.find(queryy)
      const result = await cursor.toArray()
      res.send(result)
    });



    app.get('/users', async(req, res) => {
        const cursor = userLogin.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    app.post('/users', async(req, res) => {
        const user = req.body;
        console.log('added', user);
        const result = await userLogin.insertOne(user);
        res.send(result)
    });

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
    res.send('simple courd running')
});
app.listen(port, () => {
    console.log(`Server started on port,${port}`);
});