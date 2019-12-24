"use strict";

const settings = require('../data/settings');

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
                    channels: {
                        bot_lab: guild.channels.find(channel => {
                            return channel.name === settings.channels.bot_lab;
                        }),
                        mod_bot_lab: guild.channels.find(channel => {
                            return channel.name === settings.channels.mod_bot_lab;
                        })
                    //     help: null,
                    },
                    roles
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

    static getNextDayOfTheWeek(dayName, excludeToday = true, refDate = new Date()) {
        const dayOfWeek = ["sun","mon","tue","wed","thu","fri","sat"]
            .indexOf(dayName.slice(0,3).toLowerCase());
        if (dayOfWeek < 0) return;
        refDate.setHours(0,0,0,0);
        refDate.setDate(refDate.getDate() + !!excludeToday +
            (dayOfWeek + 7 - refDate.getDay() - !!excludeToday) % 7);
        return refDate;
    }

    isManagement(message) {
        let is_mod_or_admin = false;

        if (message.channel.type !== 'dm') {
            const admin_role = this.getRole(message.guild, settings.roles.admin),
                moderator_role = this.getRole(message.guild, settings.roles.mod),

                admin_role_id = admin_role ?
                    admin_role.id :
                    -1,
                moderator_role_id = moderator_role ?
                    moderator_role.id :
                    -1

            is_mod_or_admin = message.member.roles.has(admin_role_id) ||
                message.member.roles.has(moderator_role_id)
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
        // if(!role_name) {return null;}
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
