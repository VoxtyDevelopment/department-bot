module.exports = {

   // general bot config
   guildId: '',
//    licenseKey: '', No longer needede
   token: '',
   clientId: '',
   logChannelID: '',
   botstatus: 'Vox/Belleview Development',
   deptLogo: '',
   deptName: '',
   embedfooter: '',
   DepartmentAbrv : "",
   servername: '',
   embedcolor: 'cdc58d', // HEX CODE
   HOD: '', // HEAD OF DEPARTMENT ROLE ID
   callsignPrefix: "",

   // Mute Command
   muteRole: 'Coventry', // NAME OF THE ROLE
   muteCategory: '', // ID OF THE CATEGORY

   // Welcome Message Embed
   welcomeEnabled: true,
   welcomechannel: "", // ID OF THE CHANNEL 
   RequestableRole1 : "test", // i.e. Part-Time Developer
   Role1Description : "test", // i.e. This role is for any members with the rank of Part-Time developer, who are not apart of the department full-time.
   RequestableRole2 : "test",
   Role2Description : "test",
   RequestableRole3 : "test",
   Role3Description : "test",
   RequestableRole4 : "test",
   Role4Description : "test",
   AwaitingVerRole: "", // Role ID
   
   // onboarding stuff
   memberrole: '', // ID
   probationary: '', // ID
   onboardchannel: '', // ID
   deptstaff: '', // ID
   onboardingteam: '', // ID
   // Tickets
   ticketEmbedTitle: 'Open A Ticket',
   ticketEmbedDescription: 'Vox Development Ticket',
   ticketButtonLabel: 'Open a Ticket',
   ticketEmbedReply: 'Your Ticket embed has been created.',
   ticketChannelPrefix: 'ticket',
   ticketExistingChannelMsg: 'You already have a ticket open.',
   ticketWelcomeMsg: 'Please wait for staff to get with you.',
   ticketCloseButtonLabel: 'Close Ticket',
   ticketCloseMsg: 'This Ticket has been closed.',
   ticketCreatedMsg: 'You have opened a ticket.',
   ticketcatagory: '', // Catagory For Tickets
   transcriptsEnabled: true, // Ticket Transcripts


   // database stuff
   "databaseEnabled": true, // recomemended you keep this on if you want to use all commands.
   "databaseConfig": {
       "host": "",
       "user": "",
       "password": "",
       "database": ""
   }
}  
