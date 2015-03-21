var db = require('../db');
var GroupSchema = new db.Schema({
	groupName : String,
    	events : [ 
		    {
			eventName: String,
    			eventCreator: String,
    			options:[
				   {
					team: String,
    					betters: [
						     {
							  betterName: String,
    							  betterAddress: String,
    							  betterAmount: String
						     }
						 ],
  					winner: Boolean
				    }
				],
    			completed: Boolean,
    			messages: [
				      {
					   messageFrom: String,
					   messageText: String
			 	      }
				  ]
		    }
		 ]
});

var MyGroup = db.mongoose.model('Group', GroupSchema);

exports.addGroup = function(groupName, callback){
	var instance = new MyGroup();
	instance.groupName = groupName;
	instance.save(function (err) {
		if (err) {
			callback(err);
		}else{
			callback(null, instance);
		}
	});
}

exports.addEvent = function(givenGroupName, eventName, eventCreator, options, callback){
	MyGroup.find({'groupName' : givenGroupName}, function(err, group){
		if (err) return handleError(err);
		if (group){
			console.log(group.groupName);
			MyGroup.update({groupName: givenGroupName}, {
				events: [{
						eventName: eventName,
				eventCreator: eventCreator,
				options : [{team: options[0]},{team: options[1]}],
				completed: false
					}]
			},function(err,group){
				if (err) console.err;
			});
		}
	})
}
