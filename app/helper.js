"use strict";

// const log = require('loglevel').getLogger('Helper');

class Helper {
    constructor() {
        // this.text = text;
        this.client = null;
        this.notify_client = null;
    }

    setClient(client) {
        this.client = client;

        this.guild = new Map(this.client.guilds.map(guild => {
            const roles = new Map(guild.roles.map(role => [role.name.toLowerCase(), role]));

            return [
                guild.id,
                {
                    // channels: {
                    //     bot_lab: guild.channels.find(channel => {
                    //         return channel.name === settings.channels.bot_lab;
                    //     }),
                    //     mod_bot_lab: guild.channels.find(channel => {
                    //         return channel.name === settings.channels.mod_bot_lab;
                    //     }),
                    //     unown: guild.channels.find(channel => {
                    //         return channel.name === settings.channels.unown;
                    //     }),
                    //     ex_announce_channel: guild.channels.find(channel => {
                    //         return channel.name === settings.channels.ex_gym_raids;
                    //     }),
                    //     help: null,
                    // },
                    roles
                    // emojis: null
                }
            ]
        }));
    }

    setNotifyClient(client) {
        this.notify_client = client;
    }

    getMemberForNotification(guild_id, member_id) {
        return this.notify_client.guilds.get(guild_id).members.get(member_id)
    }

    isManagement(message) {
        let is_mod_or_admin = false;

        if (message.channel.type !== 'dm') {
            const admin_role = this.getRole(message.guild, 'admin'),
                moderator_role = this.getRole(message.guild, 'moderator'),
                tribunal_role = this.getRole(message.guild, 'the tribunal'),

                admin_role_id = admin_role ?
                    admin_role.id :
                    -1,
                moderator_role_id = moderator_role ?
                    moderator_role.id :
                    -1,
                tribunal_role_id = tribunal_role ?
                    tribunal_role.id :
                    -1;

            is_mod_or_admin = message.member.roles.has(admin_role_id) ||
                message.member.roles.has(moderator_role_id) ||
                message.member.roles.has(tribunal_role_id);
        }
        return is_mod_or_admin || this.client.isOwner(message.author);
    }

    isBotChannel(message) {
        if (message.channel.type === 'dm') {
            return false;
        }

        const guild = this.guild.get(message.guild.id),
            bot_lab_channel_id = guild.channels.bot_lab ?
                guild.channels.bot_lab.id :
                -1,
            mod_bot_lab_channel_id = guild.channels.mod_bot_lab ?
                guild.channels.mod_bot_lab.id :
                -1;

        return message.channel.id === bot_lab_channel_id || message.channel.id === mod_bot_lab_channel_id;
    }

    getRole(guild, role_name) {
        const guild_map = this.guild.get(guild.id);

        return guild_map.roles.get(role_name.toLowerCase());
    }

    getText(path, message) {
        let text = this.text;
        for (let key of path.split('.')) {
            text = text[key];
        }

        // replace variables in text
        return this.replaceText(text, message);
    }

    replaceText(text, message) {
        // quick search for variables to replace
        if (text.search(/\$\{.*?\}/g) >= 0) {
            // replace guild related variables (if any exist)
            if (message && message.guild && message.guild.id) {
                const guild = this.guild.get(message.guild.id);
                text = text.replace(/\$\{bot_channel\}/g, guild.channels.bot_lab.toString());
            }
        }

        return text;
    }
}

module.exports = new Helper();
