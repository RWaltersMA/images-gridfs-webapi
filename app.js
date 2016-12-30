var express = require('express');
var app = express()
var mongodb = require('mongodb');
var ObjectID=require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var multer=require('multer');
var url = require('url');
var settings=require('./config.js');  //change monogodb server location here

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
var db;
 
var connectionString = url.format({
    protocol: 'mongodb',
    slashes: true,
    hostname: settings.host,
    port: settings.port,
    pathname: settings.database
});
// This object is used when the user POSTs a new photo.
// Note that the client will send any metadata over including the desired filename, etc.
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

//Usage /photos/_id where _id is the ID saved in fs.files for the specific photo
//This method will need work to address error handling, for example passing unknown ID will throw an exception
app.get('/photos/:PhotoId', function (req, res) {
     
     try{
        var bucket = new mongodb.GridFSBucket(db);
        var photo_id=new ObjectID(req.params.PhotoId);
        var contentType="";
        // we need to make sure we get the right contentType and pass it to the header
        var PhotoFile = db.collection("fs.files", function (err,result) {
            if (err) { throw ('Could not enumerate files collection'); }
            result.findOne({"_id" : photo_id}, function (err,thephoto) {
                if (err) { throw('Could not find photo with specified _id'); }

                    contentType=thephoto['contentType'];
             }) }); 

            res.writeHead(200, {'Content-Type': contentType});//  i.e. 'image/jpg'
            bucket.openDownloadStream(photo_id).pipe(res);
      
     }
     catch (e)
     {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write('<html><body><p>Error reading photo : ' + e);
       res.end();
       return false;
     }

})
//Render home page 
app.get('/', function(request, response) {

    var Photos=[];

    var bucket = new mongodb.GridFSBucket(db);
    var TotalSize=0;
    var NumberOfPhotos=0;

    //consider paging for very large lists, here we are getting all file metadata into memory
    var d=bucket.find().toArray().then((docs) => {
    
       docs.forEach((item, idx, array) => 
       {
           var size = parseInt(item['length'], 10);
           size=size/1024; // Convert to kB
           TotalSize+=size;
           
           var description="";
           var metadata = item['metadata'];
           //don't crash and burn if there are some metadata in there that we aren't expecting
           //as-is we only expect a description key but as you add more/change you will need to address it here
           try
           {
                if (metadata)
                {
                            if (metadata.hasOwnProperty('description')==true) description=metadata.description;
                } 

           }
           catch (e)
           {
               description="";
           }
           Photos.push(
               {
                   length: size,
                   filename: item['filename'],
                   id: item['_id'],
                   description: description
               }
           );
       });

        
          response.render('index',{Photos:Photos, TotalPhotoSize: TotalSize});
        });

     
        });

//Render Upload photo page
app.get('/new', function(request, response) {

    response.render('new');
})

//the name 'file' in upload.single('file') should match what the key value of the image that is coming over in the FormData
//in our example, refer to new.ejs, " formData.append('file',PhotoFile, PhotoFile.name);" 
app.post('/upload', upload.single('file'), function (req, res, next) 
{
    
    res.sendStatus(201);
    res.end();

})

//This function will remove a photo from the database for a given _id
app.get('/delete/:PhotoId', function (req, res) {
     
     try{
        
        var photo_id=new ObjectID(req.params.PhotoId);
        var grid = new mongodb.GridFSBucket(db);
        var PhotoFile = db.collection("fs.files", function (err,result) {
            if (err)
            {
                throw('Could not enumerate files collection');
                return false;
            }
            result.findOne({"_id" : photo_id}, function (err,thephoto) {
                if (err)
                {
                    throw('Could not find the _id');
                    return false;
                }

                grid.delete(photo_id,function (err) {
                    if (err){
                            throw('Could not delete the given _id');
                            }  
                                                    });
            });
        });
     }
     catch (e)
     {
         //Something went wrong, bad ID, etc so let's tell the user
         console.log(e);
     }
     res.redirect('/');
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