//Schema calificación FindThingsApp
var mongoose = require ("mongoose");
var Schema = mongoose.Schema;
var Reportes = mongoose.model("Producto");
var Usuario = mongoose.model("Usuario");

var calificacionSchema = new Schema({
    score : Number,
    product : { type: Schema.ObjectId, ref: "Producto"},
    user : { type: Schema.ObjectId, ref: "Usuario"}
});

module.exports = mongoose.model("Calificacion", calificacionSchema);