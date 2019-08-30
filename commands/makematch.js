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
        let commishBot = Helper.getRole(server, auth.user);

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

        if(args.length === 2) {
            let blueTeamRole = Helper.getRole(server, args[0]);
            let redTeamRole = Helper.getRole(server, args[1]);
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
            let newChannelName = blueTeamRole.name + ' vs ' + redTeamRole.name;
            if (blueTeamRole && redTeamRole) {
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
        else {

            let divisionOptions = '';
            Object.keys(roles).forEach((key, index) => {
                divisionOptions += `${consts.ReactionNumbers[index+1]}: ${key}   `
            });
            message.channel.send(`${messages.wizard.whatDivision}\n${divisionOptions}`).then(divisionMessage => {
                divisionMessage.react(consts.ReactionNumbers[1])
                    .then(() => divisionMessage.react(consts.ReactionNumbers[2]))
                    .then(() => divisionMessage.react(consts.ReactionNumbers[3]))
                    .then(() => divisionMessage.react(consts.ReactionNumbers[4]));

                const optionFilter = (reaction, user) => {
                    return  consts.ReactionNumbers.some((hex) => reaction.emoji.name === hex) && user.id === message.author.id;
                };
                divisionMessage.awaitReactions(optionFilter, {max: 1, time: 10000, errors: ['time']})
                    .then(collected => {
                        let teamOptions = '';
                        const teamMap = {};
                        const reaction = collected.first();
                        const division = roles[consts.Divisions[reaction.emoji.name]];
                        Object.keys(division.teams).forEach( (team, index) => {
                            teamOptions += `${consts.ReactionNumbers[index+1]}: ${division.teams[team].name}\n`
                            teamMap[consts.ReactionNumbers[index+1]] = division.teams[team].discordRole;
                        });
                        message.channel.send(`${messages.wizard.whatHomeTeam}\n${teamOptions}`).then(homeTeamMessage => {
                            homeTeamMessage.react(consts.ReactionNumbers[1])
                                .then(() => homeTeamMessage.react(consts.ReactionNumbers[2]))
                                .then(() => homeTeamMessage.react(consts.ReactionNumbers[3]))
                                .then(() => homeTeamMessage.react(consts.ReactionNumbers[4]))
                                .then(() => homeTeamMessage.react(consts.ReactionNumbers[5]))
                                .then(() => homeTeamMessage.react(consts.ReactionNumbers[6]))
                                .then(() => {
                                    if(division.teams.length === 7){
                                        homeTeamMessage.react(consts.ReactionNumbers[7])
                                    }
                                });

                            homeTeamMessage.awaitReactions(optionFilter, {max: 1, time: 10000, errors: ['time']})
                                .then(homeCollected => {
                                    const reaction = homeCollected.first();
                                    let blueTeamRole = Helper.getRole(server, teamMap[reaction.emoji.name]);
                                    // let redTeamRole = Helper.getRole(server, args[1]);
                                    message.channel.send(`${messages.wizard.whatAwayTeam}\n${teamOptions}`).then(awayTeamMessage => {
                                        awayTeamMessage.react(consts.ReactionNumbers[1])
                                            .then(() => awayTeamMessage.react(consts.ReactionNumbers[2]))
                                            .then(() => awayTeamMessage.react(consts.ReactionNumbers[3]))
                                            .then(() => awayTeamMessage.react(consts.ReactionNumbers[4]))
                                            .then(() => awayTeamMessage.react(consts.ReactionNumbers[5]))
                                            .then(() => awayTeamMessage.react(consts.ReactionNumbers[6]))
                                            .then(() => {
                                                if(division.teams.length === 7){
                                                    awayTeamMessage.react(consts.ReactionNumbers[7])
                                                }
                                            });

                                        awayTeamMessage.awaitReactions(optionFilter, {max: 1, time: 10000, errors: ['time']})
                                            .then(awayCollected => {
                                            const reaction = awayCollected.first();
                                            let redTeamRole = Helper.getRole(server, teamMap[reaction.emoji.name]);
                                            // let blueTeamRole = Helper.getRole(server, args[0]);
                                            // let redTeamRole = Helper.getRole(server, args[1]);
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
                                            let newChannelName = blueTeamRole.name + ' vs ' + redTeamRole.name;
                                            if (blueTeamRole && redTeamRole) {
                                                /*await*/ categoryCheck(args[2]).then(
                                                    server.createChannel(newChannelName, options).then(async newChannel => {
                                                        newChannel.send(`${blueTeamRole} ${redTeamRole} This is the match channel.`);
                                                    }))
                                                    .catch(err => message.channel.send(`Error in category check: ${err}`));

                                            } else {
                                                message.channel.send(`Error: Blue team was entered as ${blueTeamRole}`);
                                                message.channel.send(`Red team was entered as ${redTeamRole}`);
                                            }
                                        })
                                    });
                                });
                        });

                    });
            });
        }
    }
}

module.exports = MakeMatchCommand;
