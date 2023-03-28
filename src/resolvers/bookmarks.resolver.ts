import { Mutation, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'

import { User } from '@prisma/client'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
@Resolver()
export class BookmarksResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async bookmarkOffer(@Context() context, @Args('offerId') offerId: string): Promise<boolean> {
    console.log('🔥offerId dans le resolver bookmarkOffer', offerId)

    // Get the authenticated user's ID
    const authorizationHeader = context.req.headers.authorization
    const token = authorizationHeader.split(' ')[1] // extract the token from the header
    console.log('token dans le header', token)

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
