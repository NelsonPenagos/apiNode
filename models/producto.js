//Schema reportes FindThingsApp
var mongoose = require ("mongoose");
var Schema = mongoose.Schema;
var Usuario = mongoose.model("Usuario");

var productoSchema = new Schema({
    product_name : String,
    price : Number,
    latitude : Number,
    longitude : Number,
    average : Number,
    store_name : String,
    rate : Number,
    comment : String,
    image: Array,
    like : Number,
    user : { type: Schema.ObjectId, ref: "Usuario"}
});

module.exports = mongoose.model("Producto", productoSchema);