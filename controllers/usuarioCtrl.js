var mongoose = require('mongoose');
var Usuario  = mongoose.model('Usuario');
var Service = require('../token/service');
var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

//POST - Insertando un nuevo usuario en la BD
exports.addUser = function(req, res){    
    console.log(" === "+dateNow+" || Ingresando a Control de Usuario ===");
    
    var usuario = new Usuario({
        name: req.body.name,
        last_name: req.body.last_name,
        email: req.body.email,
        token: ""
    });        
    
    Usuario.findOne({'email' : req.body.email}, function (err, user) {
        if(err){
            console.log(" === "+dateNow+" || ERROR CONSULTANDO USUARIO XXXXXX "+err.message);
            return res.status(500).send({error: "Ocurrio un error validando el usuario"}); 
        }else{
            if (user == null ){
                 usuario.save(function(err){
                    if(err){
                        console.log(" === "+dateNow+" || ERROR GUARDANDO USUARIO XXXXXX "+err.message);
                        return res.status(500).send({error: "Ocurrio un error intentando guardar el usuario"});
                    }else{
                        console.log(" === "+dateNow+" || El usuario se registro con exito !! ===");
                        var token = Service.createToken(usuario);
                        usuario.token = token;
                        return res.status(200).send(usuario);
                    } 
                });
            }else{
                console.log(" === "+dateNow+" || El usuario ya esta registrado === ");
                var token = Service.createToken(user);
                user.token = token;
                return res.status(200).send(user);
            }
        }  
    });   
};