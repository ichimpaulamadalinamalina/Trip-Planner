const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const { Worker } = require("worker_threads");
const app = express();
const port = 6789;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) =>   res.render('home'));




app.get('/oliveplanner', (req, res) => {
    res.render('home');
});

app.get('/geocode_status', (req, res) => {
    geocode_status=req.query.y;
});
var geocode_status="";

app.get('/check_city', (req, res) => {
    let search = req.query.x; 
    const str2 =search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();
    search=str2;
    var dict = {};
    console.log("geocode:" + geocode_status);
    if(geocode_status=='OK' & search!=""){
        //console.log("intra: "+ search);
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Travel");
        dbo.collection("status").find({ localitate: search },{ projection: { "_id": 0, "localitate": 0 } }).toArray(function (err, result) {
            if (err) throw err;
            if(result.length>0 && result[0].status == "ok" ){
                dbo.collection(search).find({ }, { projection: { "_id": 0, "review": 0, "rating": 0 } })
                    .limit(10).toArray(function (err, res1) {
                        if (err) throw err;
                        let i;
                        for (i = 0; i < res1.length; i++) {
                               
                            dict[res1[i]['location']] = [res1[i]['address'],res1[i]['image']];
                        }
                       res.send({ status: "ok", data:dict});
                    });
            }
            else 
                if (result.length<=0) {
                    var myobj = { localitate: search, status: "empty" };
                    dbo.collection("status").insertOne(myobj, function (err, res) {
                        if (err) throw err;
                        console.log("1 document inserted");
                    });
                
                const worker = new Worker("./crawler/crawler.js", { workerData: { search: search } });
                worker.once("message", result => {
                    console.log(`Function in execution`);
                });

                worker.on("error", error => {
                    console.log(error);
                });

                worker.on("exit", exitCode => {
                    console.log(`It exited with code ${exitCode}`);
                })

                console.log("Execution in main thread");
                res.send({ status: "new entry"});
            }
        
            else if(result.length>0 && result[0].status == "empty" )
            {
            res.send({ status: "in progress"});
            }

        });
    });
}
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:` + port + "/oliveplanner"));