import { Mutation, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { RegisterInput } from './register.input'
import { User } from '@prisma/client'
import clerk from '@clerk/clerk-sdk-node'
import * as sgMail from '@sendgrid/mail'

@Resolver()
export class AuthResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async register(
    @Context() context,
    @Args('newUserInput') registerInput: RegisterInput,
  ): Promise<string> {
    // create user in DB

    const user = await this.prisma.user.create({
      data: registerInput,
    })

    console.log('result', user)
    // Envoi email notification to admin
    const msg = {
      //extract the email details
      to: process.env.ADMIN_EMAIL_ADDRESS,
      from: process.env.SENDGRID_EMAIL_SENDER,
      templateId: 'd-6186abe0e7bd47e3bccb9166ec700cd2',
      dynamic_template_data: {
        userName: user.userName,
        userEmail: user.email,
      },
    }

    sgMail
      .send(msg)
      .then(() => {
        console.log('✓ Email de notification admin envoyé', msg)
      })
      .catch((error) => {
        //
        console.error(error.response)
      })

    return 'user enregistré'
  }
}
