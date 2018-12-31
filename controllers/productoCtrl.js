var mongoose = require('mongoose');
var base64 = require("../util/base64");
var trim = require('deep-trim-node');
var managerFile = require("../util/deleteFile");
var wait = require('wait.for');
var haversine = require('haversine');
var Producto  = mongoose.model('Producto');
var Usuario  = mongoose.model('Usuario');
var Comentarios = mongoose.model('Comentarios');
var Calificacion = mongoose.model('Calificacion');
var MeGusta = mongoose.model('MeGusta');
var nameImagenes = new Array();
var urlImagenes = new Array();


//POST - Insertando un nuevo reporte en la BD
exports.addProduct = function(req, res){    
    console.log("POST");
    nameImagenes.length = 0;
    urlImagenes.length = 0;
    //console.log(req.body);        
    var producto  = new Producto({
        product_name : req.body.product_name,
        price : req.body.price,
        latitude : req.body.latitude,
        longitude : req.body.longitude,
        average : 0,
        store_name : req.body.store_name,
        rate : req.body.rate,
        comment: req.body.comment,
        image: "",
        like : 0,
        user : ""
    }); 
    
    //FindOne - Buscando usuario por email y obteniendo _id para hacer relación con "usuario -> producto"
    console.log("Email: "+ req.body.email);
    Usuario.findOne({'email' : req.body.email}, function (err, usuario) {
        if(err){
           return res.status(500).send(err.message); 
        }else{
            if(usuario != null){
                var nameFolder = usuario.email;
                console.log("Nombre de Carpeta: "+ nameFolder);
                producto.user = usuario._id;
                producto.average = req.body.rate;
                if(req.body.image != "[]" && req.body.image != null){
                    addImage(producto, nameFolder,req.body.image, req.body.email, res);     
                }else{
                    console.log('No se enviaron imagenes');
                }
                addScoreProduct(req.body.rate, producto, usuario);                
                if(err) return res.status(500).send(err.message);
                res.status(200).jsonp(producto);
            }else{
                res.json({message: 'Usuario no encontrado'});
            }
        }
    });    
};

// Funcion addImage : Añade imagen a Google Drive en base 64
function addImage(producto, nameFolder, imageBase64, emailUser, res){
    var Login = require("../google_drive/login");
    /*var aux = imageBase64+'';
    var imageURL = aux.split(',');*/
    console.log("************************************** INFO : "+ imageBase64.length);
    for (info in imageBase64){
        var nameImage = Math.random()+'_'+emailUser;        
        //var nameImage = Date.now()+'_'+emailUser;
        nameImagenes.push(nameImage);        
        var options = {filename: nameImage};
        //var aux = imageBase64[info].substring(23);        
        var imageData = new Buffer(imageBase64[info], 'base64');
        base64.base64decoder(imageData, options, function (err, saved) {
            if (err) { console.log(err); }  
                console.log("Nombre imagen: "+saved);
                Login.authGoogleDrive(nameFolder, saved, true,'',function(err, url){
                if (err) { console.log(err); }
                urlImagenes.push(url);
                if (urlImagenes.length == imageBase64.length){
                    saveProduct(producto, res); 
                };    
            });
        }); 
    }   
}
// Funcion saveProduct: contiene la URL retornada por Google Drive para la imagen y la guarda en la base de datos
function saveProduct (producto, res){
    producto.image = urlImagenes;
    console.log("PRODUCTO: "+ producto);
    producto.save(function(err){
        //if(err) return res.status(500).send(err.message);
        //res.status(200).jsonp(producto);
        console.log("Registrando Producto: "+ producto);
        for (info in nameImagenes){
            managerFile.deleteFile(nameImagenes[info],function(err, file){               
                console.log("Imangen eliminada: "+file);
                console.log('Imagenes guardada en Google Drive');                   
            });
        }           
    }); 
}

//POST - Insertando Comentarios
exports.addCommentProduct = function(req, res){
    console.log("POST Comentario: "+ req.body);
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var comentarios = new Comentarios({
        dateNow : dateNow,
        comment : req.body.comment,
        image : req.body.image,
        product : req.body.product,
        user   : req.body.user
    });
    comentarios.save(function(err){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(comentarios);
    });
};

//POST - Insertando Calificacion
exports.addRateProduct = function(req, res){
    console.log("POST Calificacion"+ req.body.score);
    var calificacion = new Calificacion({
        score :  req.body.score,
        product :  req.body.product,
        user:  req.body.user
    });
    calificacion.save(function (err){
        if(err) return res.status(500).send(err.message);
        res.status(200).send(calificacion);
    });
};

function addScoreProduct (score, product, user){
    console.log("POST Calificacion addScoreProduct"+ score);
    var calificacion = new Calificacion({
        score : score,
        product : product._id,
        user:  user._id
    });
    calificacion.save(function (err){
        if(err) return console.log(err.message);
        console.log(calificacion);
    });
}

//POST - Insertando Me Gusta
exports.addLike = function(req, res){
    console.log("POST Me gusta: "+ req.body.like);
    var meGusta = new MeGusta({
        like : req.body.like,
        product : req.body.product,
        user:  req.body.user
    });
    MeGusta.findOne({'product' : req.body.product}, function (err, productLike) {
         if(err){
            console.log(" === "+dateNow+" || ERROR CONSULTANDO LIKE XXXXXX "+err.message);
            return res.status(500).send({error: "Ocurrio un error validando el producto"}); 
        }else{
            if(productLike == null || productLike.user != req.body.user){
                meGusta.save(function(err){
                    if(err) 
                        return res.status(500).send(err.message);
                    getLike(res, meGusta.product);
                    res.status(200).send(meGusta);                   
                });
            }else{
                res.json({message: 0});
            }
        }
    });
};

//GET - Obtener los like de los usuarios
function getLike(res, producto){
    //var producto = req.params.product;
    console.log("GETLIKE: "+ producto);    
    MeGusta.find({product : producto}, function (err, productLike) {
         if(err){
            console.log(" === "+dateNow+" || ERROR CONSULTANDO LIKE XXXXXX "+err.message);
            return res.status(500).send({error: "Ocurrio un error validando el producto"}); 
        }else{
            var count = 0;
            if (productLike != null ){                
                for(aux in productLike){
                    ++count;
                }
                console.log(" ===  LIKES === "+count);
                //res.json({likes: count});
                
                //productLike.count({like: 1}, function(err, result){
                  //  if (err) {
                    //    return res.status(500).send({error: "Ocurrio un error obteniendo los like"}); 
                    //} else {
                      //  res.status(200).send(result);
                    //}
                //});
            }else{
                count = 0;
                console.log(" === NO LIKE === "+ count);
                //res.json({message: 0});
            }
            Producto.findById(producto,function(err, result){
                console.log("result: "+ result);
                result.like = count;
                result.save(function (err){
                    if(err) return console.log(err.message);
                        console.log("POSTLIKE: "+result);
                    });
            });
        }
    });    
}


//GET - Obtener los productos de un usuario
exports.findProductsUser = function(req, res){
    var ObjectId = require('mongoose').Types.ObjectId; 
    var email = req.params.email;
    Usuario.findOne({'email' : email}, function (err, usuario) {    
        if(usuario != null){
            Producto.find({user:usuario._id}, function(err, producto){
                if (producto != ""){
                    var score = new Array();
                    for(item in producto){
                        Calificacion.aggregate([
                            { "$match": { product: new ObjectId(producto[item]._id) } },
                            { "$group": { "_id": null, "average": {"$avg": "$score" } } } 
                        ], function(err, result) {
                            if(result != ""){
                                var roundRate = result[0].average;
                                console.log("Retornando promedio: "+ roundRate.toFixed(1));
                                score.push(roundRate.toFixed(1));                                 
                                
                            }else{
                                var roundRate = result[0].average;
                                console.log("Retornando promedio: "+ roundRate.toFixed(1));
                                score.push(roundRate.toFixed(1));     
                            }                                                  
                        });
                    }
                    Usuario.populate(producto, {path: "user"}, function(err, info){
                        if(err) return res.status(500).send(err.message);
                            for(var i = 0; i < info.length; i++){
                                 info[i].average = score[i];
                                 info[i].save(function(err){
                                    if(err) return console.log(err.message);
                                 });
                                 console.log("Calificacion: "+info[i].average);   
                            }                            
                        res.status(200).send(info);
                    });         
                                       
                }else{
                    res.json({message: 'Registra los productos más baratos y cerca de ti'});
                }                                          
            });
        }else{
            res.json({message: 'Usuario no encontrado'});
        }
    });    
};

//GET - Obtener todos los comentarios de un producto
exports.findCommentProduct = function(req, res){
    console.log("PRODUCT ID: "+req.params.productId);
    var productId = req.params.productId;
    Comentarios.find({product:productId}, function(err, comment) {
        Usuario.populate(comment, {path: "user"}, function(err, info){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(info);
        })       
    }).sort('-dateNow');
};

//GET - Obtener todos la Calificacion de un producto
exports.findRateProduct = function(req, res){
    console.log("PRODUCT ID: "+req.params.productId);
    var productId = req.params.productId;
    var userId = req.params.userId;
    Calificacion.find({product:productId,user:userId}, function(err, info) {
            if(err) return res.status(500).send(err.message);
            res.status(200).send(info);
        /*Usuario.populate(rate, {path: "user"}, function(err, info){
            if(err) return res.status(500).send(err.message);
            res.status(200).send(info);
        })*/       
    });
};

//GET - Obtener productos por Nombre, KM, Latitud y longitud 
exports.findProductsByNameAndKM = function(req, res){
    var latitudeParameter = req.params.latitude; //4.710899;//tomar del request a futuro vendra como parametro de consulta
    var longitudeParameter = req.params.longitude;//-74.072003;//tomar del request a futuro vendra como parametro de consulta
    var km = req.params.km;//tomar del request a futuro vendra como parametro de consulta
    var name = req.params.name;//tomar del request a futuro vendra como parametro de consulta
    var productsObject = new Array();
    //console.log("regexp = "+(new RegExp(''+name+'', "")));
    var products = wait.forMethod(Producto,"find",{product_name:new RegExp(''+name+'', "i")}); 
    for(p in products){
        start = {
          latitude: latitudeParameter,
          longitude: longitudeParameter
        }
        if((products[p].latitude != null) && (products[p].longitude != null)){
            end = {
              latitude: products[p].latitude, // a fututro tomar la del producto product[p]
              longitude: products[p].longitude // a fututro tomar la del producto product[p]
            }
           
            if(haversine(start, end, {threshold: km, unit: 'km'})){
                productsObject.push(products[p]);
            }
            console.log(haversine(start, end))
            console.log(haversine(start, end, {unit: 'km'}))
            console.log(haversine(start, end, {threshold: 1}))
            console.log(haversine(start, end, {threshold: 1, unit: 'km'}))
        }
    }

    res.send(productsObject.sort(function (a, b) {
        if (a.price > b.price) {
            return 1;
        }if (a.price < b.price) {
            return -1;
        }// a must be equal to b
            return 0;
    }));
};

//DELETE - Borrar producto registrado
exports.deleteProduct = function(req, res){
    var Login = require("../google_drive/login");
    console.log("ID_PRODUCTO_BORRAR: "+req.params.productId);
    var productId = req.params.productId;   
    Calificacion.find({product:productId}, function(err, score){
        if (score != null){
            for(item in score){
                score[item].remove(function(err){
                    if(err) return console.log(err.message);
                console.log("Se elimino calificación");
                });
            }
        }else{
            console.log("El producto no tenia calificación");
        }
        
    });
    Comentarios.find({product:productId}, function(err, comment){
        if (comment != null){
            for(item in comment){
                comment[item].remove(function(err){
                    if(err) return console.log(err.message);
                console.log("Se elimino Comentarios");
                });
            }
        }else{
            console.log("El producto no tenia Comentarios");
        }
        
    });
    MeGusta.find({product:productId}, function(err, like){
        if (like != null){
            for(item in like){
                like[item].remove(function(err){
                    if(err) return console.log(err.message);
                console.log("Se elimino MeGusta");
                });
            }
        }else{
            console.log("El producto no tenia Me gusta");
        }
       
    });
    

    Producto.findById(productId, function(err, product){
        var img = product.image;
        for (item in img){
            var aux = img[item].split("id=");
            Login.authGoogleDrive('', '', false, aux[1], function(err){
                if (err) { console.log(err); }            
            });
        }
        product.remove(function(err){
                if(err) return res.status(500).send(err.message);
            res.status(200).send();
        });
    });
        
}; 
