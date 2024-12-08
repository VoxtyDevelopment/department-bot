const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketembed')
        .setDescription('Send ticket embed'),

    async execute(interaction, client, config) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.HOD);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle(config.ticketEmbedTitle || 'Request Teamspeak Password')
            .setDescription(config.ticketEmbedDescription || `Click the button below to request a password for the ${config.SN} Teamspeak`)
            .setColor(config.embedcolor)
            .setThumbnail(config.deptLogo)
            .setTimestamp()
            .setFooter({ text: config.embedfooter, iconURL: config.deptLogo });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel(config.ticketButtonLabel || '🔑 Request Teamspeak Password')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ content: config.ticketEmbedReply || 'Creating ticket embed...', ephemeral: true });

        const message = await interaction.channel.send({ embeds: [embed], components: [buttons] });

        const startCollector = () => {
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'open_ticket') {
                    const channelName = `${config.ticketChannelPrefix || 'ticket'}-${i.user.username}`;

                    const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName);

                    if (existingChannel) {
                        return i.reply({ content: config.ticketExistingChannelMsg || 'You already have an open ticket.', ephemeral: true });
                    }

                    const permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: i.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        },
                        {
                            id: config.deptstaff,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        },
                        {
                            id: config.HOD,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        }
                    ];

                    const channel = await interaction.guild.channels.create({
                        name: channelName,
                        type: 0, 
                        parent: config.ticketcatagory,
                        permissionOverwrites: permissionOverwrites
                    });

                    await channel.send(config.ticketWelcomeMsg || `Welcome ${i.user}, a staff member will be with you shortly.`);

                    const closeTicketButton = new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel(config.ticketCloseButtonLabel || '❌ Close Ticket')
                        .setStyle(ButtonStyle.Danger);

                    const ticketMessage = await channel.send({
                        content: config.ticketCloseMsg || 'React with ❌ below to close this ticket.',
                        components: [new ActionRowBuilder().addComponents(closeTicketButton)]
                    });

                    const startCloseCollector = () => {
                        const closeCollector = ticketMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                        closeCollector.on('collect', async btnInteraction => {
                            if (btnInteraction.customId === 'close_ticket' && btnInteraction.user.id === i.user.id) {
                                await btnInteraction.deferUpdate();

                                if (config.transcriptsEnabled) {
                                    const transcript = await discordTranscripts.createTranscript(channel);
                                    const modLogsChannel = interaction.guild.channels.cache.get(config.modLogs);
                                    if (modLogsChannel) {
                                        await modLogsChannel.send({
                                            content: `Transcript for ${channelName}:`,
                                            files: [transcript]
                                        });
                                    }
                                }

                                await channel.delete();
                            }
                        });

                        closeCollector.on('end', () => {
                            startCloseCollector();
                        });
                    };

                    startCloseCollector();

                    await i.reply({ content: config.ticketCreatedMsg || 'Your ticket has been created.', ephemeral: true });
                }
            });

            collector.on('end', () => {
                startCollector();
            });
        };

        startCollector();
    }
};