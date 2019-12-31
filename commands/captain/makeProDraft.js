"use strict";

const request = require('request'),
    Commando = require('discord.js-commando'),
    consts = require('@app/constants'),
    Helper = require('@app/helper');

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
            throttling: {
                usages: 2,
                duration: 60,
            }
        });

        client.dispatcher.addInhibitor(message => {
            if(!!message.command && message.command.name.toLowerCase() === 'makeprodraft' ) {
                if(Helper.isManagement(message) ){
                    return false;
                }
                if(!Helper.isCaptain(message)) {
                    return ['unauthorized', message.reply('You are not authorized to use this command.')];
                }
            }

            return false;
        });
    }

    // Provide a wizard to walk the user through all the options
    async run(message) {
        let blueName = 'blu';
        let redName = 'red';
        let matchName = '';

        const prodraftRoot = "http://prodraft.leagueoflegends.com";
        const locale = "en_US";
        const filter = m => m;

        await message.channel.send(`What is the tricode for the blue side team?`);
        const blueTeamName = await message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
            .then(collected =>  {
                blueName = collected.first();
            })
            .catch(collected => {
                message.channel.send(`ProDraft canceld, timeout`);
                return false;
            });

        await message.channel.send(`What is the tricode for the red side team?`);
        const redTeamName = await message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
            .then(collected =>  {
                redName = collected.first();
            })
            .catch(collected => {
                message.channel.send(`ProDraft canceld, timeout`);
                return false;
            });

        await message.channel.send(`What is the title for the draft?`);
        const titleName = await message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
            .then(collected =>  {
                matchName = collected.first();
            })
            .catch(collected => {
                message.channel.send(`ProDraft canceld, timeout`);
                return false;
            });

        let options = {
            uri: `http://prodraft.leagueoflegends.com/draft`,
            method: 'POST',
            json: true,
            headers: {'Content-Type': 'application/json'},
            body: {
                team1Name: blueName.content.toUpperCase(),
                team2Name: redName.content.toUpperCase(),
                matchName: matchName.content
            }
        };

        request(options, async function(err, response){
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
