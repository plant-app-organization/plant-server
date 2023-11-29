import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import axios from 'axios'

@Controller('add-to-mailing-list')
export class MailinglistController {
  @Post()
  async addToMailinglist(@Body() body: any, @Res() res: Response) {
    const { email } = body
    console.log('email in add-to-mailing-list route', email)
    try {
      const response = await axios({
        method: 'put',
        url: 'https://api.sendgrid.com/v3/marketing/contacts',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        data: {
          contacts: [{ email }],
        },
      })

      if (response.status === 202) {
        res.json({ message: 'Email added to the mailing list successfully.' })
      } else {
        res.status(500).json({ message: 'Error adding email to the mailing list.' })
      }
    } catch (error) {
      res.status(500).json({ message: 'Error adding email to the mailing list.' })
    }
    return res.status(HttpStatus.OK).json({ message: 'Request processed successfully', data: body })
  }
}
