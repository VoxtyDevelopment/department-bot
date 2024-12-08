const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const mysql = require('mysql2/promise');

const submittedUsers = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('onboard')
        .setDescription('Send onboard verification embed'),

    async execute(interaction, client, config) {
        if (!interaction.member.roles.cache.has(config.HOD)) {
            await interaction.reply({ content: "You do not have the required role to use this command.", ephemeral: true });
            return;
        }

        const embedColor = config.embedcolor || '#00FF00';

        const embed = new EmbedBuilder()
            .setTitle('Onboard Verification')
            .setDescription(`Click the button below to get verified for ${config.deptName}`)
            .setColor(embedColor)
            .setThumbnail(config.deptLogo)
            .setTimestamp()
            .setFooter({ text: config.embedfooter, iconURL: config.deptLogo });

        const button = new ButtonBuilder()
            .setCustomId('get_verified')
            .setLabel('✅ Get Verified')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ content: 'Creating onboard embed...', ephemeral: true });
        const sentMessage = await interaction.channel.send({ embeds: [embed], components: [actionRow] });

        const filter = i => i.customId === 'get_verified';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'get_verified') {
                if (submittedUsers.has(i.user.id)) {
                    await i.reply({ content: "You've already entered your information.", ephemeral: true });
                } else {
                    const modal = new ModalBuilder()
                        .setCustomId('verify_modal')
                        .setTitle('Verification Form')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('roleplay_name')
                                    .setLabel("Roleplay Name")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('ts3_uid')
                                    .setLabel("Teamspeak UID")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('web_id')
                                    .setLabel("Web ID")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );

                    await i.showModal(modal);
                }
            }
        });

        client.on('interactionCreate', async interaction => {
            if (!interaction.isModalSubmit() || interaction.customId !== 'verify_modal') return;

            const roleplayName = interaction.fields.getTextInputValue('roleplay_name');
            const ts3Uid = interaction.fields.getTextInputValue('ts3_uid');
            const webId = interaction.fields.getTextInputValue('web_id');

            if (submittedUsers.has(interaction.user.id)) {
                await interaction.reply({ content: "You've already entered your information.", ephemeral: true });
                return;
            }

            submittedUsers.add(interaction.user.id);

            const logChannel = interaction.guild.channels.cache.get(config.logChannelID);
            if (!logChannel) {
                console.error(`Log channel with ID ${config.logChannelID} not found.`);
                await interaction.reply({ content: "Log channel not found.", ephemeral: true });
                return;
            }

            const verificationEmbed = new EmbedBuilder()
                .setTitle('New Verification Request')
                .setDescription(`**User:** ${interaction.user.username}\nPlease review the information and take action:`)
                .addFields(
                    { name: 'Roleplay Name', value: roleplayName },
                    { name: 'Teamspeak UID', value: ts3Uid },
                    { name: 'Web ID', value: webId }
                )
                .setColor(embedColor)
                .setTimestamp()
                .setFooter({ text: config.embedfooter, iconURL: config.deptLogo });

            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_${interaction.user.id}`)
                .setLabel('✅ Accept Onboard')
                .setStyle(ButtonStyle.Success);

            const denyButton = new ButtonBuilder()
                .setCustomId(`deny_${interaction.user.id}`)
                .setLabel('❌ Deny Onboard')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(acceptButton, denyButton);

            try {
                const verificationMessage = await logChannel.send({ embeds: [verificationEmbed], components: [actionRow] });

                const buttonFilter = i => (i.customId === `accept_${interaction.user.id}` || i.customId === `deny_${interaction.user.id}`) && i.message.id === verificationMessage.id;
                const buttonCollector = verificationMessage.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

                buttonCollector.on('collect', async i => {
                    const hasRole = i.member.roles.cache.has(config.deptstaff) || i.member.roles.cache.has(config.onboardingteam) || i.member.roles.cache.has(config.HOD);
                    if (!hasRole) {
                        await i.reply({ content: "You do not have the required roles to accept onboardings.", ephemeral: true });
                        return;
                    }

                    if (i.customId === `accept_${interaction.user.id}`) {
                        try {
                            const member = await interaction.guild.members.fetch(interaction.user.id);
                            await member.roles.add([config.probationary, config.memberrole]);
                            await i.reply({ content: 'You have accepted the onboard request and roles have been added.', ephemeral: true });
                            await interaction.user.send(`Your verification in ${config.deptName} was accepted. Please read over the department documents.`);

                            if (config.databaseEnabled) {
                                const connection = await mysql.createConnection(config.databaseConfig);
                                await connection.execute(
                                    'INSERT INTO verifications (user_id, username, roleplay_name, ts3_uid, web_id) VALUES (?, ?, ?, ?, ?)',
                                    [interaction.user.id, interaction.user.username, roleplayName, ts3Uid, webId]
                                );
                            }
                        } catch (error) {
                            console.error('Failed to add roles or save to database:', error);
                            await i.reply({ content: 'An error occurred while processing the onboard request.', ephemeral: true });
                        }
                    } else if (i.customId === `deny_${interaction.user.id}`) {
                        await i.reply({ content: 'You have denied the onboard request.', ephemeral: true });
                        await interaction.user.send('Your onboard request has been denied.');
                    }
                });

                buttonCollector.on('end', async collected => {
                    if (collected.size === 0) {
                        try {
                            await verificationMessage.edit({ components: [] });
                        } catch (error) {
                            if (error.code !== 10008) {
                                console.error('Failed to edit message:', error);
                            }
                        }
                    }
                });

                await interaction.reply({ content: 'Your information has been submitted for verification.', ephemeral: true });
            } catch (error) {
                console.error('Failed to send verification message:', error);
                await interaction.reply({ content: 'An error occurred while sending the verification message.', ephemeral: true });
            }
        });
    },
};