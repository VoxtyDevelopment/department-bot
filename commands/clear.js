const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes the given amount of messages!')
        .addNumberOption(option => option
            .setName('amount')
            .setDescription('How many messages shall be deleted?')
            .setRequired(true)),

    async execute(interaction, client, config, con) {
        const amount = interaction.options.getNumber('amount');
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if(!permission) return interaction.reply({content: "You do not have permission to use this command.", ephemeral: true})

        if (amount < 1) {
            return interaction.reply({
                content: 'I must delete one or more messages!',
                ephemeral: true
            });
        }

        const deletedMessages = (
            await interaction.channel.bulkDelete(amount, true).catch(err => {
                console.error(err);
            })
        ).size;
        
        const DAM = deletedMessages.toString()

        interaction.reply({
            content: `I deleted ${deletedMessages} messages for you!`,
            ephemeral: true
        });

        const clearLogEmbed = new EmbedBuilder()

    .setTitle('Messages Cleared')
    .setColor(`${config.embedcolor}`)
    .addFields(
        { name: 'Moderator', value: `<@${interaction.member.id}>` },
        { name: 'Channel', value: `<#${interaction.channel.id}>` },
        { name: 'Amount Deleted', value: DAM },
    )
    .setImage(config.logo)
    .setTimestamp()
	.setFooter({ text: config.embedfooter, iconURL: config.logo });        

const logChannel = client.channels.cache.get(config.modLogs);
    logChannel.send({ embeds: [clearLogEmbed] });
    },
};