const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('training')
        .setDescription('Schedule a training')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('The time for the training (e.g., Morning, Afternoon, Evening)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The date for the training (e.g., YYYY-MM-DD)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of training (e.g., Basic Training, Civ Training)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('max_attendees')
                .setDescription('Maximum number of attendees allowed for the training')
                .setRequired(true)),
    async execute(interaction, client, config) {
        const time = interaction.options.getString('time');
        const date = interaction.options.getString('date');
        const type = interaction.options.getString('type');
        const user = interaction.user.tag;
        const maxAttendees = interaction.options.getInteger('max_attendees');
        const formattedDate = formatDate(date);

        if (!formattedDate) {
            await interaction.reply({ content: 'Invalid date format. Please use YYYY-MM-DD.', ephemeral: true });
            return;
        }

        const deptLogo = config.deptLogo;
        const deptName = config.deptName;

        const responseEmbed = new EmbedBuilder()
            .setTitle('Training Scheduled')
            .setDescription(`${deptName} is hosting a training.`)
            .setThumbnail(deptLogo)
            .addFields(
                { name: 'Time', value: time, inline: true },
                { name: 'Date', value: formattedDate, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Host', value: user, inline: true },
                { name: 'Max Attendees', value: maxAttendees.toString(), inline: true }
            )
            .setColor(config.embedcolor || '#00FF00')
            .setTimestamp()
            .setFooter({ text: config.embedfooter, iconURL: config.deptlogo });

            const message = await interaction.reply({ embeds: [responseEmbed], fetchReply: true });

            await message.react('✅');
            await message.react('❌');

        const logEmbed = new EmbedBuilder()
            .setTitle('A new training session has been scheduled')
            .setThumbnail(deptLogo)
            .addFields(
                { name: 'User', value: user, inline: true },
                { name: 'Date', value: formattedDate, inline: true },
                { name: 'Training Info', value: `Time: ${time}, Type: ${type}`, inline: true }
            )
            .setColor(config.embedcolor || '#00FF00')
            .setTimestamp()
            .setFooter({ text: config.embedfooter, iconURL: config.deptlogo });

        const logChannel = interaction.guild.channels.cache.get(config.logChannelID);
        if (!logChannel) {
            console.error(`Channel with ID ${config.logChannelID} not found.`);
            await interaction.followUp({ content: 'Log channel not found. Please check the config.', ephemeral: true });
            return;
        }

        await logChannel.send({ embeds: [logEmbed] });
    },
};

function formatDate(inputDate) {
    const dateParts = inputDate.split('-');
    if (dateParts.length !== 3) return null;
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);

    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}