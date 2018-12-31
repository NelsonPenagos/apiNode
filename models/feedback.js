//Schema feedback FindThingsApp
var mongoose = require ("mongoose");
var Schema = mongoose.Schema;
var Usuario = mongoose.model("Usuario");

var feedbackSchema = new Schema({
    comment : String,
    user : { type: Schema.ObjectId, ref: "Usuario"} 
});

module.exports = mongoose.model("Feedback", feedbackSchema);