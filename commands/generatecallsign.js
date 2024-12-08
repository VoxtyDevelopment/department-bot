const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

function generateRandomNumber(length) {
    return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

function generateCallsign() { 
    let prefix = '';
    prefix = config.callsignPrefix || '2L-';
    const randomNumber = generateRandomNumber(3);
    return `${prefix}${randomNumber}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatecallsign')
        .setDescription('Generate a temporary callsign')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to generate a callsign for')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const callsign = generateCallsign();
        const member = await interaction.guild.members.fetch(user.id);
        const rpname = `${member.displayName} ${callsign}`;
        await member.setNickname(rpname);
        const logChannel = interaction.guild.channels.cache.get(config.logChannelID);

        const logembed = new EmbedBuilder()
            .setTitle('Callsign Generated')
            .addFields(
                { name: 'User', value: `<@${user.id}>` },
                { name: 'Moderator', value: `<@${interaction.user.id}>` },
                { name: 'Callsign', value: callsign }
            )
            .setColor(config.embedcolor)
            .setThumbnail(config.deptLogo)
            .setTimestamp();
        
        logChannel.send({ embeds: [logembed] });

        const dmEmbed = new EmbedBuilder()
            .setTitle(`Temporary Callsign for ${config.deptName}`)
            .setDescription(`Your temporary callsign is: ${callsign}`)
            .setColor(config.embedcolor)
            .setThumbnail(config.deptLogo)
            .setTimestamp();
        
        await user.send({ embeds: [dmEmbed] });

        await interaction.reply({ content: `A callsign (${callsign}) for the user <@${user.id}> has sucessfully been generated.`});
    },
};