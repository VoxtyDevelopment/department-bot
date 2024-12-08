const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Displays a list of banned members with pagination.'),

    async execute(interaction, client, config) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const logChannel = client.channels.cache.get(config.logChannelID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Banlist Command Used')
                .setColor(config.embedcolor)
                .addFields(
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Time', value: new Date().toLocaleString() }
                )
                .setTimestamp()
                .setThumbnail(config.deptLogo);

            logChannel.send({ embeds: [logEmbed] });
        }

        const bans = await interaction.guild.bans.fetch();
        if (bans.size === 0) {
            return interaction.reply('There are no banned members in this server.');
        }

        const bannedUsers = bans.map(ban => ({ user: ban.user.tag, reason: ban.reason || 'No reason provided' }));
        const maxPerPage = 15;
        let page = 0;

        const generateEmbed = (page) => {
            const start = page * maxPerPage;
            const end = start + maxPerPage;
            const currentBans = bannedUsers.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle('Banned Members')
                .setDescription(currentBans.map((ban, i) => `\`${start + i + 1}\`. **${ban.user}**\nReason: ${ban.reason}`).join('\n\n'))
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(bannedUsers.length / maxPerPage)}` })
                .setColor(config.embedcolor);

            return embed;
        };

        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= Math.ceil(bannedUsers.length / maxPerPage) - 1)
            );
        };

        const embedMessage = await interaction.reply({
            embeds: [generateEmbed(page)],
            components: [generateButtons(page)],
            fetchReply: true,
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'next') {
                page++;
            } else if (i.customId === 'prev') {
                page--;
            }
            await i.update({ embeds: [generateEmbed(page)], components: [generateButtons(page)] });
        });

        collector.on('end', async () => {
            await embedMessage.edit({ components: [] });
        });
    },
};
