var express = require('express');
var app = express()
var mongodb = require('mongodb');
var ObjectID=require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var multer=require('multer');
//var fs = require('fs');
var url = require('url');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
var db;
 
var settings = {
    host: '192.168.0.16',
    port: 27017,
    database: 'MyDocumentsDB'
};
 
var connectionString = url.format({
    protocol: 'mongodb',
    slashes: true,
    hostname: settings.host,
    port: settings.port,
    pathname: settings.database
});
// The client will send any metadata over including the desired filename, etc.
// the function below will fetch them from the incoming req object at run-time
var storage = require('multer-gridfs-storage')({
    url: connectionString,
    //if we don't specify the filename it will be a GUID, so let's make the filename the actual filename
    filename: function (req, file, cb) {
      cb(null,  file.originalname );
  },
    metadata: function(req, file, cb) {
        //JSON.parse will take the stringified version of our metadata and make it a true JSON object so it will be stored as an object rather than a string
      cb(null, JSON.parse(req.body['metadata']));
    }
        });
    var upload = multer({ storage: storage });


app.get('/photos',function (req,res)
{
    res.writeHead(200, {'Content-Type':'text/html'});
  
    MongoClient.connect(connectionString, function(err, db) 
    {
        assert.equal(null, err);

    var bucket = new mongodb.GridFSBucket(db);/*, 
        {
        chunkSizeBytes: 131072,
        bucketName: 'myfiles'
        });*/
        var c=bucket.find().count(function(err, count) {
       
        //Eventually wrap results up into a JSON to return to caller, for now just return HTML
        res.write('<html><body><p>File count : ' + String(count) + '</p>');

      });
        var d=bucket.find().toArray().then((docs) => {
       
       docs.forEach((item, idx, array) => 
       {
           var size = parseInt(item['length'], 10);
           size=size/1024; // Convert to kB
             //Eventually wrap results up into a JSON to return to caller, for now just return HTML
             res.write('<p><a href=\'/photos/' + item['filename'] + '\'>' + item['filename'] + '</a> (' + Number(size).toFixed(2) + ' kB)</p>');
        });
       
       db.close();

       res.write('</body></html>')
       res.end();
       
   }).catch((err) => {
       
       res.write(err.stack);
    });
                        
    });

})

//Usage /photos/FILENAME
app.get('/photos/:PhotoId', function (req, res) {
     
     try{
         
        var pfile = req.params.PhotoId;
        var bucket = new mongodb.GridFSBucket(db);
        var photo_id=new ObjectID(pfile);
        var contentType="";
        // db.collection(abs,,function (err,doc) { doc.findOne})
        var PhotoFile = db.collection("fs.files", function (err,result) {
            result.findOne({"_id" : photo_id}, function (err,thephoto) {
                   contentType=thephoto['contentType'];
     }) }); 
        
        
       /* .count(function (err,count) {
            if (count==0)
            {
                res.setStatus(404);
                return false;
            }
        });*/
        //console.log(files); //['contentType']
        res.writeHead(200, {'Content-Type': contentType});//'image/jpg'});
        bucket.openDownloadStream(photo_id).pipe(res);
     }
     catch (e)
     {
       throw('Not a valid photo ID');
       return false;
     }
})
//Render home page 
app.get('/', function(request, response) {

    var Photos=[];

    var bucket = new mongodb.GridFSBucket(db);
    var d=bucket.find().toArray().then((docs) => {
    
       docs.forEach((item, idx, array) => 
       {
           var size = parseInt(item['length'], 10);
           size=size/1024; // Convert to kB

           Photos.push(
               {
                   length: size,
                   filename: item['filename'],
                   id: item['_id']
               }
           );
       }
       );

        
          response.render('index',{Photos:Photos});
        }
        );

     
        });

app.get('/new', function(request, response) {

    response.render('new');
})

//the name 'file' in upload.single('file') should match what the key value of the image that is coming over in the FormData
//in our example, refer to new.ejs, " formData.append('file',PhotoFile, PhotoFile.name);" 
app.post('/upload', upload.single('file'), function (req, res, next) 
{
    
    //console.log(req.body['metadata']);
    
    res.sendStatus(201);
    res.end();

})
//Main Entry Point, create the MongoDB Connection and use connection-pooling from the driver
MongoClient.connect(connectionString, function(err, database) {

    assert.equal(null, err);
    if(err) throw err;

    db = database;
   

  // Start the application after the database connection is ready
  app.listen(3000);
  console.log("Listening on port 3000");
});