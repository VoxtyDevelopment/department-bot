const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason the user was banned')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const logChannel = interaction.guild.channels.cache.get(config.logChannelID);

        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({content: `You don't have permissions to use this command` });
        }

        const member = interaction.guild.members.cache.get(user.id)
        await member.ban({ reason: reason });

        const embed = new EmbedBuilder()
        .setTitle('User Banned')
        .addFields(
            { name: 'Moderator', value: `<@${interaction.user.id}>` },
            { name: 'User Banned ', value: `<@${user.id}>` },
            { name: 'Reason', value: reason }
        )
        .setColor(config.embedcolor)
        .setTimestamp();

        
        await logChannel.send({ embeds: [embed] });

        await interaction.reply({ content: `<@${user.id}> has been banned for: ${reason}.`});
    },
};
