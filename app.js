var express = require('express')
var app = express()
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//Change this connection string to your local MongoDB
var url = 'mongodb://192.168.0.16:27017/MyDocumentsDB';

app.get('/photos',function (req,res)
{
    res.writeHead(200, {'Content-Type':'text/html'});
  
    MongoClient.connect(url, function(err, db) 
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