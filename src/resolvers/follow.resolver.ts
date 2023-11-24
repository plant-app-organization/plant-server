import { Mutation, Resolver, Args, Context, Query } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { Offer } from './types/offer.model'
import { User } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import * as sgMail from '@sendgrid/mail'
import axios from 'axios'

@Resolver()
export class FollowResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => Boolean)
  async follow(
    @Context() context,
    @Args('followedUserId') followedUserId: string,
  ): Promise<boolean> {
    console.log('🔥followedUserId dans le resolver follow', followedUserId)

    // Get the authenticated user's ID
    if (context.req.headers.authorization) {
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      // console.log('🥵token dans le header', token)

      const client = await clerk.clients.verifyClient(token)
      const followerUserOnClerk = await clerk.users.getUser(client.sessions[0].userId)

      if (client && followerUserOnClerk) {
        // console.log('client', client)
        // console.log('userId', client.sessions[0].userId)
        // console.log('🪴user', user)

        const followerUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        console.log('followerUser', followerUser)

        //Check if followingUser is already following followedUser
        if (!followerUser.followingIds.includes(followedUserId))
          try {
            const followedUser = await this.prisma.user.findUnique({
              where: {
                id: followedUserId,
              },
            })
            // D'abord, créez le follow
            const newFollow = await this.prisma.follow.create({
              data: {
                followedId: followedUserId,
                followerId: followerUser.id,
              },
            })
            console.log('=> newFollow', newFollow)
            // Enfin, mettez à jour l'utilisateur suiveur (follower) pour inclure le nouvel utilisateur suivi
            const updatedFollowerUser = await this.prisma.user.update({
              where: {
                id: followedUserId,
              },
              data: {
                followersIds: {
                  push: followerUser.id,
                },
              },
            })
            console.log('updatedFollowerUser', updatedFollowerUser)

            // Ensuite, mettez à jour l'utilisateur suivi (followed user) pour inclure le nouveau follower
            const updatedFollowingUser = await this.prisma.user.update({
              where: {
                id: followerUser.id,
              },
              data: {
                followingIds: {
                  push: followedUserId,
                },
              },
            })
            console.log('updatedFollowingUser', updatedFollowingUser)

            // * Notification à l'auteur de l'annonce
            axios
              .post(`https://app.nativenotify.com/api/indie/notification`, {
                subID: followedUser.email,
                appId: 15168,
                appToken: '2NQv5UM3ppjj8VIDgMfgb4',
                title: `PlantB`,
                message: `🪴 ${followerUser.userName} vous suit.`,
              })
              .catch((error) => console.error('Erreur notification push:', error))

            const msg = {
              to: followedUser.email,
              from: {
                email: process.env.SENDGRID_EMAIL_SENDER,
                name: 'PlantB',
              },
              templateId: 'd-6ee787c236c046fdbd292e845573805a',
              dynamic_template_data: {
                followerUser: followerUser.userName,
                followedUser: followedUser.userName,
              },
            }

            sgMail.send(msg).catch((error) => console.error('Erreur envoi email:', error))

            //   // * Notification admin
            //   const adminMsg = {
            //     to: process.env.ADMIN_EMAIL_ADDRESS,
            //     from: {
            //       email: process.env.SENDGRID_EMAIL_SENDER,
            //       name: 'PlantB',
            //     },
            //     templateId: 'd-c150579aa0fb408c8cb91c6d6477482b',
            //     dynamic_template_data: {
            //       userName: offerAuthor.userName,
            //       senderName: foundUser.userName,
            //       plantName: updatedOffer.plantName,
            //     },
            //   }

            //   sgMail.send(adminMsg).catch((error) => console.error('Erreur envoi email:', error))
            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
      } else {
        return false
      }
    }
  }

  @Mutation(() => Boolean)
  async unfollow(
    @Context() context,
    @Args('followedUserId') followedUserId: string,
  ): Promise<boolean> {
    console.log('UNFOLLOW 🔥followedUserId dans le resolver unfollow', followedUserId)

    // Get the authenticated user's ID
    if (context.req.headers.authorization) {
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      // console.log('🥵token dans le header', token)

      const client = await clerk.clients.verifyClient(token)
      const followerUserOnClerk = await clerk.users.getUser(client.sessions[0].userId)

      if (client && followerUserOnClerk) {
        // console.log('client', client)
        // console.log('userId', client.sessions[0].userId)
        // console.log('🪴user', user)

        const followerUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        console.log('UNFOLLOW followerUser', followerUser)

        const followedUser = await this.prisma.user.findUnique({
          where: {
            id: followedUserId,
          },
        })
        console.log(
          '+++> UNFOLLOW followerUser && followerUser.followingIds.includes(followedUserId)',
          followerUser && followerUser.followingIds.includes(followedUserId),
        )
        //Check if followingUser is already following followedUser
        if (followerUser && followerUser.followingIds.includes(followedUserId))
          try {
            const updatedFollowedUser = await this.prisma.user.update({
              where: {
                id: followedUserId,
              },
              data: {
                followersIds: {
                  set: followedUser.followersIds.filter((id) => id !== followerUser.id),
                },
              },
            })

            // Enfin, mettez à jour l'utilisateur suiveur (follower) pour inclure le nouvel utilisateur suivi
            const updatedFollowerUser = await this.prisma.user.update({
              where: {
                id: followerUser.id,
              },
              data: {
                followingIds: {
                  set: followerUser.followingIds.filter((id) => id !== followedUserId),
                },
              },
            })

            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
      } else {
        return false
      }
    }
  }
}
