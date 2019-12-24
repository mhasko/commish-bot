"use strict";

const auth = require('../auth'),
    request = require('request'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    messages = require('../data/messages'),
    roles = require('../data/roles'),
    consts = require('../app/constants');

class MakeProDraft extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'makeprodraft',
            group: consts.CommandGroup.CAPTAIN,
            memberName: 'makeprodraft',
            description: 'Create a ProDraft link and paste the results into the channel',
            details: '',
            examples: ['\t!makeProDraft'],
            guildOnly: true,
            argsType: 'multiple'
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'makeProDraft' ) {
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
        // const pollBot = Helper.getRole(server, 'Pollmaster');
        const restrictedRole = Helper.getRole(server, consts.CommandGroup.CAPTAIN);
        const reactionOptions = {max: 1, time: 25000, errors: ['time']};
        const optionFilter = (reaction, user) => {
            return consts.ReactionNumbers.some((hex) => reaction.emoji.name === hex) && user.id === message.author.id;
        };

        const prodraftRoot = "http://prodraft.leagueoflegends.com";
        const locale = "en_US";

        let options = {
            uri: `http://prodraft.leagueoflegends.com/draft`,
            method: 'POST',
            json: true,
            headers: {'Content-Type': 'application/json'},
            body: {
                team1Name: 'blue',
                team2Name: 'red',
                matchName: 'matcdafdsfadfadhname'
            }
        };

        request(options, async function(err,response,body){
            const blueId = response.body.auth[0];
            const redId = response.body.auth[1];
            const draftId = response.body.id;
            await message.channel.send(`Blue draft link is: ${prodraftRoot}/?draft=${draftId}&auth=${blueId}`);
            await message.channel.send(`Red draft link is: ${prodraftRoot}/?draft=${draftId}&auth=${redId}`);
            await message.channel.send(`Spectator link is: ${prodraftRoot}/?draft=${draftId}&locale=${locale}`);

        });
    }
}

module.exports = MakeProDraft;
