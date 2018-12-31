var mongoose = require('mongoose');
var Feedback = mongoose.model('Feedback');

//POST - Insertando feedback
exports.addFeedback = function (req, res){
    var feedback = new Feedback({
        comment : req.body.comment,
        user : req.body.user
    });
    feedback.save(function (err){
        if(err) return res.status(500).send(err.message);
    	res.status(200).jsonp(feedback);
    });
};