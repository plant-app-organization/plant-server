import { Query, Resolver, Args, Context } from '@nestjs/graphql'
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
      //   console.log('foundOffers', foundOffers)

      return foundOffers
    } catch (error) {
      // If an error occurred, return false
      throw new Error('Failed to get offers')
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
  ): Promise<Offer[]> {
    console.log('🔎searchInput dans resolver getOffers', searchInput)
    console.log('🔥filters dans resolver getOffers', filters)

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
          ],
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      return foundOffers
    } catch (error) {
      // If an error occurred, return false
      throw new Error('Failed to find offers')
    }
  }
}
