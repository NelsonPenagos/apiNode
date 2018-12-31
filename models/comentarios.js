//Schema comentarios FindThingsApp
var mongoose = require ("mongoose");
var Schema = mongoose.Schema;
var Producto = mongoose.model("Producto");
var Usuario = mongoose.model("Usuario");

var comentariosSchema = new Schema({
	dateNow : Date,
    comment : String,
    image : String,
    product : { type: Schema.ObjectId, ref: "Producto"},
    user : { type: Schema.ObjectId, ref: "Usuario"}
});

module.exports = mongoose.model("Comentarios", comentariosSchema);
