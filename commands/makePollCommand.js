
"use strict";

const //log = require('loglevel').getLogger('MakeMatch'),
    auth = require('../auth'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    messages = require('../data/messages'),
    roles = require('../data/roles'),
    consts = require('../app/constants');

class MakePollCommandCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'makepollcommand',
            group: 'admin',
            memberName: 'makepollcommand',
            description: 'Create the command to make a poll',
            details: '',
            examples: ['\t!makepollcommand'],
            guildOnly: true,
            argsType: 'multiple'
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'makepollcommand' ) {
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
        let refDate = Helper.getNextDayOfTheWeek('Wed')
        let optionsString = "";

        //Brute forcing this string right now since weekend have afternoon options.
        optionsString += `Wed ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Thur ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Fri ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Sat ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 2p EST,`;
        optionsString += `Sat ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Sun ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 2p EST,`;
        optionsString += `Sun ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Mon ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST,`;
        refDate.setDate(refDate.getDate() + 1);
        optionsString += `Tue ${refDate.getUTCMonth() + 1}/${refDate.getUTCDate()} 9p EST`;
        refDate.setDate(refDate.getDate() + 1);

        message.channel.send(`pm!cmd -q "${messages.pollMessage}" -o "${optionsString}" -mc 0 -d "in 48 hours"`)

    }
}

module.exports = MakePollCommandCommand;
