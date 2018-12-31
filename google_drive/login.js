
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var path = require('path');
//Permisos para poder subir archivos a google drive y poder modificarlos
var SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/drive.file'];
/*var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';*/
//var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';
var TOKEN_PATH = './google_drive/drive-nodejs-quickstart.json';

// Load client secrets from a local file.
var authGoogleDrive = function (nameFolder, image, flag, idImage, callback){
    fs.readFile('./google_drive/client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Drive API.
        if (flag){
          authorize(JSON.parse(content), uploadImage);
        }else{
          authorize(JSON.parse(content), deleteImageFolder);
        }
        
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
      var redirectUrl = credentials.installed.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
          console.log(err);
        } else {
          oauth2Client.credentials = JSON.parse(token);
          callback(oauth2Client, nameFolder, image, idImage);
        }
      });
    }

    function uploadImage(auth, nameFolder, image, idImage){
      var drive = google.drive('v3');
      drive.files.list({
          auth: auth,
          q: "mimeType='application/vnd.google-apps.folder'",
          fields: 'nextPageToken, files(id, name)',
        }, function(err, response){
          var filesIdParent = response.files;
          var idGlobal = '';

          for (var aux in filesIdParent){             
            if(filesIdParent[aux].name == 'Global'){
              console.log("FILE ID: "+ filesIdParent[aux].name);
              idGlobal = filesIdParent[aux].id;
              console.log("Global: " + idGlobal);
            }
          } 

          drive.files.list({
            auth: auth,
            q: "name ='"+nameFolder+"'",
            pageSize: 10,
            fields: "nextPageToken, files(id, name)"
          }, function(err, response) {
              if (err) {
                console.log('The API returned an error: ' + err);
                return;
              }
              var files = response.files;           
              if (files.length == 0) {
                  createFolder(drive, auth, nameFolder, image, idGlobal);
              } else {
                  addImageFolder(drive, auth, files[0].id, image);
              }
          });      
      });        
    }

    function createFolder(drive, auth, nameFolder, image, folderId){
          //Create Folder
        var fileMetadata ={
            name : nameFolder,
            mimeType : 'application/vnd.google-apps.folder',
            parents : [folderId]
        };    
        drive.files.create({
            auth : auth,
            resource: fileMetadata,
            fields: 'id'
        },  function(err, file) {
            if(err) {
                // Handle error
                console.log(err);
            } else {
                //Create Image in Folder id
                console.log(file.id);
               // getIdFolder(file.id);
                var fileMetadata = {
                    name : image,
                    mimeType : 'image/png',
                    parents : [file.id] 
                };
                console.log("PATHCREATE: "+ path.join(__dirname,'../image/'+image));
                var media = {
                    mimeType : 'image/png',
                    body : fs.createReadStream(path.join(__dirname,'../image/'+image))
                };

                drive.files.create({
                    auth : auth,
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                },  function(err, file) {
                    if(err) {
                    // Handle error
                        console.log(err);
                    } else {
                        console.log(file.id);
                        //  https://googledrive.com/host/file.id
                       return callback(null, "https://drive.google.com/uc?export=view&id="+file.id);
                    }
                });
            }
        });  
    }

    function addImageFolder(drive, auth, folderId, image){
        //Create Image in Folder id
        var fileMetadata = {
            name : image,
            mimeType : 'image/png',
            parents : [folderId] 
        };
        console.log("PATHADD: "+ path.join(__dirname,'../image/'+image));
        var media = {
            mimeType : 'image/png',
            body : fs.createReadStream(path.join(__dirname,'../image/'+image))
        };

        drive.files.create({
            auth : auth,
            resource: fileMetadata,
            media: media,
            fields: 'id'
        },  function(err, file) {
            if(err) {
            // Handle error
                console.log(err);
            } else {
                    return callback(null, "https://drive.google.com/uc?export=view&id="+file.id);
                //  https://googledrive.com/host/file.id
            }
        });  
    }

    function deleteImageFolder(auth, nameFolder, image, idImage){
        console.log("ENTRANDO A BORRAR IMAGEN");
        var drive = google.drive('v3');
        drive.files.delete({
            auth : auth,
            fileId : idImage
        }, function(err){
            if (err){
              console.log("No se pudo eliminar la imagen: "+ err);
            }else{
              console.log("Se elimino la imagen: "+ idImage);
            }
        });
    }
};

module.exports = {
    authGoogleDrive: authGoogleDrive
};



