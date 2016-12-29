var express = require('express');
var app = express()
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var multer=require('multer');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
var db;
var url = require('url');
 
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
// The client should send any metadata over including the desired filename, etc.
// the functions below will fetch them from the incoming req object at run-time
var storage = require('multer-gridfs-storage')({
    url: connectionString,
    filename: function (req, file, cb) {
      cb(null,  file.originalname );
  },
    metadata: function (req, metadata, cb) {
        cb(null, { 'test' : '345345'})
    }
        });
    var upload = multer({ storage: storage });


app.get('/photos',function (req,res)
{
    res.writeHead(200, {'Content-Type':'text/html'});
  
    MongoClient.connect(connectionString, function(err, db) 
    {
        assert.equal(null, err);

        var bucket = new mongodb.GridFSBucket(db, 
        {
        chunkSizeBytes: 131072,
        bucketName: 'myfiles'
        });
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
app.get('/photos/:PhotoFile', function (req, res) {
    var pfile = req.params.PhotoFile;
  
    MongoClient.connect(connectionString, function(err, db) 
    {
        assert.equal(null, err);
        var bucket = new mongodb.GridFSBucket(db, 
        {
        chunkSizeBytes: 131072,
        bucketName: 'myfiles'
        });

        res.writeHead(200, {'Content-Type': 'image/jpg'});

        bucket.openDownloadStreamByName(pfile).pipe(res);
        
    });

})
//Render home page 
app.get('/', function(request, response) {

    var Photos=[];

    var bucket = new mongodb.GridFSBucket(db, 
        {
        chunkSizeBytes: 131072,
        bucketName: 'myfiles'
        });
        var d=bucket.find().toArray().then((docs) => {
       

       docs.forEach((item, idx, array) => 
       {
           var size = parseInt(item['length'], 10);
           size=size/1024; // Convert to kB

           Photos.push(
               {
                   length: size,
                   filename: item['filename']
                  
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

//the name 'file' should match what the key value of the image that is coming over in the FormData
//in our example, refer to new.ejs, " formData.append('file',PhotoFile, PhotoFile.name);" 
app.post('/upload', upload.single('file'), function (req, res, next) 
{
    console.log(req);
    
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