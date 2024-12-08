const { SlashCommandBuilder, EmbedBuilder } = require ('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason the user is being unbanned')
                .setRequired(false)),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const logChannel = interaction.guild.channels.cache.get(config.logChannelID);

        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: `You don't have permission to use this command.` });
        }

        try {
            const bannedUsers = await interaction.guild.bans.fetch();
            const bannedUser = bannedUsers.get(userId);
            if (!bannedUser) {
                return interaction.reply({ content: `No user with ID ${userId} is currently banned.` });
            }

            await interaction.guild.bans.remove(userId, reason);

            const embed = new EmbedBuilder()
                .setTitle('User Unbanned')
                .addFields(
                    { name: 'Moderator', value: `<@${interaction.user.id}>` },
                    { name: 'User Unbanned', value: `<@${userId}>` },
                    { name: 'Reason', value: reason }
                )
                .setColor(config.embedcolor)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

            await interaction.reply({ content: `<@${userId}> has been unbanned for: ${reason}.` });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error while trying to unban the user. Please try again later.', ephemeral: true });
        }
    },
};
