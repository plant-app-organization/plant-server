import { Mutation, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { RegisterInput } from './register.input'
import { UpdateUserProfileInput } from './updateUserProfile.input'
import { User } from '@prisma/client'
import { UserModel } from './types/user.model'
import clerk from '@clerk/clerk-sdk-node'
import * as sgMail from '@sendgrid/mail'
import getThumbnailAvatar from 'src/lib/getThumbnailAvatar'
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
  @Mutation(() => UserModel)
  async updateUserProfile(
    @Args('updateInput') updateInput: UpdateUserProfileInput,
    @Context() context,
  ): Promise<User> {
    // Récupérez l'utilisateur connecté
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1]
    const client = await clerk.clients.verifyClient(token)
    const foundUser = await this.prisma.user.findUnique({
      where: {
        clerkId: client.sessions[0].userId,
      },
    })

    if (!foundUser) {
      throw new Error('User not found')
    }
    console.log('updateInput', updateInput)
    console.log('new image avatar to save', updateInput.avatarUrl)
    // Mettez à jour l'utilisateur
    return updateInput.avatarUrl
      ? this.prisma.user.update({
          where: { id: foundUser.id },
          data: {
            userBio: updateInput.bio,
            avatar: updateInput.avatarUrl,
            avatarThumbnail: getThumbnailAvatar(updateInput.avatarUrl),
          },
        })
      : this.prisma.user.update({
          where: { id: foundUser.id },
          data: {
            userBio: updateInput.bio,
          },
        })
  }
}
