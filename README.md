# images-gridfs-webapi
This is sample code to explore how you can store and retrieve images via a Web API with a MongoDB back end using the GridFS capabilities of the Node.JS driver.

To upload from command line

curl **URL OF YOUR API** \
 -H "Authorization: Bearer YOUR_DEVELOPER_TOKEN" -X POST \
 -F attributes='{"name":"myphoto.jpeg"}' \
 -F file=@MYPHOTO.jpeg

 Make sure to use @ symbol in file parameter so CURL uploads the file itself

To download from the command line
curl -L **URL OF THE DOWNLOAD API**
-H "Authorization: Bearer YOUR_DEVELOPER_TOKEN"
