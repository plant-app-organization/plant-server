import { Mutation, Resolver, Args, Context, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User, Offer } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import { Subscriber } from 'rxjs'
import * as sgMail from '@sendgrid/mail'
import axios from 'axios'

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

      //! notif utilisateur et admin
      const msg = {
        //extract the email details
        to: foundUser.email,
        from: {
          email: process.env.SENDGRID_EMAIL_SENDER,
          name: 'PlantB',
        },
        templateId: 'd-76757e76a01a4326a84a9e30c826aed7',
        //extract the custom fields
        dynamic_template_data: {
          plantName: newOffer.plantName,
          price: newOffer.price,
          picture: newOffer.pictures[0],
          userName: foundUser.userName,
        },
      }
      const admin_msg = {
        //extract the email details
        to: process.env.ADMIN_EMAIL_ADDRESS,
        from: {
          email: process.env.SENDGRID_EMAIL_SENDER,
          name: 'PlantB',
        },
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
      //! fin notif utilisateur et admin

      //**Notif followers */
      const followers = await this.prisma.user.findMany({
        where: {
          id: { in: foundUser.followersIds },
        },
        select: { userName: true, email: true },
      })
      for (let i = 0; i < followers.length; i++) {
        const follower_msg = {
          to: followers[i].email,
          from: {
            email: process.env.SENDGRID_EMAIL_SENDER,
            name: 'PlantB',
          },
          templateId: 'd-75fa160c4efe4ff4841cc60caebca3f6',

          dynamic_template_data: {
            plantName: newOffer.plantName,
            price: newOffer.price,
            picture: newOffer.pictures[0],
            userName: foundUser.userName,
            followerName: followers[i].userName,
          },
        }
        sgMail
          .send(follower_msg)
          .then(() => {
            console.log('📨 Email envoyé au follower envoyé')
          })
          .catch((error) => {
            console.error(error.response.body)
          })
        axios
          .post(`https://app.nativenotify.com/api/indie/notification`, {
            subID: followers[i].email,
            appId: 15168,
            appToken: '2NQv5UM3ppjj8VIDgMfgb4',
            title: `${foundUser.userName} a publié une nouvelle annonce!`,
            message: 'Soyez parmi les premiers à voir son annonce sur PlantB !',
          })
          .catch((error) => console.error('Erreur notification push:', error))
      }

      //**Fin notif followers */
      return !!newOffer
    } catch (error) {
      // If an error occurred, return false
      return false
    }
  }
}
