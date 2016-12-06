var express = require('express')
var app = express()
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://192.168.0.16:27017/MyDocumentsDB';
 
app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/photos/:PhotoFile', function (req, res) {
    var pfile = req.params.PhotoFile;
  
    MongoClient.connect(url, function(err, db) 
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

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})