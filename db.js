var mongoose = require('mongoose');
var Schema = mongoose.Schema;
module.exports.mongoose = mongoose;
module.exports.Schema = Schema;
mongoose.connect('mongodb://localhost/mailinglist');
//exports.findUser = function(name, query, limit, callback){
//	db.collection(name).find(query).sort({_id: -1}).limit(limit).toArray(callback);
//}
