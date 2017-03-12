const EventEmitter = require('events');

class FakeDiscordClient extends EventEmitter {
    constructor() {
        super()
        var self = this;
        this.channels = {
            find() {
                return {
                    sendMessage(msg) {
                        console.log(`[${self.user.__id}] <${self.user.username}> ${msg}`);
                        return new Promise(function(fulfill, reject){
                            fulfill();
                        });
                    },
                    startTyping(){},
                    stopTyping(){}
                }
            }
        };
        this.user = {
            __id: require('crypto').randomBytes(48).toString('hex').substr(0, 6),
            username: '????',
            setUsername: function(newname) {
                this.username = newname;
                return new Promise(function(fulfill, reject){
                    fulfill();
                });
            },
            setGame: function(){},
            setStatus: function(){}
        }

        setTimeout(function(){
            self.emit('ready');
        }, 100);
    }

    login() {
        console.log(`[STUB] login(...)`);
    }
}

var lib = {
    Client: FakeDiscordClient
}


module.exports = lib;