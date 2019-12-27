"use strict";

const //log = require('loglevel').getLogger('MakeMatch'),
    auth = require('@root/auth'),
    Commando = require('discord.js-commando'),
    Helper = require('@app/helper'),
    strings = require('@data/strings'),
    roles = require('@data/roles'),
    consts = require('@app/constants');

class MakeMatchCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'makematch',
            group: consts.CommandGroup.ADMIN,
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
    async run(message) {
        const server = message.guild;
        const commishBot = Helper.getRole(server, auth.user);
        const pollBot = Helper.getRole(server, 'Pollmaster');
        const restrictedRole = Helper.getRole(server, 'Restricted');
        const reactionOptions = {max: 1, time: 25000, errors: ['time']};
        const optionFilter = (reaction, user) => {
            return consts.ReactionNumbers.some((hex) => reaction.emoji.name === hex) && user.id === message.author.id;
        };
        const numberOfOptions = ["Regular Season", "Playoffs", "Other"];

        let prefixString = '';

        async function categoryCheck(category, options) {
            if(category){
                // If this category doesn't exist, create it
                if(!server.channels.find( channel => channel.name === category)){ //'name', category)){
                    server.createChannel(category, "category").then(async newChannel => {
                        options.parent = newChannel;
                        return true;
                    })
                } else {
                    options.parent = server.channels.find(channel => channel.name === category); //'name', category)){
                }
            }
            return true;
        }

        async function createChannelWith(blueTeam, redTeam, division, channelPrefix){
            const divisionRefRole = Helper.getRole(server, division.divisionRole);
            let permissionArray = [
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
                }
            ];
            if(commishBot) {permissionArray.push({id: commishBot.id, allow: ['VIEW_CHANNEL']})}
            if(pollBot) {permissionArray.push({id: pollBot.id, allow: ['VIEW_CHANNEL']})}
            if(divisionRefRole) {permissionArray.push({id: divisionRefRole.id, allow: ['VIEW_CHANNEL']})}
            if(restrictedRole) {permissionArray.push({id: restrictedRole.id, deny: ['SEND_MESSAGES']})}

            let options = {
                type: 'text',
                permissionOverwrites: permissionArray
            };
            let prefix = '';
            if(channelPrefix){prefix = `${channelPrefix}`;}
            let newChannelName = `${prefix} ${blueTeam.name} vs ${redTeam.name}`;
            if (blueTeam && redTeam) {
                await categoryCheck(division.category, options).then(
                    server.createChannel(newChannelName, options).then(async newChannel => {
                        newChannel.send(`${blueTeam} ${redTeam} ${strings.newChannelMessage}`);
                    }))
                    .catch(err => message.channel.send(`Error in category check: ${err}`));

            } else {
                message.channel.send(`Error: Blue team was entered as ${blueTeam}`);
                message.channel.send(`Red team was entered as ${redTeam}`);
            }
        }

        // Prompt for and get match type (regualr season, playoffs, other)
        const matchTypeMessage = await message.channel.send(`${strings.makeMatchWizard.whatType}`);
        for (const [index, type] of numberOfOptions.entries()){
            await matchTypeMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const matchTypeCollected = await matchTypeMessage.awaitReactions(optionFilter, reactionOptions);
        const matchType = consts.ReactionNumbers.indexOf(matchTypeCollected.first().emoji.name);

        if(matchType === 1 || matchType === 2){
            // Prompt for and get week number
            const weekMessage = await message.channel.send("What week or playoff round is it?");
            for (const weekNum of consts.NumOfWeeks) {
                await weekMessage.react(consts.ReactionNumbers[weekNum]);
            }
            const weekNumCollected = await weekMessage.awaitReactions(optionFilter, reactionOptions);
            if(matchType === 1) {
                prefixString = `week ${consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name)}`;
            }
            if(matchType === 2) {
                prefixString = consts.NumOfPlayoffs[consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name)]
            }
        }

        // Prompt for and get division
        let divisionOptions = '';
        Object.keys(roles).forEach((key, index) => {
            divisionOptions += `${consts.ReactionNumbers[index + 1]}: ${key}   `
        });
        const divisionMessage = await message.channel.send(`${strings.makeMatchWizard.whatDivision}\n${divisionOptions}`);
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
        const homeTeamMessage = await message.channel.send(`${strings.makeMatchWizard.whatHomeTeam}\n${teamOptions}`);
        for(const [index, team] of Object.keys(division.teams).entries()){
            await homeTeamMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const homeCollected = await homeTeamMessage.awaitReactions(optionFilter, reactionOptions);
        let blueTeamRole = Helper.getRole(server, teamMap[ homeCollected.first().emoji.name]);

        // Prompt for and get red team info
        const awayTeamMessage = await message.channel.send(`${strings.makeMatchWizard.whatAwayTeam}\n${teamOptions}`);
        for(const [index, team] of Object.keys(division.teams).entries()){
            await awayTeamMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const awayCollected = await awayTeamMessage.awaitReactions(optionFilter, reactionOptions);
        let redTeamRole = Helper.getRole(server, teamMap[awayCollected.first().emoji.name]);

        //Finally, create the channel with all the info prompted for by the bot
        createChannelWith(blueTeamRole, redTeamRole, division, prefixString);
    }
}

module.exports = MakeMatchCommand;
