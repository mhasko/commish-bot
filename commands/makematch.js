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

    // Provide a wizard to walk the user through all the options
    async run(message, args) {
        const server = message.guild;
        const commishBot = Helper.getRole(server, auth.user);
        const pollBot = Helper.getRole(server, 'Pollmaster');
        const reactionOptions = {max: 1, time: 25000, errors: ['time']};
        const optionFilter = (reaction, user) => {
            return consts.ReactionNumbers.some((hex) => reaction.emoji.name === hex) && user.id === message.author.id;
        };

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

        // Prompt for and get week number
        const weekMessage = await message.channel.send("What week is it?");
        for (const weekNum of consts.NumOfWeeks) {
            await weekMessage.react(consts.ReactionNumbers[weekNum]);
        }
        const weekNumCollected = await weekMessage.awaitReactions(optionFilter, reactionOptions)
        const weekNum = consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name);

        // Prompt for and get division
        let divisionOptions = '';
        Object.keys(roles).forEach((key, index) => {
            divisionOptions += `${consts.ReactionNumbers[index + 1]}: ${key}   `
        });
        const divisionMessage = await message.channel.send(`${messages.wizard.whatDivision}\n${divisionOptions}`);
        for(const [index, div] of Object.keys(roles).entries()){
            await divisionMessage.react(consts.ReactionNumbers[index + 1])
        }
        const divisionCollected = await divisionMessage.awaitReactions(optionFilter, reactionOptions);
        const division = roles[consts.Divisions[divisionCollected.first().emoji.name]];

        // Init the team map options for the next two prompts
        let teamOptions = '';
        const teamMap = {};  //team map will be the same for blue team and red team selections
        Object.keys(division.teams).forEach((team, index) => {
            teamOptions += `${consts.ReactionNumbers[index + 1]}: ${division.teams[team].name}\n`;
            teamMap[consts.ReactionNumbers[index + 1]] = division.teams[team].discordRole;
        });

        // Prompt for and get blue team info
        const homeTeamMessage = await message.channel.send(`${messages.wizard.whatHomeTeam}\n${teamOptions}`);
        for(const [index, team] of Object.keys(division.teams).entries()){
            await homeTeamMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const homeCollected = await homeTeamMessage.awaitReactions(optionFilter, reactionOptions);
        let blueTeamRole = Helper.getRole(server, teamMap[ homeCollected.first().emoji.name]);

        // Prompt for and get red team info
        const awayTeamMessage = await message.channel.send(`${messages.wizard.whatAwayTeam}\n${teamOptions}`);
        for(const [index, team] of Object.keys(division.teams).entries()){
            await awayTeamMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const awayCollected = await awayTeamMessage.awaitReactions(optionFilter, reactionOptions)
        let redTeamRole = Helper.getRole(server, teamMap[awayCollected.first().emoji.name]);

        //Finally, create the channel with all the info prompted for by the bot
        createChannelWith(blueTeamRole, redTeamRole, division, weekNum);
    }
}

module.exports = MakeMatchCommand;
