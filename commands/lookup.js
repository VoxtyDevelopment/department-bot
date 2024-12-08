const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

async function createConnection(config) {
    if (!config.databaseConfig) {
        throw new Error('Database configuration is not defined in the config object.');
    }
    return await mysql.createConnection({
        host: config.databaseConfig.host,
        user: config.databaseConfig.user,
        password: config.databaseConfig.password,
        database: config.databaseConfig.database,
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Look up verification details for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to look up')
                .setRequired(true)),

    async execute(interaction, client, config) {
        if (!config.databaseEnabled) {
            await interaction.reply({ content: 'Database functionality is not enabled.', ephemeral: true });
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const requiredRoles = [config.deptstaff, config.HOD];

        const hasRole = member.roles.cache.some(role => requiredRoles.includes(role.id));

        if (!hasRole) {
            await interaction.reply({ content: 'You do not have the required roles to run this command.', ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        if (!user) {
            await interaction.reply({ content: 'User not found.', ephemeral: true });
            return;
        }

        try {
            const connection = await createConnection(config);
            const [rows] = await connection.execute(
                'SELECT * FROM verifications WHERE user_id = ?',
                [user.id]
            );
            await connection.end();

            if (rows.length === 0) {
                await interaction.reply({ content: 'No verification details found for this user.', ephemeral: true });
                return;
            }

            const verification = rows[0];
            const embed = new EmbedBuilder()
                .setTitle('Verification Details')
                .addFields(
                    { name: 'User ID', value: verification.user_id, inline: true },
                    { name: 'Username', value: verification.username, inline: true },
                    { name: 'Roleplay Name', value: verification.roleplay_name, inline: true },
                    { name: 'Teamspeak UID', value: verification.ts3_uid, inline: true },
                    { name: 'Web ID', value: verification.web_id, inline: true },
                    { name: 'Verified At', value: new Date(verification.created_at).toLocaleString(), inline: true },
                )
                .setColor(config.embedcolor || '#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Database query error:', error);
            await interaction.reply({ content: 'An error occurred while retrieving the verification details.', ephemeral: true });
        }
    },
};
