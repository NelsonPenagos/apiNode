//Schema usuario Ahorraki
var mongoose = require ("mongoose");
var Schema = mongoose.Schema;
var usuarioSchema = new Schema({
    name : String,
    last_name : String,
    email : String,
    token : String
});

module.exports = mongoose.model("Usuario", usuarioSchema);