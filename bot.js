const Discord = require('discord.js');
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');
const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token');
const { createCanvas, loadImage } = require('canvas');

const TEXT_CHANNEL_NAME = 'kai_bot_developers';

const client = new Discord.Client();
client.on('error', (err) => {
  console.error('Discord.js error:');
  console.error(err);
});

const daysLeft = Math.round((new Date('2019-08-27') - new Date()) / (1000 * 60 * 60 * 24));

const ttsClient = new textToSpeech.TextToSpeechClient();

if (!token) {
  throw 'Missing discord bot token!';
}

const config = {
  token
};


let textChannel;
let voiceConnection;

client.on('ready', async () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  let mostActiveVoiceChannel;
  let maxVoiceGuestsCount = 0;
  [...client.channels.entries()].forEach(async ([_, channel]) => {
    if (channel.name == TEXT_CHANNEL_NAME) {
      textChannel = channel;
    }
    if (channel.type === 'voice') {
      const guests = channel.members.size;
      if(guests > maxVoiceGuestsCount) {
        maxVoiceGuestsCount = guests;
        mostActiveVoiceChannel = channel;
      }
    }
  });

  client.user.setActivity(`TOP SECRET`);
  await hypeUpVoiceChannel(mostActiveVoiceChannel);
  const icon = await createIcon();
  setIcon(icon);
});


const hypeUpVoiceChannel = async (voiceChannel) => {

  const request = {
    input: { text: `Ahoj chlapci, klasik tu bude už o ${daysLeft} dní!. hajp hajp hajp jeeah` },
    // Select the language and SSML Voice Gender (optional)
    voice: { languageCode: 'sk-SK', name: 'sk-SK-Wavenet-A' },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3' }
  };

  // Performs the Text-to-Speech request
  ttsClient.synthesizeSpeech(request, async (err, response) => {
    if (err) {
      console.error('ERROR:', err);
      return;
    }

    // Write the binary audio content to a local file
    fs.writeFile('output.mp3', response.audioContent, 'binary', async err => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      console.log('Audio content written to file: output.mp3');
      voiceConnection = await voiceChannel.join();
      const dispatcher = voiceConnection.playFile('output.mp3');
      dispatcher.on('end', () => {
        setTimeout(() => {
          dispatcher.end();
          voiceChannel.leave();
        }, 1000)
      });
    });
  });
}

const createIcon = async () => {
  const canvas = createCanvas(260, 275)
  const ctx = canvas.getContext('2d')
  const textX = 6;
  const textY = 180;

// Draw line under text
  var text = ctx.measureText('Awesome!')
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.beginPath()
  ctx.lineTo(50, 102)
  ctx.lineTo(50 + text.width, 102)
  ctx.stroke()

  // Draw cat with lime helmet
  const image = await loadImage('kai-wow.png')
  ctx.drawImage(image,0,0)
  ctx.font = "110px Arial"
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgb(41, 61, 99)'
  ctx.strokeText(daysLeft.toString(), textX, textY);
  ctx.fillStyle = 'rgb(254, 217, 40)'
  ctx.fillText(daysLeft.toString(), textX, textY);

  return canvas.toBuffer('image/png');
}

const setIcon = (data) => client.guilds.first().setIcon(new Buffer(data, 'icon.png'), "WoW classic countdown update");

client.login(config.token);
