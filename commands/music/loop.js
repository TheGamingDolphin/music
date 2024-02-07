const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Toggle loop mode"),
  async execute(interaction) {
    //check if member is in a vc
    if (!interaction.member.voice.channelId) {
      interaction.reply({
        content: "You must be in a voice channel to loop the queue!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Loop mode toggled sucessfully`,
        ephemeral: true,
      });
    }
  },
};
