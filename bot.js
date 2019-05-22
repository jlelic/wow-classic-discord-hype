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

const daysLeft = Math.floor((new Date('2019-08-27') - new Date()) / (1000 * 60 * 60 * 24));

const ttsClient = new textToSpeech.TextToSpeechClient();

if (!token) {
  throw 'Missing discord bot token!';
}

const config = {
  token
};


let textChannel;
let voiceConnection;

const texts = [
  'Tak počkať. Čo je v tých bedýnkach? vov klasik! už o # dní!',
  'Ahoj chlapci. hádajte čo! vov klasik tu bude už o # dní!',
  'Hej vy kuks, get redy, o # dní tu je klasik!',
  'jov jov jov, jaké ste levely? to je jedno lebo už o # dní budete levelovať na klasiku!',
  'No čo? Čo hráte? íív onlajn? alebo dead baj daylight? čo by ste povedali na klasik? už o # dní!',
  'Čaute. Viete čo je lepšie než cibuľa? 2 cibule? to nie, vov klasik! už o # dní!',
  'es es top a zrazu pudž sa tu zjavil. ale nie z hora ale z dola! ja to livnem a pôjdem hrať vov klasik. už o # dní!',
  'počúvaj. ty. tebe sa ten diel páčil? tak to počkaj až si zahraš vov klasik. už o # dní!',
  'dobrý deň. chcete čakať do levelu 40 aby ste si mohli kúpiť epik maunta? a aj tak nemôcť pretože nemáte 1000 goldov? vov klasik už o # dní!',
  'zomreli ste na hardkor? mam pre vás hru kde sa vám to nestane! vov klasik už o # dní!',
  'niekto známy raz povedal. citujem. ja už nehrám hry. koniec citácie. uvidíme či nebude hrať ani vov klasik. už o # dní!'
]

client.on('ready', async () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  let mostActiveVoiceChannel;
  let maxVoiceGuestsCount = 0;
  [...client.channels.entries()].forEach(async ([_, channel]) => {
    if (channel.name == TEXT_CHANNEL_NAME) {
      textChannel = channel;
    }
    if (channel.type === 'voice' && !channel.name.toLocaleLowerCase().includes('afk')) {
      const guests = channel.members.size;
      if(guests > maxVoiceGuestsCount) {
        maxVoiceGuestsCount = guests;
        mostActiveVoiceChannel = channel;
      }
    }
  });

  client.user.setActivity(`WoW Classic in ${daysLeft} days`);
  await hypeUpVoiceChannel(mostActiveVoiceChannel);
  const icon = await createIcon();
  setIcon(icon);
});


const hypeUpVoiceChannel = async (voiceChannel) => {
  const text = texts[Math.floor(texts.length*Math.random())].replace(/#/g, daysLeft)+'  hajp hajp hajp jeeah';
  const request = {
    input: { text },
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
      console.log('Audio content written to file output.mp3: ' + text);
      voiceConnection = await voiceChannel.join();
      const dispatcher = voiceConnection.playFile('output.mp3');
      dispatcher.on('end', async () => {
        setTimeout(async () => {
          dispatcher.end();
          voiceChannel.leave();
          await client.destroy();
          process.exit(0);
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
