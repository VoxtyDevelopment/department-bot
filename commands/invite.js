const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription(`Make an invite into the ${config.deptName} department.`)
    .addStringOption(option =>
        option.setName('duration')
          .setDescription('The duration of the invite in minutes')
          .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('uses')
        .setDescription('Max uses for the invite command')
        .setRequired(true)
    ),

    async execute(interaction, client, config) {
        const duration = interaction.options.getString('duration');
        const uses = interaction.options.getString('uses');
        const logChannel = client.channels.cache.get(config.logChannelID);
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if(!permission) return interaction.reply({content: "You do not have permission to execute this command.", ephemeral: true})

            const invite = await interaction.channel.createInvite({
                maxAge: duration * 60,
                maxUses: uses
            })       
        
            const log = new EmbedBuilder()
            .setTitle('Invite Link Generated')
            .setColor(config.embedcolor)
            .addFields(
                { name: 'Moderator', value: `<@${interaction.member.id}>`},
                { name: 'Duration', value: `${duration} minutes`},
                { name: 'Invite Link', value: `${invite.url}`}
            )
            .setThumbnail(config.deptLogo)
            .setTimestamp()

            logChannel.send({ embeds: [log]});

            interaction.reply(`The invited has been succesfully created and the duration is \`${duration} minutes\`\n\n${invite.url}`)
    }
}