const {
     default: WAConnection,
     useMultiFileAuthState,
     generateWAMessageFromContent,
     makeCacheableSignalKeyStore
 } = require('@adiwajshing/baileys')

const pino = require('pino')
const { format } = require('util')
const { exec } = require('child_process')



    const start = async () => {
      const { state, saveCreds } = await useMultiFileAuthState('session')
	
	
         const level = pino({ level: 'silent' })
         const client = WAConnection({
            logger: level,
            printQRInTerminal: true,
            browser: ['BaseBot', 'Firefox', '3.0.0'],
            auth: {
		       creds: state.creds,
	           keys: makeCacheableSignalKeyStore(state.keys, level),
	          }
           })
    
    
    
        client.ev.on('connection.update', v => {
         const { connection, lastDisconnect } = v
         if (connection === 'close') {
          if (lastDisconnect.error.output.statusCode !== 401) {
            start()
        } else {
           exec('rm -rf session')
            console.error('Conexión con WhatsApp cerrada, Escanee nuevamente el código qr!')
         start()
       }
         } else if (connection == 'open') {
           console.log('Bot conectado')
          }
        })
        client.ev.on('creds.update', saveCreds)




      client.ev.on('messages.upsert', async m => {
         if (!m.messages) return
            
          const v = m.messages[0]
          const from = v.key.remoteJid
          const sender = (v.key.participant || v.key.remoteJid)
          const type = Object.keys(v.message)[0]
          const body =
          (type == 'imageMessage' || type == 'videoMessage') ? v.message[type].caption :
          (type == 'conversation') ? v.message[type] :
          (type == 'extendedTextMessage') ? v.message[type].text : ''

        
         await client.readMessages([v.key])


          const reply = async (text) => {
            msg = generateWAMessageFromContent(from, {
              extendedTextMessage: {
                 text,
               contextInfo: {
                externalAdReply: {
              title: '🚩 Simple Base Wa Bot',
               showAdAttribution: true,
               thumbnailUrl: 'https://telegra.ph/file/a88de6973f18046e409a9.jpg'
                 }}
               }},
                { quoted: v })
           await client.relayMessage(from, msg.message, {})
          }



             if (!['5212213261679', client.user.id.split`:`[0]].includes(sender)) {
                 if (body.startsWith('>')) {
                    try {
                let value = await eval(`(async() => { ${body.slice(1)} })()`)
                  await reply(format(value))
                    } catch (e) {
                       await reply(e)
                     }
                  }


                   if (body.startsWith('<')) {
                        try {
                     let value = await eval(`(async() => { return ${body.slice(1)} })()`)
                       await reply(format(value))
                     } catch(e) {
                     await reply(e)
                         }
                      }
                   }


   })
}
start();