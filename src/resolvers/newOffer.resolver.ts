import { Mutation, Resolver, Args, Context, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User, Offer } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import { Subscriber } from 'rxjs'
import * as sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//comment
@Resolver()
export class NewOfferResolver {
  private pubSub: PubSub
  constructor(private prisma: PrismaService) {
    this.pubSub = new PubSub()
  }

  @Mutation(() => String)
  async createNewOffer(
    @Context() context,
    @Args('newOfferInput') offerInput: OfferInput,
  ): Promise<boolean> {
    console.log('🔥offerInput dans le resolver newOffer', offerInput)
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    // console.log('token dans le header', token)

    const client = await clerk.clients.verifyClient(token)
    // console.log('client', client)
    // console.log('userId', client.sessions[0].userId)
    const user = await clerk.users.getUser(client.sessions[0].userId)
    // console.log('🪴user', user)

    const foundUser = await this.prisma.user.findUnique({
      where: {
        clerkId: client.sessions[0].userId,
      },
    })

    console.log('foundUser', foundUser)
    const newOffer = await this.prisma.offer.create({
      data: { ...offerInput, authorId: foundUser.id },
    })
    console.log('👉🏻newOffer', newOffer)
    try {
      console.log('🤩')

      const updateUser = await this.prisma.user.update({
        where: {
          clerkId: client.sessions[0].userId,
        },
        data: {
          offerIds: {
            push: newOffer.id,
          },
        },
      })
      // console.log('updateUser', updateUser)

      const msg = {
        //extract the email details
        to: foundUser.email,
        from: process.env.SENDGRID_EMAIL_SENDER,
        templateId: 'd-6512303bbdbb4ae88d9ba2b47b787c66',
        //extract the custom fields
        dynamic_template_data: {
          plantName: newOffer.plantName,
          price: newOffer.price,
          picture: newOffer.pictures[0],
        },
      }
      const admin_msg = {
        //extract the email details
        to: process.env.ADMIN_EMAIL_ADDRESS,
        from: process.env.SENDGRID_EMAIL_SENDER,
        templateId: 'd-ea1d2cf084814c7f8072e6208c72a6d1',
        //extract the custom fields
        dynamic_template_data: {
          userName: foundUser.userName,
          plantName: newOffer.plantName,
          description: newOffer.description,
          price: newOffer.price,
          city: newOffer.city,
          picture1: newOffer.pictures[0],
          picture2: newOffer.pictures[1],
          picture3: newOffer.pictures[2],
        },
      }
      this.pubSub.publish('offerAdded', { offerAdded: newOffer })

      sgMail
        .send(msg)
        .then(() => {
          console.log('📨 Email de confirmation envoyé')
        })
        .catch((error) => {
          console.error(error.response.body)
        })
      sgMail
        .send(admin_msg)
        .then(() => {
          console.log('📨 Email admin envoyé')
        })
        .catch((error) => {
          console.error(error.response.body)
        })
      return !!newOffer
    } catch (error) {
      // If an error occurred, return false
      return false
    }
  }
}
