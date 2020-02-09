"use strict";

const request = require('request'),
    Commando = require('discord.js-commando'),
    consts = require('@app/constants'),
    Helper = require('@app/helper'),
    strings = require('@data/strings');

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
            args: [
                {
                    key: 'blueName',
                    prompt: strings.makeProDraft.blueTeamTri,
                    type: 'string',
                    wait: 15
                },
                {
                    key: 'redName',
                    prompt: strings.makeProDraft.redTeamTri,
                    type: 'string',
                    wait: 15
                },
                {
                    key: 'matchName',
                    prompt: strings.makeProDraft.draftTitle,
                    type: 'string',
                    wait: 25
                }
            ],
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
                    return ['unauthorized', message.reply('Only team captains can use this command.')];
                }
            }

            return false;
        });
    }

    async run(message, { blueName, redName, matchName }) {
        // validate that we have inputs, and if so, POST the data to the prodraft website
        if(blueName && redName && matchName && message){
            await this.postToProDraft(blueName.toUpperCase(), redName.toUpperCase(), matchName, message);
        }
    }

    async postToProDraft(blue, red, title, message) {
        const prodraftRoot = "http://prodraft.leagueoflegends.com";
        const locale = "en_US";

        // Options object that request needs to make the POST
        let options = {
            uri: `http://prodraft.leagueoflegends.com/draft`,
            method: 'POST',
            json: true,
            headers: {'Content-Type': 'application/json'},
            body: {
                team1Name: blue,
                team2Name: red,
                matchName: title
            }
        };

        // Make the POST, and if we get data in the response object, parse out the details so we can
        // reverse engineer the urls
        request(options, async function(err, response){
            const blueId = response.body.auth[0];
            const redId = response.body.auth[1];
            const draftId = response.body.id;

            // Send the draft links to the channel
            await message.channel.send(`(${blue}): Blue side draft link is: ${prodraftRoot}/?draft=${draftId}&auth=${blueId}\n.\n.\n`);
            await message.channel.send(`(${red}): Red side draft link is: ${prodraftRoot}/?draft=${draftId}&auth=${redId}\n.\n.\n`);
            await message.channel.send(`(SPECTATOR): Spectator draft link is: ${prodraftRoot}/?draft=${draftId}&locale=${locale}\n`);
        });
    }
}

module.exports = MakeProDraft;
