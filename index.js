const { Client, Collection, GatewayIntentBits, EmbedBuilder, Partials, Events, ActionRowBuilder, MessageActionRow, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, MessageSelectMenu, ButtonBuilder, ButtonStyle, ModalBuilder } = require('discord.js');
const config = require('./config');
const path = require("path");
const fs = require('fs');
const mysql = require("mysql2");
const axios = require('axios');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages]});
global.config = config;
const {deploy} = require("./utilities/core/deploy-commands");

deploy()

if(config.databaseEnabled) {
    const con = mysql.createPool(
        {
        connectionLimit: `100`,
        user: config.databaseConfig.user,
        password: config.databaseConfig.password,
        host: config.databaseConfig.host,
        port: `3306`,
        database: config.databaseConfig.database,
        }
    )
    
    con.query(`
        CREATE TABLE IF NOT EXISTS verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            roleplay_name VARCHAR(255) NOT NULL,
            ts3_uid VARCHAR(255),
            web_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    con.query(`
        CREATE TABLE IF NOT EXISTS activemutes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guildId VARCHAR(255) NOT NULL,
            discId VARCHAR(255) NOT NULL,
            muteReason TEXT DEFAULT NULL,
            roles VARCHAR(255) NOT NULL,
            muteChannel VARCHAR(255) NOT NULL
        )
    `);
}
// API Validation
// async function checkLicenseKeyInAPI(key) {
//     try {
//         const response = await axios.post('https://api.ecrpc.online/validate', {
//             license_key: key
//         });

//         return response.status === 200 && response.data.valid;
//     } catch (error) {
//         if (error.response) {
//             console.error('Error validating license key:', error.message);
//         } else if (error.request) {
//             console.error('The API may be down or undergoing maintenance. Please contact the Vox Development Administration for more info.');
//             process.exit(1);
//         } else {
//             console.error('Error:', error.message);
//             process.exit(1);
//         }
//         return false;
//     }
// }

// (async () => {
//     const isValidLicense = await checkLicenseKeyInAPI(config.licenseKey);

//     if (isValidLicense) {
//         console.log('License key successfully validated. Enjoy your product.');
//     } else {
//         console.log('Exiting startup due to invalid license key.');
//         process.exit(1);
//     }
// })();

client.commands = new Collection();

const commandPath = path.join(__dirname, './commands');
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`)
    }
}


// Command Listener
client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return;
    }

    try{
        await command.execute(interaction, client, config);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: "there was an error while executing this command!", ephemeral: true})
    }
})

// Event Handler
const eventFiles = fs.readdirSync(path.join(__dirname, './events')).filter(file => file.endsWith('.js'));
for(const file of eventFiles) {
    const filePath = `./events/${file}`
    const event = require(filePath)
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
};

if (config.welcomeEnabled) {
    client.on('guildMemberAdd', (member) => {
       
        const welcomeChannel = member.guild.channels.cache.get(config.welcomechannel);
    
        const welcomeRole = member.guild.roles.cache.find(r => r.id === config.AwaitingVerRole);
        member.roles.add(welcomeRole);
    
        const welcomeembed = new EmbedBuilder()
        .setTitle(`Welcome to the ${config.deptName} department discord!`)
        .setDescription(`${member.user} Please ensure your name is updated to the ${config.servername} Community Format prior to requesting a role\n\nNote: Members requesting roles who are not a part of the ${config.deptName} must include their Primary Department Callsign. It is requested that ${config.deptName} Reserves also include their Primary Department Callsign to ensure they are given proper roles.\n\n**Requestable Roles:**`)
        .addFields(
            { name: `• ${config.RequestableRole1}`, value: `${config.Role1Description}`},
            { name: `• ${config.RequestableRole2}`, value: `${config.Role2Description}`},
            { name: `• ${config.RequestableRole3}`, value: `${config.Role3Description}`},
            { name: `• ${config.RequestableRole4}`, value: `${config.Role4Description}`},
            { name: `• ${config.servername} Admin`, value: `This role is for any ${config.servername} Administrators, that wish to be a part of the Discord that are in another department.`}
        )
        .setColor(`${config.embedcolor}`)
        .setThumbnail(config.deptlogo)
        .setTimestamp()
        .setFooter({ text: config.embedfooter, iconURL: config.deptlogo });
        
        welcomeChannel.send({ embeds: [welcomeembed]});
          
        });
}

client.login(config.token);
