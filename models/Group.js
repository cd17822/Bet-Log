var db = require('../db');
var ObjectId = db.Schema.Types.ObjectId;
var app = require('../app');
var sendgrid = require('sendgrid')(process.env.SENDGRIDUSER, process.env.SENDGRIDPASS);

/*
var GroupSchemaOriginal = new db.Schema({
	groupName : String,
    events : [ 
		    {
				eventName:String,
				groupName:String,
				eventPassword:String,
				eventCreator:String,
				complete: Boolean,
    			options:[
				   {
						GroupName:String,
						eventId:String,
						eventName:String,
						optionName:String,
	    				betters: [
							     {
								  	eventId:String,
									optionId:String,
									matchId,
									optionName:String,
									betterName:String,
									betterAddress:String,
									betterAmount:String,
									winner:Number
							     }
							 ]
				    }
				],
    			messages: [
				      {
						   from: String,
						   content: String
			 	      }
				  ]
		    }
		 ]
});
var MyGroupOriginal = db.mongoose.model('GroupOriginal', GroupSchemaOriginal);
*/

//schema
var GroupSchema = new db.Schema({
	groupName: {type:String, index: {unique: true}},
	events: [{identifier:String}]
});
var MyGroup = db.mongoose.model('Group', GroupSchema);

var EventSchema = new db.Schema({
	eventName:String,
	groupName:String,
	eventPassword:String,
	eventCreator:String,
	complete: Boolean,
	options: [{identifier:String}],
	messages: [{identifier:String}]
});
var MyEvent = db.mongoose.model('Event', EventSchema);

var OptionSchema = new db.Schema({
	groupName:String,
	eventId:String,
	eventName:String,
	optionName:String,
	betters:[{identifier:String}],
});
var MyOption = db.mongoose.model('Option', OptionSchema);

var BetterSchema = new db.Schema({
	eventId:String,
	optionId:String,
	matchId:String,
	matchName:String,
	optionName:String,
	betterName:String,
	betterAddress:String,
	betterAmount:String,
	winner:Number
});
var MyBetter = db.mongoose.model('Better', BetterSchema);

var MessageSchema = new db.Schema({
	from:String,
	content:String
});
var MyMessage = db.mongoose.model('Message', MessageSchema);


//functions
exports.addGroup = function(groupName, callback){
	MyGroup.find({groupName:groupName}, function(err,groups){
		if (err){
			callback(err);
		}else{
			if (groups.length==0){
				var instance = new MyGroup();
				instance.groupName = groupName;
				instance.events = [];
				instance.save(function (err) {
					if (err) {
						callback(err);
					}else{
						callback(null, instance);
					}
				});
			}else{
				callback(null,'found');
			}
		}
	});
}

exports.findGroup = function(groupName, callback){
	MyGroup.find({groupName:groupName}, function(err,groups){
		if (err){
			callback(err);
		}else{
			if (groups.length == 0){
				callback(null,'notfound');
			}else{
				callback(null,'found');
			}
		}
	});
}

exports.addEvent = function addEventFunction(groupName, eventName, eventPassword, eventCreator, options, callback){
	var eventInstance = new MyEvent();
	eventInstance.complete = false; //all events initialized as not yet having a winner
	var optionsInstance = [];
	for (var a=0; a<options.length; a++){
		(function(a){
			optionsInstance[a] = new MyOption();
			optionsInstance[a].optionName = options[a];
			optionsInstance[a].eventId = eventInstance.id;
			optionsInstance[a].groupName = groupName;
			optionsInstance[a].betters = [];
			optionsInstance[a].save(function(err){
				if (err){
					console.err;
				}
				if (a==options.length-1){
					eventInstance.eventName = eventName;
					eventInstance.eventCreator = eventCreator;
					eventInstance.groupName = groupName;
					for (var i = 0; i<options.length; i++){
						eventInstance.options[i]={identifier:optionsInstance[i].id};
					}
					eventInstance.messages = [];
					eventInstance.eventPassword = eventPassword;
					eventInstance.save(function(err){
						if (err){
							console.err;
						}
						MyGroup.update({groupName: groupName}, 
							{$push: {'events': {
										   identifier: eventInstance.id,
									   } }
							}, function(err,group){
								if (err){
									console.err;
								}else{
									optionNumber=0;
									callback(null, eventInstance.id)
								}
						});
						
					});
				}
			});
		})(a);
	}
}

exports.findGroupEvents = function(groupName, callback){
	MyGroup.findOne({groupName:groupName}, function(err,group){
		if (err){
			callback(err);
		}
		if (group.events.length==0){
			callback(null,[],[]);
		}
		var eventIds = [];
		for (var i=0; i<group.events.length; i++){
			eventIds.push(group.events[i].identifier.toString());
		}
		var events=[];
		var optionIds=[];
		var options=[]; //to be double array
		var eventNumber=0;
		var callReady = 0;
		for (var a=0;a<eventIds.length;a++){
			(function(a){
				MyEvent.findById(eventIds[a], function(err, eventy){
					if (err){
						callback(err);
					}
					events[a]=eventy;
					var thisEventOptIds = []
					for (var i=0; i<eventy.options.length; i++){
						thisEventOptIds.push(eventy.options[i].identifier);
						if (i==eventy.options.length-1){
							optionIds.push(thisEventOptIds);
						}
					}
					var thisEventOptions=[];
					var pushReady=0
					for (var b=0; b<thisEventOptIds.length; b++){
						(function(b){
							MyOption.findById(thisEventOptIds[b], function(err, opt){
								if (err){
									callback(err);
								}
								thisEventOptions[b]=opt;
								if (++pushReady==thisEventOptIds.length){
									options[a]=thisEventOptions;
								}
								if (++callReady==thisEventOptIds.length*eventIds.length){
									callback(null, events, options);
								}
							});
						})(b);
					}
				});
			})(a);
		}
	});
}

exports.findEvent = function(eventId, callback){
	MyEvent.findById(eventId, function(err, event){
		if (err){
			callback(err);
		}
		MyOption.find({eventId:eventId}).exec(function(err, options){
			if (err){
				callback(err);
			}
			MyBetter.find({eventId:eventId}, function(err, bets){
				if (err){
					callback(err);
				}
				if (bets==null){
					callback(null, event, options, []);
				}else{
					callback(null, event, options, bets);
				}
			});
		});
	});
}

exports.addBet = function(eventId, optionId, optionName, name, amount, address, callback){
	var betInstance = MyBetter();
	betInstance.betterName = name;
	betInstance.betterAmount = amount;
	betInstance.betterAddress = address;
	betInstance.optionId = optionId;
	betInstance.eventId = eventId;
	betInstance.optionName = optionName;
	betInstance.winner = 0;
	betInstance.matchId = null;
	betInstance.save(function(err){
		if (err){
			callback(err);
		}
		MyOption.update({_id: optionId}, 
			{$push: {'betters': {
						   identifier: betInstance.id,
					   } }
			}, function(err,option){
				if (err){
					callback(err);
				}else{
					callback(null);
				}
		});
	});
}

exports.addBetMatch = function(eventId, optionId, matchId, matchName, optionName, name, amount, address, callback){
	var betInstance = MyBetter();
	betInstance.betterName = name;
	betInstance.betterAmount = amount;
	betInstance.betterAddress = address;
	betInstance.optionId = optionId;
	betInstance.eventId = eventId;
	betInstance.optionName = optionName;
	betInstance.winner = 0;
	betInstance.matchId = matchId;
	betInstance.matchName = matchName;
	betInstance.save(function(err){
		if (err){
			callback(err);
		}
		MyBetter.findOne({_id:matchId}, function(err, betMatch){
			if (err){
				callback(err);
			}
			betMatch.matchId=betInstance.id;
			betMatch.matchName=name;
			betMatch.save(function(err){
				if (err){
					callback(err);
				}
				MyEvent.findOne({_id:eventId}, function(err, event){
					if (err){
						callback(err);
					}
					var oriBetterText = new sendgrid.Email();
					oriBetterText.to = betMatch.betterAddress;
					oriBetterText.setFrom('BetLog.co');
					oriBetterText.setSubject(event.eventName);
					oriBetterText.text = 'Oh boy! ' + name + ' has matched the bet you placed on ' + 
						betMatch.optionName + ' for ' + betMatch.betterAmount + '.';
					sendgrid.send(oriBetterText, function(err, result){
						if (err){
							callback(err);
						}
						MyOption.update({_id: optionId}, 
							{$push: {'betters': {
										   identifier: betInstance.id,
									   } }
							}, function(err,option){
								if (err){
									callback(err);
								}else{
									callback(null);
								}
						});
					});
				});
			});
		});
	});
}

exports.checkPassword = function(eventId, eventPassword, callback){
	MyEvent.findById(eventId, function(err, event){
		if (err){
			callback(err);
		}
		if (event.eventPassword==eventPassword){
			callback(null, true);
		}else if (event.eventPassword!=eventPassword){
			callback(null, false)
		}
	});
}

exports.declareWin = function(eventId, winOptId, loseOptId, callback){
	MyEvent.findOne({_id:eventId}, /*{complete:true},*/ function(err, event){
		if (err){
			callback(err);
		}
		event.complete = true;
		event.save(function(err){
			if (err){
				callback(err);
			}
		});
		var eventName = event.eventName;
		MyBetter.find({optionId:winOptId}, /*{winner:2}, {multi:true},*/ function(err, winningBets){
			if (err){
				callback(err);
			}
			var wineObject = new sendgrid.Email();
			for (var i=0; i<winningBets.length; i++){

				winningBets[i].winner=2;
				winningBets[i].save(function(err){
					if (err){
						callback(err);
					}
				});
				wineObject.to = winningBets[i].betterAddress;
				wineObject.setFrom('BetLog.co');
				wineObject.setSubject(eventName);
				if (winningBets[i].matchId == null){
					wineObject.text = 'Congratulations ' + winningBets[i].betterName +'! Your bet on ' + 
					winningBets[i].optionName + " has won. Unfortunately no one bet against you.";
				}else{
					wineObject.text = 'Congratulations ' + winningBets[i].betterName +'! Your bet on ' + 
					winningBets[i].optionName + " has won. It looks like " + winningBets[i].matchName +
					" owes you " + winningBets[i].betterAmount + ".";
				}
				sendgrid.send(wineObject);
			}

			MyBetter.find({optionId:loseOptId}, /*{winner:1}, {multi:true},*/ function(err, losingBets){
				if (err){
					callback(err);
				}
				var loseeObject = new sendgrid.Email();
				for (var i=0; i<losingBets.length; i++){
					losingBets[i].winner=1;
					losingBets[i].save(function(err){
						if (err){
							callback(err);
						}
					});
					loseeObject.to = losingBets[i].betterAddress;
					loseeObject.setFrom('BetLog.co');
					loseeObject.setSubject(eventName);
					if (winningBets[i].matchId == null){
						loseeObject.text ='Sorry ' + losingBets[i].betterName +
							', I regret to inform you that your bet on ' +
							losingBets[i].optionName + " has lost. Luckily no one bet against you!";
					}else{
						loseeObject.text ='Sorry ' + losingBets[i].betterName +
							', I regret to inform you that your bet on ' +
							losingBets[i].optionName + " has lost. Unfortunately you now owe " +
							losingBets[i].matchName + " " + losingBets[i].betterAmount + ".";
					}
					sendgrid.send(loseeObject);
				}
				callback(null);
			});
		});
	});	
}