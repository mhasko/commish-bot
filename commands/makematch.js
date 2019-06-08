"use strict";

const log = require('loglevel').getLogger('MakeMatch'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    roles = require('../data/roles');

class MakeMatchCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'makematch',
            group: 'admin',
            memberName: 'makematch',
            aliases: ['matchmake'],
            description: 'Make a match channel for 2 teams',
            details: '',
            examples: ['\t!makematch'],
            guildOnly: true,
            argsType: 'multiple'
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'makematch') {
                if (!Helper.isManagement(message)) {
                    return ['unauthorized', message.reply('You are not authorized to use this command.')];
                }
            }

            return false;
        });
    }

    async run(message, args) {
        var server = message.guild;

        var blueTeamRole = server.roles.find('name', args[0]);
        var redTeamRole = server.roles.find('name', args[1]);
        var commishBot = server.roles.find('name', 'commish-bot');

        if(blueTeamRole && redTeamRole){
            var newChannelName = blueTeamRole.name + ' vs ' + redTeamRole.name
            server.createChannel(newChannelName, "text", [
                {
                    id: server.defaultRole.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: blueTeamRole.id,
                    allow: ['VIEW_CHANNEL'],
                },
                {
                    id: redTeamRole.id,
                    allow: ['VIEW_CHANNEL'],
                },
                {
                    id: commishBot.id,
                    allow: ['VIEW_CHANNEL']
                }
            ]).then(async newChannel => {
                newChannel.send(`Blue team was entered as ${blueTeamRole}`);
                newChannel.send(`Red team was entered as ${redTeamRole}`);
            })

        } else {
            message.channel.send(`Error: Blue team was entered as ${blueTeamRole}`);
            message.channel.send(`Red team was entered as ${redTeamRole}`);
        }
    }
}

module.exports = MakeMatchCommand;
