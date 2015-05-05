// Generated by CoffeeScript 1.9.2
(function() {
  var BetterSchema, EventSchema, GroupSchema, MyBetter, MyEvent, MyGroup, MyOption, ObjectId, OptionSchema, app, db, sendgrid;

  db = require('../db');

  ObjectId = db.Schema.Types.ObjectId;

  app = require('../app');

  sendgrid = require('sendgrid')(process.env.SENDGRIDUSER, process.env.SENDGRIDPASS);


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

  GroupSchema = new db.Schema({
    groupName: {
      type: String,
      index: {
        unique: true
      }
    },
    events: [
      {
        identifier: String
      }
    ]
  });

  MyGroup = db.mongoose.model('Group', GroupSchema);

  EventSchema = new db.Schema({
    eventName: String,
    groupName: String,
    eventPassword: String,
    eventCreator: String,
    complete: Boolean,
    options: [
      {
        identifier: String
      }
    ],
    messages: [
      {
        identifier: String
      }
    ]
  });

  MyEvent = db.mongoose.model('Event', EventSchema);

  OptionSchema = new db.Schema({
    groupName: String,
    eventId: String,
    eventName: String,
    optionName: String,
    betters: [
      {
        identifier: String
      }
    ]
  });

  MyOption = db.mongoose.model('Option', OptionSchema);

  BetterSchema = new db.Schema({
    eventId: String,
    optionId: String,
    matchId: String,
    matchName: String,
    optionName: String,
    betterName: String,
    betterAddress: String,
    betterAmount: String,
    winner: Number
  });

  MyBetter = db.mongoose.model('Better', BetterSchema);

  exports.addGroup = function(groupName, callback) {
    MyGroup.find({
      groupName: groupName
    }, function(err, groups) {
      var instance;
      if (err) {
        callback(err);
      } else {
        if (groups.length === 0) {
          instance = new MyGroup;
          instance.groupName = groupName;
          instance.events = [];
          instance.save(function(err) {
            if (err) {
              callback(err);
            } else {
              callback(null, instance);
            }
          });
        } else {
          callback(null, 'found');
        }
      }
    });
  };

  exports.findGroup = function(groupName, callback) {
    MyGroup.find({
      groupName: groupName
    }, function(err, groups) {
      if (err) {
        callback(err);
      } else {
        if (groups.length === 0) {
          callback(null, 'notfound');
        } else {
          callback(null, 'found');
        }
      }
    });
  };

  exports.addEvent = function(groupName, eventName, eventPassword, eventCreator, options, callback) {
    var a, eventInstance, optionsInstance;
    eventInstance = new MyEvent;
    eventInstance.complete = false;
    optionsInstance = [];
    a = 0;
    while (a < options.length) {
      (function(a) {
        optionsInstance[a] = new MyOption;
        optionsInstance[a].optionName = options[a];
        optionsInstance[a].eventId = eventInstance.id;
        optionsInstance[a].groupName = groupName;
        optionsInstance[a].betters = [];
        optionsInstance[a].save(function(err) {
          var i;
          if (err) {
            console.err;
          }
          if (a === options.length - 1) {
            eventInstance.eventName = eventName;
            eventInstance.eventCreator = eventCreator;
            eventInstance.groupName = groupName;
            i = 0;
            while (i < options.length) {
              eventInstance.options[i] = {
                identifier: optionsInstance[i].id
              };
              i++;
            }
            eventInstance.messages = [];
            eventInstance.eventPassword = eventPassword;
            eventInstance.save(function(err) {
              if (err) {
                console.err;
              }
              MyGroup.update({
                groupName: groupName
              }, {
                $push: {
                  'events': {
                    identifier: eventInstance.id
                  }
                }
              }, function(err, group) {
                var optionNumber;
                if (err) {
                  console.err;
                } else {
                  optionNumber = 0;
                  callback(null, eventInstance.id);
                }
              });
            });
          }
        });
      })(a);
      a++;
    }
  };

  exports.findGroupEvents = function(groupName, callback) {
    MyGroup.findOne({
      groupName: groupName
    }, function(err, group) {
      var a, callReady, eventIds, eventNumber, events, i, optionIds, options;
      if (err) {
        callback(err);
      }
      if (group.events.length === 0) {
        callback(null, [], []);
      }
      eventIds = [];
      i = 0;
      while (i < group.events.length) {
        eventIds.push(group.events[i].identifier.toString());
        i++;
      }
      events = [];
      optionIds = [];
      options = [];
      eventNumber = 0;
      callReady = 0;
      a = 0;
      while (a < eventIds.length) {
        (function(a) {
          MyEvent.findById(eventIds[a], function(err, eventy) {
            var i;
            var b, pushReady, thisEventOptIds, thisEventOptions;
            if (err) {
              callback(err);
            }
            events[a] = eventy;
            thisEventOptIds = [];
            i = 0;
            while (i < eventy.options.length) {
              thisEventOptIds.push(eventy.options[i].identifier);
              if (i === eventy.options.length - 1) {
                optionIds.push(thisEventOptIds);
              }
              i++;
            }
            thisEventOptions = [];
            pushReady = 0;
            b = 0;
            while (b < thisEventOptIds.length) {
              (function(b) {
                MyOption.findById(thisEventOptIds[b], function(err, opt) {
                  if (err) {
                    callback(err);
                  }
                  thisEventOptions[b] = opt;
                  if (++pushReady === thisEventOptIds.length) {
                    options[a] = thisEventOptions;
                  }
                  if (++callReady === thisEventOptIds.length * eventIds.length) {
                    callback(null, events, options);
                  }
                });
              })(b);
              b++;
            }
          });
        })(a);
        a++;
      }
    });
  };

  exports.findEvent = function(eventId, callback) {
    MyEvent.findById(eventId, function(err, event) {
      if (err) {
        callback(err);
      }
      MyOption.find({
        eventId: eventId
      }).exec(function(err, options) {
        if (err) {
          callback(err);
        }
        MyBetter.find({
          eventId: eventId
        }, function(err, bets) {
          if (err) {
            callback(err);
          }
          if (bets === null) {
            callback(null, event, options, []);
          } else {
            callback(null, event, options, bets);
          }
        });
      });
    });
  };

  exports.addBet = function(eventId, optionId, optionName, name, amount, address, callback) {
    var betInstance;
    betInstance = MyBetter();
    betInstance.betterName = name;
    betInstance.betterAmount = amount;
    betInstance.betterAddress = address;
    betInstance.optionId = optionId;
    betInstance.eventId = eventId;
    betInstance.optionName = optionName;
    betInstance.winner = 0;
    betInstance.matchId = null;
    betInstance.save(function(err) {
      if (err) {
        callback(err);
      }
      MyOption.update({
        _id: optionId
      }, {
        $push: {
          'betters': {
            identifier: betInstance.id
          }
        }
      }, function(err, option) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    });
  };

  exports.addBetMatch = function(eventId, optionId, matchId, matchName, optionName, name, amount, address, callback) {
    var betInstance;
    betInstance = MyBetter();
    betInstance.betterName = name;
    betInstance.betterAmount = amount;
    betInstance.betterAddress = address;
    betInstance.optionId = optionId;
    betInstance.eventId = eventId;
    betInstance.optionName = optionName;
    betInstance.winner = 0;
    betInstance.matchId = matchId;
    betInstance.matchName = matchName;
    betInstance.save(function(err) {
      if (err) {
        callback(err);
      }
      MyBetter.findOne({
        _id: matchId
      }, function(err, betMatch) {
        if (err) {
          callback(err);
        }
        betMatch.matchId = betInstance.id;
        betMatch.matchName = name;
        betMatch.save(function(err) {
          if (err) {
            callback(err);
          }
          MyEvent.findOne({
            _id: eventId
          }, function(err, event) {
            var oriBetterText;
            if (err) {
              callback(err);
            }
            oriBetterText = new sendgrid.Email;
            oriBetterText.to = betMatch.betterAddress;
            oriBetterText.setFrom('BetLog.co');
            oriBetterText.setSubject(event.eventName);
            oriBetterText.text = 'Oh boy! ' + name + ' has matched the bet you placed on ' + betMatch.optionName + ' for ' + betMatch.betterAmount + '.';
            sendgrid.send(oriBetterText, function(err, result) {
              if (err) {
                callback(err);
              }
              MyOption.update({
                _id: optionId
              }, {
                $push: {
                  'betters': {
                    identifier: betInstance.id
                  }
                }
              }, function(err, option) {
                if (err) {
                  callback(err);
                } else {
                  callback(null);
                }
              });
            });
          });
        });
      });
    });
  };

  exports.checkPassword = function(eventId, eventPassword, callback) {
    MyEvent.findById(eventId, function(err, event) {
      if (err) {
        callback(err);
      }
      if (event.eventPassword === eventPassword) {
        callback(null, true);
      } else if (event.eventPassword !== eventPassword) {
        callback(null, false);
      }
    });
  };

  exports.declareWin = function(eventId, winOptId, loseOptId, callback) {
    MyEvent.findOne({
      _id: eventId
    }, function(err, event) {
      var eventName;
      if (err) {
        callback(err);
      }
      event.complete = true;
      event.save(function(err) {
        if (err) {
          callback(err);
        }
      });
      eventName = event.eventName;
      MyBetter.find({
        optionId: winOptId
      }, function(err, winningBets) {
        var i, wineObject;
        if (err) {
          callback(err);
        }
        wineObject = new sendgrid.Email;
        i = 0;
        while (i < winningBets.length) {
          winningBets[i].winner = 2;
          winningBets[i].save(function(err) {
            if (err) {
              callback(err);
            }
          });
          wineObject.to = winningBets[i].betterAddress;
          wineObject.setFrom('BetLog.co');
          wineObject.setSubject(eventName);
          if (winningBets[i].matchId === null) {
            wineObject.text = 'Congratulations ' + winningBets[i].betterName + '! Your bet on ' + winningBets[i].optionName + ' has won. Unfortunately no one bet against you.';
          } else {
            wineObject.text = 'Congratulations ' + winningBets[i].betterName + '! Your bet on ' + winningBets[i].optionName + ' has won. It looks like ' + winningBets[i].matchName + ' owes you ' + winningBets[i].betterAmount + '.';
          }
          sendgrid.send(wineObject);
          i++;
        }
        MyBetter.find({
          optionId: loseOptId
        }, function(err, losingBets) {
          var i;
          var loseeObject;
          if (err) {
            callback(err);
          }
          loseeObject = new sendgrid.Email;
          i = 0;
          while (i < losingBets.length) {
            losingBets[i].winner = 1;
            losingBets[i].save(function(err) {
              if (err) {
                callback(err);
              }
            });
            loseeObject.to = losingBets[i].betterAddress;
            loseeObject.setFrom('BetLog.co');
            loseeObject.setSubject(eventName);
            if (winningBets[i].matchId === null) {
              loseeObject.text = 'Sorry ' + losingBets[i].betterName + ', I regret to inform you that your bet on ' + losingBets[i].optionName + ' has lost. Luckily no one bet against you!';
            } else {
              loseeObject.text = 'Sorry ' + losingBets[i].betterName + ', I regret to inform you that your bet on ' + losingBets[i].optionName + ' has lost. Unfortunately you now owe ' + losingBets[i].matchName + ' ' + losingBets[i].betterAmount + '.';
            }
            sendgrid.send(loseeObject);
            i++;
          }
          callback(null);
        });
      });
    });
  };

}).call(this);
