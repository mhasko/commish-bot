"use strict";

const log = require('loglevel').getLogger('MakeMatch'),
    auth = require('../auth'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    messages = require('../data/messages'),
    roles = require('../data/roles'),
    consts = require('../app/constants');

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
            if (!!message.command && message.command.name === 'makematch' ) {
                if (!Helper.isBotChannel(message)) {
                    return true;
                }
                if (!Helper.isManagement(message)) {
                    return ['unauthorized', message.reply('You are not authorized to use this command.')];
                }
            }

            return false;
        });
    }

    async run(message, args) {
        let server = message.guild;
        let blueTeamRole = Helper.getRole(server, args[0]);
        let redTeamRole = Helper.getRole(server, args[1]);
        let commishBot = Helper.getRole(server, auth.user);
        const newChannelName = blueTeamRole.name + ' vs ' + redTeamRole.name;
        let options = {
            type: 'text',
            permissionOverwrites: [
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
            ]
        };

        async function categoryCheck(category) {
            if(category){
                // If this category doesn't exist, create it
                if(!server.channels.find('name', category)){
                     server.createChannel(category, "category").then(async newChannel => {
                         options.parent = newChannel;
                         return true;
                     })
                } else {
                    options.parent = server.channels.find('name', category);
                }
            }
            return true;
        }

        if(blueTeamRole && redTeamRole){
            await categoryCheck(args[2]).then(
                server.createChannel(newChannelName, options).then(async newChannel => {
                    newChannel.send(`${blueTeamRole} ${redTeamRole} This is the match channel.`);
                    newChannel.send(`${messages.newChannelMessage}`).then(sentMessage => {
                        sentMessage.react(consts.ReactionNumbers[0])
                            .then(() => sentMessage.react(consts.ReactionNumbers[1]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[2]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[3]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[4]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[5]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[6]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[7]))
                            .then(() => sentMessage.react(consts.ReactionNumbers[8]));

                    });
                }))
                .catch(err => message.channel.send(`Error in category check: ${err}`));

        } else {
            message.channel.send(`Error: Blue team was entered as ${blueTeamRole}`);
            message.channel.send(`Red team was entered as ${redTeamRole}`);
        }
    }
}

module.exports = MakeMatchCommand;
