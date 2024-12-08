const { Client, ActivityType } = require('discord.js');
const config = require('../config');

module.exports = {
    once: true,
    name: 'ready',
    async execute(client) {
        try {
            const activities = [
                { name: config.botstatus, type: ActivityType.Playing }
            ];
            let i = 0;
            client.user.setPresence({
                status: 'online',
                activities: [activities[i % activities.length]],
            });
            setInterval(() => {
                i++;
                client.user.setPresence({
                    status: 'online',
                    activities: [activities[i % activities.length]],
                });
            }, 300000);

            console.log("Services Are Running");
        } catch (error) {
            console.error('Error starting bot:', error);
            process.exit(1);
        }
    }
};