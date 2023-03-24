import { detectLang } from './content_script/lang'
import { translate, TranslateMode } from './content_script/translate'
import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { v4 } from 'uuid'

const app = express()
app.use(bodyParser.json())

app.post('/translate', async (req: Request, res: Response) => {
  const translateMode = req.body.translate_mode as TranslateMode
  const text = req.body.text as string
  const detectTo = req.body.detect_to as string
  const apiKey = req.body.api_key as string
  const conversationId = req.body.conversation_id as string
  const detectFrom = (await detectLang(text)) ?? 'en'

  console.log(`Request received: translateMode: ${translateMode}, text: ${text}, detectFrom: ${detectFrom}, detectTo: ${detectTo}, apiKey: ${apiKey}, conversationId: ${conversationId}`)

  try {
    const response = await translate({
      mode: translateMode,
      text,
      selectedWord: '',
      detectFrom,
      detectTo,
      apiKey
    })
    const data = await response.json()
    console.log('data', JSON.stringify(data, null, 2))

    let translatedText = data.choices[0].message.content
    if (['”', '"', '」'].indexOf(translatedText[translatedText.length - 1]) >= 0) {
      translatedText = translatedText.slice(1, -1)
    }

    res.json({
      message_id: data.id,
      content: translatedText,
      conversation_id: conversationId || v4(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

const port = 9001
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
