var FAKE_DISCORD = false;
var config = require('./config.json');
var CHANNELNAME = config.channelName;
var DIRECTOR_TOKEN = "Bot " + config.directorToken;
var ACTOR1_TOKEN = "Bot " + config.actor1Token;
var ACTOR2_TOKEN = "Bot " + config.actor2Token;

///////

var fetch = require('node-fetch');
var q = require('q');
var _ = require('lodash');
var xml2js = require('xml2js');
var fs = require('fs');
var Discord = require("discord.js");
if (FAKE_DISCORD) {
    Discord = require("./lib/fakeDiscord.js");
}

var hamlet;
xml2js.parseString(fs.readFileSync('hamlet.xml').toString(), function(err, res) {
    hamlet = res;
});

var director, actor1, actor2;
director = new Discord.Client();
actor1 = new Discord.Client();
actor2 = new Discord.Client();
var actors = [actor1, actor2];

var actor_last_speaker = undefined;
var remaining_speech = [];
var paused = false;

var getActor = function(speaker) {
    var next = actors.shift();
    if (actor_last_speaker === speaker || actor_last_speaker === undefined) {
        actors.unshift(next);
    } else {
        actors.push(next);
        next = actors.shift();
        actors.unshift(next);
    }
    actor_last_speaker = speaker;
    return next;
}

var speak = function(speaker, line, duration) {
    /*
    Speak a single thing:
    1) set the nickname
    2) start typing
    3) send message
    4) stop typing
    */
    var actor = getActor(speaker);
    actor.guilds.first().member(actor.user).setNickname(speaker).then(function(){
        var channel = actor.channels.find('name', CHANNELNAME);
        channel.startTyping();
        setTimeout(function(){
            channel.sendMessage(line);
            channel.stopTyping(true);
        }, duration);
    }).catch(function(err){
        console.error(err);
    });
};

var doPlay = function() {
    var speakNext = function() {
        if (!paused) {
            var speech = remaining_speech.shift();
            var duration = speech.line.split(" ").length * 500;
            speak(speech.speaker, speech.line, duration);
            setTimeout(speakNext, duration + 500);
        }
    }
    speakNext();
};

var preparePlay = function() {
    _.each([director, actor2, actor2], function(client) {
        client.user.setGame('hamlet').then(function(){console.log('set game to Hamlet')}).catch(console.warn);
        client.user.setStatus('dnd').then(function(){console.log('set status to dnd')}).catch(console.warn);
    });

    _.each(hamlet.PLAY.ACT[0].SCENE[0].SPEECH, function(speech){
        var speaker = _.join(speech.SPEAKER, ' '); // todo: proper multi-speaker support.
        _.each(speech.LINE, function(line) {
            remaining_speech.push({speaker: speaker, line: line});
        });
    });
};

var play = function() {
      preparePlay();
      doPlay();
}

director.on('ready', () => {
  setTimeout(function(){
      if (FAKE_DISCORD) {
          play();
      }
  }, 100);
});

director.on('message', (msg) => {
    if (msg.content === '!hamlet') {
        play();
    }
    if (msg.content === "!pause") {
        paused = true;
    }
    if (msg.content === "!resume" && paused === true) {
        paused = false;
        doPlay();
    }
});

_.each([director, actor1, actor2], function(client) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.username}!`);
    });
});

director.login(DIRECTOR_TOKEN);
actor1.login(ACTOR1_TOKEN);
actor2.login(ACTOR2_TOKEN);