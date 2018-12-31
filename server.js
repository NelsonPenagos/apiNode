//Paquetes o librerias necesarias

var express = require("express");
var app = express(); // Instancia del Servidor express
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var wait = require('wait.for');
var middleware = require('./token/middleware');
//mongodb://username:password@host:port/database
//Base de datos de Prueba
//mongoose.connect("mongodb://localhost/PruebaFindThingsApp", function (err, res){
mongoose.connect(process.env.MONGODB_URI, function (err, res){
    if (err) console.log("ERROR: Conectando a la BD: " + err);
    else console.log("Conexión a la BD realizada..");
});

var allowMethods = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
	next();
}

/*
    Configurar app para usar bodyParser,
    con este paquete obtendremos los datos
    enviados por POST
*/
// Add headers
app.use(bodyParser.urlencoded({limit: '50mb',extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(allowMethods);

// importando modelos

var Usuario = require("./models/usuario");
var Producto = require("./models/producto");
var Comentarios = require("./models/comentarios");
var Calificacion = require("./models/calificacion");
var Feedback = require("./models/feedback");
var MeGusta = require("./models/meGusta");
var UsuarioCtrl = require("./controllers/usuarioCtrl");
var ProductoCtrl = require("./controllers/productoCtrl");
var FeedbackCtrl = require("./controllers/feedbackCtrl");

/*
    Puerto del servidor, podra ser seteado con
    argumento en comando

*/

var port = process.env.PORT || 3200;

//Rutas de la API
var router = express.Router();

// Middleware 
/*router.use(function(req, res, next) {
    console.log('Request a la API.' + res);
    next(); // llamamos a la función next para continuar
});*/

// Rutas basicas
// POST //////////////////////////////////////
router.route('/usuario').post(UsuarioCtrl.addUser);
router.route('/producto').post(middleware.ensureAuthenticated).post(ProductoCtrl.addProduct);
router.route('/comment').post(middleware.ensureAuthenticated).post(ProductoCtrl.addCommentProduct);
router.route('/score').post(middleware.ensureAuthenticated).post(ProductoCtrl.addRateProduct);
router.route('/like').post(middleware.ensureAuthenticated).post(ProductoCtrl.addLike);  
router.route('/feedback').post(middleware.ensureAuthenticated).post(FeedbackCtrl.addFeedback);


// GET ///////////////////////////////////////

//router.route('/like/:product').get(middleware.ensureAuthenticated).get(ProductoCtrl.getLike);
router.route('/producto/:email').get(middleware.ensureAuthenticated).get(ProductoCtrl.findProductsUser);
router.route('/comment/:productId').get(middleware.ensureAuthenticated).get(ProductoCtrl.findCommentProduct);
router.route('/score/:productId/:userId').get(middleware.ensureAuthenticated).get(ProductoCtrl.findRateProduct);
router.get('/findProductos/:name/:km/:latitude/:longitude', middleware.ensureAuthenticated, function(req,res){
      wait.launchFiber(ProductoCtrl.findProductsByNameAndKM, req, res); //handle in a fiber, keep node spinning
});

// DELTE /////////////////////////////////////
router.route('/delete/:productId').delete(middleware.ensureAuthenticated).delete(ProductoCtrl.deleteProduct);

app.use('/api', router);

//Iniciar el Servidor
app.listen(port);
console.log("La magia esta en el puerto : " + port);

