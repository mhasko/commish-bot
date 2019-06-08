const token = require('./auth.json').token;
const Commando = require('discord.js-commando');
const path = require('path');
const roles = require('./data/roles.json');
const Helper = require('./app/helper')

const client = new Commando.Client({
    prefix: '!',
    owner: '131632798153965568',
    disableEveryone: true
});

let is_initialized = false;

//
// client.setProvider(
//     sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
// ).catch(console.error);


client.registry
    .registerDefaultTypes()
    .registerGroup('admin', 'admin')
    .registerDefaultGroups()
    .registerDefaultCommands()
    // .registerCommandsIn(path.join(__dirname, 'commands'));
    .registerCommands([
        require('./commands/makematch')
        ]);


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
    });
    // .on('disconnect', () => { console.warn('Disconnected!'); })
    // .on('reconnecting', () => { console.warn('Reconnecting...'); })
    // .on('commandError', (cmd, err) => {
    //     if(err instanceof commando.FriendlyError) return;
    //     console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
    // })
    // .on('commandBlocked', (msg, reason) => {
    //     console.log(oneLine`
	// 		Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
	// 		blocked; ${reason}
	// 	`);
    // })
    // .on('commandPrefixChange', (guild, prefix) => {
    //     console.log(oneLine`
	// 		Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
	// 		${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
	// 	`);
    // })
    // .on('commandStatusChange', (guild, command, enabled) => {
    //     console.log(oneLine`
	// 		Command ${command.groupID}:${command.memberName}
	// 		${enabled ? 'enabled' : 'disabled'}
	// 		${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
	// 	`);
    // })
    // .on('groupStatusChange', (guild, group, enabled) => {
    //     console.log(oneLine`
	// 		Group ${group.id}
	// 		${enabled ? 'enabled' : 'disabled'}
	// 		${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
	// 	`);
    // });

client.login(token);


