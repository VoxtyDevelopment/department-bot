const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about a specified user or yourself.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to get information about')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .join(', ') || 'None';

        const embed = new EmbedBuilder()
            .setTitle(`${target.username}'s Information`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: `${target.tag}`, inline: true },
                { name: 'User ID', value: `${target.id}`, inline: true },
                { name: 'Joined Server On', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: 'Account Created On', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Roles', value: roles },
                { name: 'Bot', value: `${target.bot ? 'Yes' : 'No'}`, inline: true }
            )
            .setColor(config.embedcolor)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [embed] });
    },
};
