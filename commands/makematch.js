"use strict";

const //log = require('loglevel').getLogger('MakeMatch'),
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
        const server = message.guild;
        const commishBot = Helper.getRole(server, auth.user);
        const pollBot = Helper.getRole(server, 'Pollmaster');


        async function categoryCheck(category, options) {
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

        async function createChannelWith(blueTeam, redTeam, division, weekNum){
            const divisionRefRole = Helper.getRole(server, division.divisionRole);
            let options = {
                type: 'text',
                permissionOverwrites: [
                    {
                        id: server.defaultRole.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: blueTeam.id,
                        allow: ['VIEW_CHANNEL'],
                    },
                    {
                        id: redTeam.id,
                        allow: ['VIEW_CHANNEL'],
                    },
                    {
                        id: commishBot.id,
                        allow: ['VIEW_CHANNEL']
                    },
                    {
                        id: pollBot.id,
                        allow: ['VIEW_CHANNEL']
                    },
                    {
                        id: divisionRefRole.id,
                        allow: ['VIEW_CHANNEL']
                    }
                ]
            };
            let prefixNum = '';
            if(weekNum){prefixNum = `week ${weekNum}`;}
            let newChannelName = `${prefixNum} ${blueTeam.name} vs ${redTeam.name}`;
            if (blueTeam && redTeam) {
                await categoryCheck(division.category, options).then(
                    server.createChannel(newChannelName, options).then(async newChannel => {
                        newChannel.send(`${blueTeam} ${redTeam} ${messages.newChannelMessage}`);
                        // newChannel.send(`${messages.newChannelMessage}`).then(sentMessage => {
                        //     sentMessage.react(consts.ReactionNumbers[0])
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[1]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[2]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[3]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[4]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[5]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[6]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[7]))
                        //         .then(() => sentMessage.react(consts.ReactionNumbers[8]));
                        //
                        // });
                    }))
                    .catch(err => message.channel.send(`Error in category check: ${err}`));

            } else {
                message.channel.send(`Error: Blue team was entered as ${blueTeam}`);
                message.channel.send(`Red team was entered as ${redTeam}`);
            }
        }

        // Proived a wizard to walk the user through all the options
        const optionFilter = (reaction, user) => {
            return consts.ReactionNumbers.some((hex) => reaction.emoji.name === hex) && user.id === message.author.id;
        };

        message.channel.send("What week is it?").then(weekMessage => {
            weekMessage.react(consts.ReactionNumbers[1])
                .then(() => weekMessage.react(consts.ReactionNumbers[2]))
                .then(() => weekMessage.react(consts.ReactionNumbers[3]))
                .then(() => weekMessage.react(consts.ReactionNumbers[4]))
                .then(() => weekMessage.react(consts.ReactionNumbers[5]))
                .then(() => weekMessage.react(consts.ReactionNumbers[6]))
                .then(() => weekMessage.react(consts.ReactionNumbers[7]));

            weekMessage.awaitReactions(optionFilter, {max: 1, time: 25000, errors: ['time']})
                .then(weekNumCollected => {
                    const weekNum = consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name);

                    let divisionOptions = '';
                    Object.keys(roles).forEach((key, index) => {
                        divisionOptions += `${consts.ReactionNumbers[index+1]}: ${key}   `
                    });
                    message.channel.send(`${messages.wizard.whatDivision}\n${divisionOptions}`).then(divisionMessage => {
                        divisionMessage.react(consts.ReactionNumbers[1])
                            .then(() => divisionMessage.react(consts.ReactionNumbers[2]))
                            .then(() => divisionMessage.react(consts.ReactionNumbers[3]))
                            .then(() => divisionMessage.react(consts.ReactionNumbers[4]));

                        divisionMessage.awaitReactions(optionFilter, {max: 1, time: 25000, errors: ['time']})
                            .then(collected => {
                                let teamOptions = '';
                                const teamMap = {};
                                const reaction = collected.first();
                                const division = roles[consts.Divisions[reaction.emoji.name]];
                                Object.keys(division.teams).forEach((team, index) => {
                                    teamOptions += `${consts.ReactionNumbers[index + 1]}: ${division.teams[team].name}\n`;
                                    teamMap[consts.ReactionNumbers[index + 1]] = division.teams[team].discordRole;
                                });
                                message.channel.send(`${messages.wizard.whatHomeTeam}\n${teamOptions}`).then(homeTeamMessage => {
                                    homeTeamMessage.react(consts.ReactionNumbers[1])
                                        .then(() => homeTeamMessage.react(consts.ReactionNumbers[2]))
                                        .then(() => homeTeamMessage.react(consts.ReactionNumbers[3]))
                                        .then(() => homeTeamMessage.react(consts.ReactionNumbers[4]))
                                        .then(() => homeTeamMessage.react(consts.ReactionNumbers[5]))
                                        .then(() => homeTeamMessage.react(consts.ReactionNumbers[6]))
                                        .then(() => {
                                            if (Object.keys(division.teams).length === 7) {
                                                homeTeamMessage.react(consts.ReactionNumbers[7])
                                            }
                                        });

                                    homeTeamMessage.awaitReactions(optionFilter, {
                                        max: 1,
                                        time: 25000,
                                        errors: ['time']
                                    })
                                        .then(homeCollected => {
                                            const reaction = homeCollected.first();
                                            let blueTeamRole = Helper.getRole(server, teamMap[reaction.emoji.name]);
                                            message.channel.send(`${messages.wizard.whatAwayTeam}\n${teamOptions}`).then(awayTeamMessage => {
                                                awayTeamMessage.react(consts.ReactionNumbers[1])
                                                    .then(() => awayTeamMessage.react(consts.ReactionNumbers[2]))
                                                    .then(() => awayTeamMessage.react(consts.ReactionNumbers[3]))
                                                    .then(() => awayTeamMessage.react(consts.ReactionNumbers[4]))
                                                    .then(() => awayTeamMessage.react(consts.ReactionNumbers[5]))
                                                    .then(() => awayTeamMessage.react(consts.ReactionNumbers[6]))
                                                    .then(() => {
                                                        if (Object.keys(division.teams).length === 7) {
                                                            awayTeamMessage.react(consts.ReactionNumbers[7])
                                                        }
                                                    });

                                                awayTeamMessage.awaitReactions(optionFilter, {
                                                    max: 1,
                                                    time: 25000,
                                                    errors: ['time']
                                                })
                                                    .then(awayCollected => {
                                                        const reaction = awayCollected.first();
                                                        let redTeamRole = Helper.getRole(server, teamMap[reaction.emoji.name]);
                                                        createChannelWith(blueTeamRole, redTeamRole, division, weekNum);
                                                    })
                                            });
                                        });
                                });

                            });
                    });
                });
        });

    }
}

module.exports = MakeMatchCommand;
