require('module-alias/register');

const Commando = require('discord.js-commando');
const path = require('path');
const token = require('@root/auth.json').token;
const owner = require('@root/auth.json').authorId;
const constants = require('@app/constants');
const Helper = require('@app/helper');

const prefix = '!cb';

const client = new Commando.Client({
    prefix: prefix,
    owner: owner,
    disableEveryone: true,
    unknownCommandResponse: false
});

let is_initialized = false;

client.registry
    .registerDefaultTypes()
    .registerGroup(constants.CommandGroup.ADMIN, constants.CommandGroup.ADMIN)
    .registerGroup(constants.CommandGroup.CAPTAIN, constants.CommandGroup.CAPTAIN)
    .registerGroup(constants.CommandGroup.BASIC, constants.CommandGroup.BASIC)
    .registerDefaultGroups()
    // .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client
    .on('error', console.error)
    .on('warn', console.warn)
    .on('debug', console.log)
    .on('ready', () => {
        console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);

        // Only initialize various classes once ever since ready event gets fired
        // upon reconnecting after longer outages
        if (!is_initialized) {
            Helper.setClient(client);

            is_initialized = true;
        }
    })
    .on('disconnect', () => { console.warn('Disconnected!'); })
    .on('reconnecting', () => { console.warn('Reconnecting...'); })
    .on('commandError', (cmd, err) => {
        // if(err instanceof commando.FriendlyError) return;
        console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
    })
    .on('commandBlocked', (msg, reason) => {
        console.log(`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
    })
    .on('commandPrefixChange', (guild, prefix) => {
        console.log(`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('commandStatusChange', (guild, command, enabled) => {
        console.log(`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('groupStatusChange', (guild, group, enabled) => {
        console.log(`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    });

client.login(token);


