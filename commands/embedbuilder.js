const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embedbuilder')
        .setDescription('Send an embed'),

    async execute(interaction, client, config) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.deptstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if(!permission) return interaction.reply({content: config.noPermMsg, ephemeral: true })

        const modal = new ModalBuilder()
            .setCustomId('embed_modal')
            .setTitle('Embed Builder')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('embed_title')
                        .setLabel("Embed Title")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('embed_content')
                        .setLabel("Embed Content")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('embed_color')
                        .setLabel("Embed Color (Hex Code)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('embed_image')
                        .setLabel("Embed Image (Image Link)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('embed_footer')
                        .setLabel("Embed Footer")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal)

            client.on('interactionCreate', async interaction => {
                if (!interaction.isModalSubmit() || interaction.customId !== 'embed_modal') return;

                const channel = interaction.channel;

                const et = interaction.fields.getTextInputValue('embed_title');
                const ed = interaction.fields.getTextInputValue('embed_content');
                const ec = interaction.fields.getTextInputValue('embed_color');
                const ei = interaction.fields.getTextInputValue('embed_image');
                const ef = interaction.fields.getTextInputValue('embed_footer');    

        const embed = new EmbedBuilder()
            .setTitle(et)
            .setDescription(ed)
            .setColor(ec)
            .setTimestamp()
            .setFooter({ text: ef })
            .setThumbnail(ei)

        await channel.send({ embeds: [embed] });

        await interaction.reply({ content: 'Embed sent!', ephemeral: true })
    })
    }
}
