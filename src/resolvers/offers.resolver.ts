import { Query, Resolver, Args, Context, Int } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { OfferInput } from './offer.input'
import { User } from '@prisma/client'

import { Offer } from './types/offer.model'
import clerk, { sessions } from '@clerk/clerk-sdk-node'
//comment
//.
@Resolver()
export class GetOffersResolver {
  constructor(private prisma: PrismaService) {}
  @Query((returns) => [Offer], { name: 'OffersList', description: 'Get List of Offers' })
  async getOffers(
    @Context() context,
    @Args('filters', { type: () => [String] }) filters: string[],
  ): Promise<Offer[]> {
    console.log('🔥filters dans resolver getOffers', filters)

    try {
      const where = filters?.length
        ? { OR: filters.map((filter) => ({ category: { contains: filter } })) }
        : {}
      const foundOffers = await this.prisma.offer.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
      })
      console.log('foundOffers', foundOffers)

      return foundOffers
    } catch (error) {
      // If an error occurred, return false
      throw new Error('Failed to get offers in GetOffers')
    }
  }

  @Query((returns) => [Offer], {
    name: 'OffersListSearch',
    description: 'Get List of Offers Searched',
  })
  async searchOffers(
    @Context() context,
    @Args('searchInput', { type: () => String }) searchInput: string,
    @Args('filters', { type: () => [String] }) filters: string[],
    @Args('environment', { type: () => String }) environment: string,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Offer[]> {
    console.log('==> offset', offset, 'limit', limit)
    // console.log('🔎searchInput dans resolver getOffers', searchInput)
    // console.log('🔥filters dans resolver getOffers', filters)
    // Get the authenticated user's ID
    const authorizationHeader = context.req.headers.authorization
    // console.log('context.req.headers.authorization', context.req.headers.authorization)
    console.log('searchInput', searchInput)
    // extract the token from the header
    // console.log('token dans le header', token)
    // console.log('environment', environment)
    // console.log(
    //   'new request : limit : ',
    //   limit,
    //   'offset : ',
    //   offset,
    //   filters,
    //   environment,
    //   searchInput,
    // )
    const environmentValues: string[] = []
    if (environment === '' || environment === 'indoorAndOutdoor') {
      environmentValues.push('indoor')
      environmentValues.push('outdoor')
    }
    if (environment === 'indoor') {
      environmentValues.push('indoor')
    }
    if (environment === 'outdoor') {
      environmentValues.push('outdoor')
    }
    if (context.req.headers.authorization) {
      const token = authorizationHeader.split(' ')[1]
      console.log('dans le if token')
      const client = await clerk.clients.verifyClient(token)
      console.log('client', client)
      console.log('userId', client.sessions[0].userId)
      const user = await clerk.users.getUser(client.sessions[0].userId)
      console.log('🪴user', user)

      const foundUser = await this.prisma.user.findUnique({
        where: {
          clerkId: client.sessions[0].userId,
        },
      })

      console.log('foundUser.email', foundUser.email)

      try {
        const foundOffers = await this.prisma.offer.findMany({
          where: {
            AND: [
              {
                OR: [
                  {
                    plantName: {
                      contains: searchInput,
                      mode: 'insensitive',
                    },
                  },
                  {
                    description: {
                      contains: searchInput,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
              {
                OR: filters?.length
                  ? filters.map((filter) => ({ category: { contains: filter } }))
                  : {},
              },
              ,
              {
                isActive: true,
              },
              {
                environment: {
                  in: environmentValues,
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        })
        // console.log('🔥foundOffers.length', foundOffers)

        const bookmarkedOffers = foundUser.bookmarks

        const foundOffersWithBookmarks = foundOffers.map((el) => {
          console.log('liké ou pas', bookmarkedOffers.includes(el.id))
          return { ...el, isBookmarked: bookmarkedOffers.includes(el.id) }
        })
        // console.log('foundOffersWithBookmarks', foundOffersWithBookmarks)
        return foundOffersWithBookmarks
      } catch (error) {
        // If an error occurred, return false
        throw new Error('Failed to find offers in searchOffers')
      }
    } else {
      console.log('dans le else')
      console.log('searcheInput', searchInput)
      try {
        const foundOffers = await this.prisma.offer.findMany({
          where: {
            AND: [
              {
                OR: [
                  {
                    plantName: {
                      contains: searchInput,
                      mode: 'insensitive',
                    },
                  },
                  {
                    description: {
                      contains: searchInput,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
              {
                OR: filters?.length
                  ? filters.map((filter) => ({ category: { contains: filter } }))
                  : {},
              },
              ,
              {
                isActive: true,
              },
              {
                environment: {
                  in: environmentValues,
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        })
        console.log('🔥foundOffers', foundOffers)

        return foundOffers
      } catch (error) {
        // If an error occurred, return false
        throw new Error('Failed to find offers')
      }
    }
  }
}
