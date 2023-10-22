require('dotenv').config();

const serverless = require('serverless-http');
const cors = require("cors");
const express = require('express'); //"^4.13.4"
const aws = require('aws-sdk'); //"^2.2.41"
const bodyParser = require('body-parser');
const multer = require('multer'); // "^1.3.0"
const multerS3 = require('multer-s3'); //"^2.7.0"

if (process.env.NODE_ENV !== 'production')
    aws.config.update({
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        accessKeyId: process.env.ACCESS_KEY_ID,
        region: process.env.AWS__REGION
    });

const app = express();
const s3 = new aws.S3({
    signatureVersion: 'v4'
});

const dbDocClient = new aws.DynamoDB.DocumentClient();

app.use(bodyParser.json());
app.use(cors());

const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read-write',
        bucket: process.env.S3__BUCKET__NAME,
        key: function (req, file, cb) {
            const givenName = file.originalname;
            cb(null, String(givenName)); //use Date.now() for unique file keys
        }
    }),
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image')) {
            return cb(new Error('Only images are allowed.'));
        }
        cb(null, true);
    }
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.array('upl', 10), (req, res, next) => {

    const files = req.files;
    const photos = req.body;

    // Check if there are uploaded files
    if (!files || files.length === 0 || !photos) {
        return res.status(400).send({ 
            success: false,
            message: 'File is required.',
            files: files,
            photos: photos
         });
    }

    // Extract the file names
    const fileNames = files.map((file) => file.key);

    // Set the default access state for each photo as private
    fileNames.forEach((fileName) => {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME, // Replace with your DynamoDB table name
            Item: {
                photoKey: fileName,
                isPublic: false, // Set the default access state to private
            },
        };

        // Insert the item into DynamoDB
        dbDocClient.put(params, (err) => {
            if (err) {
                console.error('Error setting default access state for photo:', err);
            }
        });
    });
    res.send({
        success: true,
        urls: req.files.map(function(file) {
            return {url: file.location, name: file.key, type: file.mimetype, size: file.size};
        })
    });
    
});

app.get('/list-photos', (req, res) => {
    const params = {
        Bucket: process.env.S3__BUCKET__NAME,
        Delimiter: '/', // List objects inside subfolders
    };

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.error('Error listing objects:', err);
            res.status(err.statusCode).json({ ...err, error: 'Error listing objects' });
        } else {
            const imageKeys = data.Contents
                .filter(obj => /\.(jpg|jpeg|png)$/i.test(obj.Key)) // Filter image files
                .map(obj => obj.Key);

            // Fetch isPublic information for all photos from DynamoDB
            getAllPhotoAccessStatus()
                .then(photoAccessData => {
                        const photoData = imageKeys.map(key => {
                        const isPublic = photoAccessData[key] || false;
                        return { key, isPublic };
                    });
                    res.json(photoData);
                })
                .catch(error => {
                    console.error('Error fetching photo access status:', error);
                    res.status(error.statusCode || 500).json({ error: 'Error fetching photo access status' });
                });
        }
    });
});

// Sample function to fetch isPublic information for all photos from DynamoDB
function getAllPhotoAccessStatus() {
    // Replace with your logic to fetch isPublic for all photos from DynamoDB
    // You can use the AWS SDK for DynamoDB scan operation
    // Return a Promise that resolves with a map of photo keys to isPublic status
    const params = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        ProjectionExpression: 'photoKey, isPublic',
    };

    return new Promise((resolve, reject) => {
        dbDocClient.scan(params, (error, data) => {
            if (error) {
                console.error('Error scanning DynamoDB table:', error);
                reject(error);
            } else {
                const photoAccessData = {};
                data.Items.forEach(item => {
                    photoAccessData[item.photoKey] = item.isPublic;
                });
                resolve(photoAccessData);
            }
        });
    });
}


app.get('/photo/:key', (req, res) => {
    const key = req.params.key;
    
    const params = {
        Bucket: process.env.S3__BUCKET__NAME,
        Key: key,
    };
    
    s3.getObject(params, (err, data) => {
        if (err) {
            console.error('Error getting image:', err);
            res.status(err.statusCode).json({ ...err, error: 'Error getting image' });
        } else {
            res.setHeader('Content-Type', 'image/jpeg'); // Set the appropriate content type
            res.send(data.Body);
        }
    });
});

app.delete('/photo/:key', (req, res) => {
    const { key } = req.params;

    // Delete the photo from the S3 bucket
    s3.deleteObject({ 
        Bucket: process.env.S3__BUCKET__NAME,
        Key: key 
    }, (err, data) => {
        if (err) {
            console.error('Error deleting photo:', err);
            return res.status(err.statusCode).send({ ...err, error: 'Error deleting the photo' });
        }

        // After successfully deleting the photo from S3, delete the respective row in DynamoDB
        const dynamoParams = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: { photoKey: key }
        };

        dbDocClient.delete(dynamoParams, (dynamoErr) => {
            if (dynamoErr) {
                console.error('Error deleting DynamoDB record:', dynamoErr);
                return res.status(500).send({ success: false, message: 'Error deleting DynamoDB record' });
            }
            return res.sendStatus(200);
        });
    });
});

// mark photo as public
app.put('/photo-access/:key', (req, res) => {
    const { key } = req.params;
    const isPublic = req.body.isPublic; // Extract the access state from the request body
    // Update the DynamoDB record for the given photo key
    const params = {
        TableName: process.env.DYNAMO_TABLE_NAME, // Replace with your DynamoDB table name
        Key: {
            photoKey: key,
        },
        UpdateExpression: 'SET isPublic = :isPublic', // Update the 'isPublic' attribute
        ExpressionAttributeValues: {
            ':isPublic': isPublic,
        },
    };

    dbDocClient.update(params, (err, data) => {
        if (err) {
            console.error('Error updating photo access:', err);
            res.status(err.statusCode || 400).json({ ...err, error: 'Error updating photo access' });
        } else {
            res.json({ status: 200, message: 'Photo access updated successfully' });
        }
    });
});

if(process.env.NODE_ENV != "production" && process.env.NODE_ENV != "dev"){
    app.listen(3000, () => {
        console.log('Listening on port 3000...');
    });
} else {
    module.exports.handler = serverless(app);
}
