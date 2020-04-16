"use strict";

const Commando = require('discord.js-commando'),
    auth = require('@root/auth'),
    consts = require('@app/constants'),
    Helper = require('@app/helper'),
    roles = require('@data/roles'),
    settings = require('@data/settings'),
    strings = require('@data/strings');

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
        const modRole = Helper.getRole(server, settings.roles.mod);
        const restrictedRole = Helper.getRole(server, 'Restricted');
        const captainRole = Helper.getRole(server, 'Captain');
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

        async function createByeWeekWith(team, division, channelPrefix, channel) {
            if(!team || !division){
                channel.send(`Error generating channel, canceling out.  Team is ${team} Division is ${division}`)
            }

            let prefix = '';
            if(channelPrefix){prefix = `${channelPrefix}`;}
            const newChannelName = `${consts.Emoji.CHECKMARK}${prefix} -- BYE WEEK! -- ${team.name}`;
            const newChannelMessage = `${team} ${strings.makeMatchWizard.newChannelMessageBye}`;
            await createChannel(newChannelName, newChannelMessage, [team.id], division, channel);
        }

        async function createMatchChannelWith(blueTeam, redTeam, division, channelPrefix, channel) {
            if (!blueTeam || !redTeam || !division) {
                channel.send(`Error generating channel, canceling out.  Blueteam is ${blueTeam}  Redteam is ${redTeam} Division is ${division}`)
            }
            const teamIds = [blueTeam.id, redTeam.id];

            let prefix = '';
            if (channelPrefix) {prefix = `${channelPrefix}`;}
            const newChannelName = `${consts.Emoji.QUESTIONMARK}${prefix} ${blueTeam.name} vs ${redTeam.name}`;
            const newChannelMessage = `${blueTeam} ${redTeam} ${strings.makeMatchWizard.newChannelMessage}`;
            await createChannel(newChannelName, newChannelMessage, teamIds, division, channel);
        }

        async function createChannel(newChannelName, newMessage, teamIds, division, channel){
            const divisionRefRole = Helper.getRole(server, division.divisionRole);
            let permissionArray = [
                {
                    id: server.defaultRole.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                }
            ];
            teamIds.forEach(teamId => {
                permissionArray.push(             {
                    id: teamId,
                    allow: ['VIEW_CHANNEL'],
                });
            });
            if(commishBot) {permissionArray.push({id: commishBot.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']})}
            if(pollBot) {permissionArray.push({id: pollBot.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']})}
            if(divisionRefRole) {permissionArray.push({id: divisionRefRole.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']})}
            if(modRole) {permissionArray.push({id: modRole.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']})}
            if(restrictedRole) {permissionArray.push({id: restrictedRole.id, deny: ['SEND_MESSAGES']})}
            if(captainRole) {permissionArray.push({id: captainRole.id, allow: ['SEND_MESSAGES']})}

            let options = {
                type: 'text',
                permissionOverwrites: permissionArray
            };
            await categoryCheck(division.category, options).then(
                server.createChannel(newChannelName, options).then(async newChannel => {
                    // newChannel.send(`${blueTeam} ${redTeam} ${strings.newChannelMessage}`);
                    newChannel.send(newMessage);
                }))
                .catch(err => message.channel.send(`Error in category check: ${err}`));
        }

        // Prompt for and get match type (regualr season, playoffs, other)
        const matchTypeMessage = await message.channel.send(`${strings.makeMatchWizard.whatType}`);
        for (const [index, type] of numberOfOptions.entries()){
            await matchTypeMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const matchTypeCollected = await matchTypeMessage.awaitReactions(optionFilter, reactionOptions);
        const matchType = consts.ReactionNumbers.indexOf(matchTypeCollected.first().emoji.name);

        if(matchType === consts.MatchTypes.WEEKLY || matchType === consts.MatchTypes.PLAYOFFS){
            // Prompt for and get week number
            const weekMessage = await message.channel.send("What week or playoff round is it?");
            for (const weekNum of consts.NumOfWeeks) {
                await weekMessage.react(consts.ReactionNumbers[weekNum]);
            }
            const weekNumCollected = await weekMessage.awaitReactions(optionFilter, reactionOptions);
            if(matchType === consts.MatchTypes.WEEKLY || matchType === consts.MatchTypes.BYE) {
                prefixString = `week ${consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name)}`;
            }
            if(matchType === consts.MatchTypes.PLAYOFFS) {
                prefixString = consts.NumOfPlayoffs[consts.ReactionNumbers.indexOf(weekNumCollected.first().emoji.name)]
            }
        }

        // Prompt for and get division
        let divisionOptions = '';
        Object.keys(roles).forEach((key, index) => {
            divisionOptions += `${consts.ReactionNumbers[index + 1]}: ${key} \n`
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
        for (const [index, team] of Object.keys(division.teams).entries()) {
            await awayTeamMessage.react(consts.ReactionNumbers[index + 1]);
        }
        const awayCollected = await awayTeamMessage.awaitReactions(optionFilter, reactionOptions);
        let redTeamRole = Helper.getRole(server, teamMap[awayCollected.first().emoji.name]);

        // Finally, create the channel with all the info prompted for by the bot
        // If home team and away team are the same, it's a bye week
        if(redTeamRole.id === blueTeamRole.id){
            createByeWeekWith(blueTeamRole, division, prefixString, message.channel);
        } else {
            createMatchChannelWith(blueTeamRole, redTeamRole, division, prefixString, message.channel);
        }


    }
}

module.exports = MakeMatchCommand;
