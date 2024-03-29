import { Mutation, Resolver, Args, Context, Query } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { Offer } from './types/offer.model'
import { User } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
import * as sgMail from '@sendgrid/mail'
import axios from 'axios'

@Resolver()
export class BookmarksResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async bookmarkOffer(@Context() context, @Args('offerId') offerId: string): Promise<boolean> {
    console.log('🔥offerId dans le resolver bookmarkOffer', offerId)

    // Get the authenticated user's ID
    if (context.req.headers.authorization) {
      console.log('bookmarksresolver dans le if')
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      // console.log('🥵token dans le header', token)

      const client = await clerk.clients.verifyClient(token)
      const user = await clerk.users.getUser(client.sessions[0].userId)

      if (client && user) {
        // console.log('client', client)
        // console.log('userId', client.sessions[0].userId)
        // console.log('🪴user', user)

        const foundUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        // console.log('foundUser', foundUser)

        //Check if user has already bookmarked this offer
        const offer = await this.prisma.offer.findUnique({
          where: {
            id: offerId,
          },
          select: {
            bookmarkedBy: true,
          },
        })
        const bookmarksContainOfferId = foundUser.bookmarks.includes(offerId)
        console.log('🧡bookmarksContainOfferId', bookmarksContainOfferId)
        const bookmarkedByContainUserId = offer.bookmarkedBy.includes(foundUser.id)
        console.log('bookmarkedByContainUserId', bookmarkedByContainUserId)
        // if not Create a new bookmark for the user and offer
        if (!bookmarksContainOfferId) {
          try {
            const updatedUser = await this.prisma.user.update({
              where: {
                id: foundUser.id,
              },
              data: {
                bookmarks: {
                  push: offerId,
                },
              },
            })

            const updatedOffer = await this.prisma.offer.update({
              where: {
                id: offerId,
              },
              data: {
                bookmarkedBy: {
                  push: foundUser.id,
                },
              },
            })
            // console.log('updatedUser', updatedUser)
            console.log('updatedOffer', updatedOffer)
            //* get offer author email
            const offerAuthor = await this.prisma.user.findUnique({
              where: { id: updatedOffer.authorId },
            })

            // * Notification à l'auteur de l'annonce
            axios
              .post(`https://app.nativenotify.com/api/indie/notification`, {
                subID: offerAuthor.email,
                appId: 15168,
                appToken: '2NQv5UM3ppjj8VIDgMfgb4',
                title: `💚 ${foundUser.userName} a ajouté ${updatedOffer.plantName} à ses favoris !`,
                message: `Si c'est un coup de cœur, peut-être que tu feras une vente ?`,
              })
              .catch((error) => console.error('Erreur notification push:', error))

            const msg = {
              to: offerAuthor.email,
              from: {
                email: process.env.SENDGRID_EMAIL_SENDER,
                name: 'PlantB',
              },
              templateId: 'd-80a82623ce22424c83ae86c142013097',
              dynamic_template_data: {
                userName: offerAuthor.userName,
                senderName: foundUser.userName,
                plantName: updatedOffer.plantName,
                picture: updatedOffer.pictures[0],
                price: updatedOffer.price,
              },
            }

            sgMail.send(msg).catch((error) => console.error('Erreur envoi email:', error))

            // * Notification admin
            const adminMsg = {
              to: process.env.ADMIN_EMAIL_ADDRESS,
              from: {
                email: process.env.SENDGRID_EMAIL_SENDER,
                name: 'PlantB',
              },
              templateId: 'd-c150579aa0fb408c8cb91c6d6477482b',
              dynamic_template_data: {
                userName: offerAuthor.userName,
                senderName: foundUser.userName,
                plantName: updatedOffer.plantName,
              },
            }

            sgMail.send(adminMsg).catch((error) => console.error('Erreur envoi email:', error))
            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
        } else {
          // already in bookmarks => Delete bookmark
          try {
            const updatedUser = await this.prisma.user.update({
              where: {
                id: foundUser.id,
              },
              data: {
                bookmarks: {
                  set: foundUser.bookmarks.filter((el) => el !== offerId),
                },
              },
            })
            const offer = await this.prisma.offer.findUnique({
              where: {
                id: offerId,
              },
              select: {
                bookmarkedBy: true,
              },
            })

            const removedOffer = await this.prisma.offer.update({
              where: {
                id: offerId,
              },
              data: {
                bookmarkedBy: {
                  set: offer.bookmarkedBy.filter((el) => el !== foundUser.id),
                },
              },
            })
            console.log('updatedUser', updatedUser)
            console.log('removedOffer', removedOffer)

            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
        }
      } else {
        return false
      }
    }
  }

  @Query(() => String)
  async getBookmarksByUserId(
    @Context() context,
    @Args('offerId') offerId: string,
  ): Promise<boolean> {
    console.log('🔥offerId dans le resolver bookmarkOffer', offerId)
    if (context.req.headers.authorization) {
      // Get the authenticated user's ID
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      console.log('token dans le header', token)

      const client = await clerk.clients.verifyClient(token)
      // console.log('client', client)
      // console.log('userId', client.sessions[0].userId)
      const user = await clerk.users.getUser(client.sessions[0].userId)
      // console.log('🪴user', user)
      if (client && user) {
        const foundUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        // console.log('foundUser', foundUser)

        //Check if user has already bookmarked this offer
        const offer = await this.prisma.offer.findUnique({
          where: {
            id: offerId,
          },
          select: {
            bookmarkedBy: true,
          },
        })
        const bookmarksContainOfferId = foundUser.bookmarks.includes(offerId)
        console.log('🧡bookmarksContainOfferId', bookmarksContainOfferId)
        const bookmarkedByContainUserId = offer.bookmarkedBy.includes(foundUser.id)
        console.log('bookmarkedByContainUserId', bookmarkedByContainUserId)
        // if not Create a new bookmark for the user and offer
        if (!bookmarksContainOfferId) {
          try {
            const updatedUser = await this.prisma.user.update({
              where: {
                id: foundUser.id,
              },
              data: {
                bookmarks: {
                  push: offerId,
                },
              },
            })

            const updatedOffer = await this.prisma.offer.update({
              where: {
                id: offerId,
              },
              data: {
                bookmarkedBy: {
                  push: foundUser.id,
                },
              },
            })
            // console.log('updatedUser', updatedUser)
            // console.log('updatedOffer', updatedOffer)

            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
        } else {
          // already in bookmarks => Delete bookmark
          try {
            const updatedUser = await this.prisma.user.update({
              where: {
                id: foundUser.id,
              },
              data: {
                bookmarks: {
                  set: foundUser.bookmarks.filter((el) => el !== offerId),
                },
              },
            })
            const offer = await this.prisma.offer.findUnique({
              where: {
                id: offerId,
              },
              select: {
                bookmarkedBy: true,
              },
            })

            const removedOffer = await this.prisma.offer.update({
              where: {
                id: offerId,
              },
              data: {
                bookmarkedBy: {
                  set: offer.bookmarkedBy.filter((el) => el !== foundUser.id),
                },
              },
            })
            console.log('updatedUser', updatedUser)
            console.log('removedOffer', removedOffer)

            return true
          } catch (error) {
            console.log('🤯error', error)
            return false
          }
        }
      }
    }
  }

  // get user bookmarks without any other information
  @Query((_returns) => [Offer], { nullable: false, name: 'userBookmarks' })
  async getUserBookmarks(@Context() context): Promise<Offer[]> {
    if (context.req.headers.authorization) {
      const authorizationHeader = context.req.headers.authorization
      const token = authorizationHeader.split(' ')[1] // extract the token from the header
      console.log('token dans le header', token)

      const client = await clerk.clients.verifyClient(token)
      console.log('client', client)
      console.log('userId', client.sessions[0].userId)
      const user = await clerk.users.getUser(client.sessions[0].userId)
      console.log('🪴user', user)

      if (client && user) {
        const foundUser = await this.prisma.user.findUnique({
          where: {
            clerkId: client.sessions[0].userId,
          },
        })

        console.log('foundUser', foundUser)
        const userAndBookmarks = await this.prisma.user.findUnique({
          where: { id: foundUser.id },
        })

        // Next, extract the offer IDs from the bookmarks array
        // const offerIds = userAndBookmarks.bookmarks.map((bookmark) => bookmark.id)

        // Finally, fetch the offers with the extracted IDs
        const bookmarks = await this.prisma.offer.findMany({
          where: { id: { in: userAndBookmarks.bookmarks } },
        })

        // Combine the offers with the user object

        return bookmarks
      }
    }
  }
}
