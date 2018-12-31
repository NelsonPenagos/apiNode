var fs = require('fs');
var path = require('path');

//mandamos a borrar el fichero
var deleteFile = function (nameFile, callback){
    fs.unlink(path.join(__dirname,'../image/'+nameFile+'.png'), function(err){
        //comprobamos si ha ocurrido algun error
        if(err){return callback(null,err);}
        //informamos de que el fichero ha sido eliminado
        return callback(null,nameFile);
    });    
};

module.exports = {deleteFile: deleteFile};